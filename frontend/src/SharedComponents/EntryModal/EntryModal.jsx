import React, { useState, useEffect } from "react";
import "../../CustomStyles/scrollbar.css";
import "../../CustomStyles/modal.css";
import { addUserCVData, updateUserCVData } from "../../graphql/graphqlHelpers";
import { useApp } from "../../Contexts/AppContext";
import ModalStylingWrapper from "../ModalStylingWrapper";
import DateEntry, { validateDateFields } from "./DateEntry";
import DropdownEntry from "./DropdownEntry";
import TextEntry from "./TextEntry";
import BooleanEntry from "./BooleanEntry";

const EntryModal = ({
  isNew,
  section,
  onClose,
  entryType,
  fields,
  user_cv_data_id,
  fetchData,
}) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dateFieldName, setDateFieldName] = useState("");
  const [attributesType, setAttributesType] = useState(
    JSON.parse(section.attributes_type || "{}")
  );

  const { userInfo } = useApp();

  useEffect(() => {
    // Initialize formData with all fields
    setFormData(fields);

    // --- Date fields autofill ---
    // Handle "dates" (start/end date range)
    if ("dates" in fields) {
      setDateFieldName("dates");
      const datesStr = fields.dates || "";
      if (datesStr) {
        let startDateMonth = "";
        let startDateYear = "";
        let endDateMonth = "";
        let endDateYear = "";
        if (datesStr.includes(" - ")) {
          const [start, end] = datesStr.split(" - ");
          if (start && start.includes(", ")) {
            [startDateMonth, startDateYear] = start.split(", ");
          }
          if (end === "Current" || end === "None") {
            endDateMonth = end;
            endDateYear = end;
          } else if (end && end.includes(", ")) {
            [endDateMonth, endDateYear] = end.split(", ");
          }
        } else if (datesStr) {
          if (datesStr.includes(", ")) {
            [startDateMonth, startDateYear] = datesStr.split(", ");
          }
        }
        setFormData((prev) => ({
          ...prev,
          startDateMonth,
          startDateYear,
          endDateMonth,
          endDateYear,
        }));
      }
    }

    // Handle single start/end date fields (e.g., "Start Date", "End Date")
    if (section.attributes) {
      let newFormData = { ...fields };
      Object.entries(section.attributes).forEach(([displayName, snakeKey]) => {
        if (fields[displayName] !== undefined) {
          newFormData[snakeKey] = fields[displayName];
        }
        // For single start/end date fields, parse and set month/year
        if (displayName.toLowerCase().includes("start date") || displayName.toLowerCase().includes("end date")) {
          // Use the snake_case key for value if present, else fallback to displayName
          const val = fields[snakeKey] !== undefined ? fields[snakeKey] : fields[displayName];
          if (val && typeof val === "string" && val.includes(", ")) {
            const [month, year] = val.split(", ");
            const prefix = displayName.toLowerCase().includes("start") ? "start" : "end";
            newFormData[`${prefix}DateMonth`] = month;
            newFormData[`${prefix}DateYear`] = year;
          } else if (val === "Current" || val === "None") {
            const prefix = displayName.toLowerCase().includes("start") ? "start" : "end";
            newFormData[`${prefix}DateMonth`] = val;
            newFormData[`${prefix}DateYear`] = val;
          }
        }
      });
      setFormData((prev) => ({
        ...prev,
        ...newFormData,
      }));
    }

    // Autofill "Other" fields for dropdowns
    if (attributesType.dropdown) {
      Object.entries(attributesType.dropdown).forEach(([displayName, options]) => {
        const snakeKey =
          section.attributes && section.attributes[displayName] ? section.attributes[displayName] : displayName;
        const val = fields[snakeKey];
        if (options.includes("Other") && typeof val === "string" && val.startsWith("Other (")) {
          // Extract the value inside the parentheses
          const match = val.match(/^Other \((.*)\)$/);
          if (match) {
            setFormData((prev) => ({
              ...prev,
              [snakeKey]: "Other",
              [`${snakeKey}_other`]: match[1],
            }));
          }
        }
      });
    }
    
    // Autofill boolean fields - map snake_case values to display name keys for checkboxes
    if (attributesType.boolean && section.attributes) {
      Object.entries(attributesType.boolean).forEach(([displayName]) => {
        const snakeKey = 
          section.attributes && section.attributes[displayName] ? section.attributes[displayName] : displayName;
        
        // If the value exists with the snake_case key, map it to the display name for the checkbox
        if (fields[snakeKey] !== undefined) {
          setFormData((prev) => ({
            ...prev,
            [displayName]: !!fields[snakeKey], // Convert to true boolean
          }));
        }
      });
    }

  }, [fields]); // Added isNew to dependencies as it's used in parsing

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle checkbox inputs differently than text inputs
    if (type === 'checkbox') {
      setFormData((prevState) => ({
        ...prevState,
        [name]: checked,
      }));
      return;
    }

    // Auto-fill both endDateMonth and endDateYear if "Current" or "None" is selected
    if (name === "endDateMonth" && (value === "Current" || value === "None")) {
      setFormData((prevState) => ({
        ...prevState,
        endDateMonth: value,
        endDateYear: value,
      }));
      return;
    }
    if (name === "endDateYear" && (value === "Current" || value === "None")) {
      setFormData((prevState) => ({
        ...prevState,
        endDateMonth: value,
        endDateYear: value,
      }));
      return;
    }
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate date fields using DateEntry's validation
    if (attributesType.date) {
      const dateError = validateDateFields(formData, attributesType.date);
      if (dateError) {
        setError(dateError);
        return;
      }
    }

    // Validate dropdown fields
    if (attributesType.dropdown) {
      const dropdownAttrs = attributesType.dropdown;
      const dropdownKeys = Object.keys(dropdownAttrs);
      for (const displayName of dropdownKeys) {
        // Get the snake_case key from section.attributes
        const snakeKey =
          section.attributes && section.attributes[displayName] ? section.attributes[displayName] : displayName;
        if (!formData[snakeKey]) {
          setError(`Please select a value for the field "${displayName}".`);
          return;
        }
      }
    }

    // Validate Highlight field - if checked, ensure Highlight Notes is not empty
    if (attributesType.boolean) {
      const highlightAttr = Object.keys(attributesType.boolean).find(
        attr => attr.toLowerCase() === "highlight"
      );
      
      if (highlightAttr && formData[highlightAttr] === true) {
        // Find the Highlight Notes field (case insensitive)
        const highlightNotesKey = Object.keys(formData).find(
          key => key.toLowerCase().includes("highlight") && key.toLowerCase().includes("note")
        );
        
        if (!highlightNotesKey || !formData[highlightNotesKey] || formData[highlightNotesKey].trim() === "") {
          setError("Please provide Highlight Notes when marking an entry as a Highlight.");
          return;
        }
      }
    }

    // --- Date fields saving ---
    // For "dates" field, construct the string as before
    let updatedFormData = { ...formData };
    if (dateFieldName) {
      const { startDateMonth, startDateYear, endDateMonth, endDateYear, ...rest } = formData;
      const dates =
        endDateMonth === "Current"
          ? `${startDateMonth}, ${startDateYear} - ${endDateMonth}`
          : endDateMonth === "None"
          ? `${startDateMonth}, ${startDateYear}`
          : `${startDateMonth}, ${startDateYear} - ${endDateMonth}, ${endDateYear}`;
      updatedFormData = { ...rest, [dateFieldName]: dates };
    }

    // For single start/end date fields, construct their value as "Month, Year" or "Current"/"None"
    if (section.attributes) {
      Object.entries(section.attributes).forEach(([displayName, snakeKey]) => {
        if (displayName.toLowerCase().includes("start date") || displayName.toLowerCase().includes("end date")) {
          const prefix = displayName.toLowerCase().includes("start") ? "start" : "end";
          const month = formData[`${prefix}DateMonth`];
          const year = formData[`${prefix}DateYear`];
          if (month === "Current" || month === "None") {
            updatedFormData[snakeKey] = month;
          } else if (month && year) {
            updatedFormData[snakeKey] = `${month}, ${year}`;
          }
          // Remove the temporary fields from updatedFormData
          delete updatedFormData[`${prefix}DateMonth`];
          delete updatedFormData[`${prefix}DateYear`];
        }
      });
    }

    // Handle "Other" for dropdowns before saving
    if (attributesType.dropdown) {
      Object.entries(attributesType.dropdown).forEach(([displayName, options]) => {
        const snakeKey =
          section.attributes && section.attributes[displayName] ? section.attributes[displayName] : displayName;
        if (options.includes("Other") && formData[snakeKey] === "Other") {
          const otherVal = formData[`${snakeKey}_other`] || "";
          updatedFormData[snakeKey] = `Other (${otherVal})`;
          // Remove the temp field
          delete updatedFormData[`${snakeKey}_other`];
        }
      });
    }

    // Handle boolean fields - ensure they use snake_case keys and proper boolean values
    if (attributesType.boolean) {
      Object.entries(attributesType.boolean).forEach(([displayName]) => {
        const snakeKey = 
          section.attributes && section.attributes[displayName] ? section.attributes[displayName] : displayName;
        
        // If the original key exists in formData, ensure it's saved with snake_case key
        if (formData[displayName] !== undefined) {
          updatedFormData[snakeKey] = !!formData[displayName]; // Convert to true boolean
          
          // Remove original key if different from snake_case key
          if (displayName !== snakeKey) {
            delete updatedFormData[displayName];
          }
        }
      });
    }

    // Only keep snake_case keys as defined in section.attributes
    const allowedKeys = section.attributes ? Object.values(section.attributes) : [];
    const filteredFormData = Object.fromEntries(
      Object.entries(updatedFormData).filter(([key]) => allowedKeys.includes(key))
    );

    console.log("Submitting form data:", updatedFormData);

    try {
      if (isNew) {
        // Add new CV data
        await addUserCVData(userInfo.user_id, section.data_section_id, JSON.stringify(filteredFormData));
      } else {
        // Update existing CV data
        await updateUserCVData(user_cv_data_id, JSON.stringify(filteredFormData));
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Failed to save data. Please try again."); // User-friendly error message
    }
    setIsSubmitting(false);
    onClose(); // Close the modal after submission
    fetchData(); // Refresh data in the parent component
  };

  const years = Array.from({ length: 100 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );

  return (
    <ModalStylingWrapper>
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl min-w-[32rem] w-full max-h-[85vh] overflow-y-auto mx-4 relative">
        <form method="dialog" onSubmit={handleSubmit}>
          <h3 className="font-bold mb-3 text-lg">
            {isNew ? "Add" : "Edit"} {entryType}
          </h3>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            onClick={onClose}
          >
            ✕
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mt-4 w-full max-w-2xl">
            {/* Render fields in the desired order: date, dropdown, text */}
            {["date", "dropdown", "text", "boolean"].map((type) => {
              const attrsObj = attributesType && attributesType[type];
              if (!attrsObj) return null;
              if (type === "date") {
                return (
                  <DateEntry
                    attrsObj={attrsObj}
                    attributes={section.attributes}
                    formData={formData}
                    handleChange={handleChange}
                    years={years}
                  />
                );
              } else if (type === "dropdown") {
                return (
                  <DropdownEntry
                    attrsObj={attrsObj}
                    attributes={section.attributes}
                    formData={formData}
                    handleChange={handleChange}
                  />
                );
              } else if (type === "text") {
                return (
                  <TextEntry
                    attrsObj={attrsObj}
                    attributes={section.attributes}
                    formData={formData}
                    handleChange={handleChange}
                  />
                );
              } else if (type === "boolean") {
                return (
                  <BooleanEntry
                    attrsObj={attrsObj}
                    attributes={section.attributes}
                    formData={formData}
                    handleChange={handleChange}
                  />
                );
              }
              return null;
            })}
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-success text-white mt-3 py-1 px-2 w-1/5 min-h-0 h-8 leading-tight"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </ModalStylingWrapper>
  );
};

export default EntryModal;
