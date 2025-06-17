import React, { useState, useEffect } from "react";
import "../../CustomStyles/scrollbar.css";
import "../../CustomStyles/modal.css";
import { addUserCVData, updateUserCVData } from "../../graphql/graphqlHelpers";
import { useApp } from "../../Contexts/AppContext";
import ModalStylingWrapper from "../ModalStylingWrapper";
import DateEntry, { validateDateFields } from "./DateEntry";
import DropdownEntry from "./DropdownEntry";
import TextEntry from "./TextEntry";

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
        setFormData(prev => ({
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
        if (
          displayName.toLowerCase().includes("start date") ||
          displayName.toLowerCase().includes("end date")
        ) {
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
      setFormData(prev => ({
        ...prev,
        ...newFormData,
      }));
    }
  }, [fields]); // Added isNew to dependencies as it's used in parsing

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => {
      let newState = { ...prevState, [name]: value };

      // Special handling for end date fields to keep them synchronized
      if (name === "endDateMonth" || name === "endDateYear") {
        const currentMonth = newState.endDateMonth;
        const currentYear = newState.endDateYear;

        if (name === "endDateMonth") {
          if (value === "Current") {
            newState.endDateYear = "Current"; // If month is 'Current', year must be 'Current'
          } else if (value === "None") {
            newState.endDateYear = "None"; // If month is 'None', year must be 'None'
          } else {
            // If month is a real month, and year was 'Current'/'None', clear year
            if (currentYear === "Current" || currentYear === "None") {
              newState.endDateYear = "";
            }
          }
        } else if (name === "endDateYear") {
          if (value === "Current") {
            newState.endDateMonth = "Current"; // If year is 'Current', month must be 'Current'
          } else if (value === "None") {
            newState.endDateMonth = "None"; // If year is 'None', month must be 'None'
          } else {
            // If year is a real year, and month was 'Current'/'None', clear month
            if (currentMonth === "Current" || currentMonth === "None") {
              newState.endDateMonth = "";
            }
          }
        }
      }
      return newState;
    });

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
          section.attributes && section.attributes[displayName]
            ? section.attributes[displayName]
            : displayName;
        if (!formData[snakeKey]) {
          setError(`Please select a value for the field "${displayName}".`);
          return;
        }
      }
    }

    // --- Date fields saving ---
    // For "dates" field, construct the string as before
    let updatedFormData = { ...formData };
    if (dateFieldName) {
      const {
        startDateMonth,
        startDateYear,
        endDateMonth,
        endDateYear,
        ...rest
      } = formData;
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
        if (
          displayName.toLowerCase().includes("start date") ||
          displayName.toLowerCase().includes("end date")
        ) {
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

    // Only keep snake_case keys as defined in section.attributes
    const allowedKeys = section.attributes ? Object.values(section.attributes) : [];
    const filteredFormData = Object.fromEntries(
      Object.entries(updatedFormData).filter(([key]) => allowedKeys.includes(key))
    );

    console.log("Submitting form data:", updatedFormData);

    try {
      if (isNew) {
        // Add new CV data
        await addUserCVData(
          userInfo.user_id,
          section.data_section_id,
          JSON.stringify(filteredFormData)
        );
      } else {
        // Update existing CV data
        await updateUserCVData(
          user_cv_data_id,
          JSON.stringify(filteredFormData)
        );
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 mt-4 w-full max-w-2xl">
            {/* Render fields in the desired order: date, dropdown, text */}
            {["date", "dropdown", "text"].map((type) => {
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
