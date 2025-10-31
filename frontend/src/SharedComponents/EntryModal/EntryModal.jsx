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
import { useAuditLogger, AUDIT_ACTIONS } from "../../Contexts/AuditLoggerContext";

const EntryModal = ({ isNew, section, onClose, entryType, fields, user_cv_data_id, fetchData }) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dateFieldName, setDateFieldName] = useState("");
  const [attributesType, setAttributesType] = useState(JSON.parse(section.attributes_type || "{}"));
  // Special: For Courses Taught autocomplete
  const isCoursesTaughtSection =
    section?.title?.trim() === "8b. Courses Taught" ||
    section?.title?.trim() === "8b.3. Clinical Teaching" ||
    section?.title?.trim().toLowerCase().includes("courses taught") ||
    section?.title?.trim().toLowerCase().includes("clinical teaching");
  const [courseSearchResults, setCourseSearchResults] = useState([]);
  // Get courses and loading state from AppContext
  const { allCourses = [], isCourseLoading = false } = useApp();

  // Filter courses locally
  const filterCourseSuggestions = (query) => {
    if (!query || !allCourses.length) {
      setCourseSearchResults([]);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const results = allCourses.filter((c) => c.course?.toLowerCase().includes(lowerQuery));
    setCourseSearchResults(results);
  };

  const { userInfo } = useApp();
  const { logAction } = useAuditLogger();

  useEffect(() => {
    // Helper to parse date strings into day/month/year components
    const parseDateParts = (str, needsDayOptions) => {
      if (!str) return { day: "", month: "", year: "" };
      
      const trimmed = str.trim();
      
      // Handle special values
      if (trimmed === "Current" || trimmed === "None") {
        return { day: trimmed, month: trimmed, year: trimmed };
      }
      
      // Try "Day, Month, Year" (with commas)
      if (needsDayOptions && trimmed.includes(", ")) {
        const parts = trimmed.split(", ").map(p => p.trim());
        if (parts.length === 3) {
          return { day: parts[0], month: parts[1], year: parts[2] };
        }
      }
      
      // Try "Month, Year" (with comma - legacy format)
      if (trimmed.includes(", ")) {
        const parts = trimmed.split(", ").map(p => p.trim());
        if (parts.length === 2) {
          return { day: "", month: parts[0], year: parts[1] };
        }
      }
      
      // Try "Month Year" (space separated - preferred format)
      const monthYearMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
      if (monthYearMatch) {
        return { day: "", month: monthYearMatch[1], year: monthYearMatch[2] };
      }
      
      // Try just "Year"
      const yearMatch = trimmed.match(/^(\d{4})$/);
      if (yearMatch) {
        return { day: "", month: "", year: yearMatch[1] };
      }
      
      return { day: "", month: "", year: "" };
    };

    const lowerSection = section.title ? section.title.toLowerCase() : "";
    const needsDayOptions = lowerSection.includes("employment record") || lowerSection.includes("leaves of absence");
    
    let newFormData = { ...fields };

    // Handle "dates" field (start/end date range)
    if ("dates" in fields) {
      setDateFieldName("dates");
      const datesStr = fields.dates || "";
      
      if (datesStr) {
        if (datesStr.includes(" - ")) {
          const [startStr, endStr] = datesStr.split(" - ").map(s => s.trim());
          const startParts = parseDateParts(startStr, needsDayOptions);
          const endParts = parseDateParts(endStr, needsDayOptions);
          
          newFormData.startDateDay = startParts.day;
          newFormData.startDateMonth = startParts.month;
          newFormData.startDateYear = startParts.year;
          newFormData.endDateDay = endParts.day;
          newFormData.endDateMonth = endParts.month;
          newFormData.endDateYear = endParts.year;
        } else {
          // Only start date present
          const startParts = parseDateParts(datesStr, needsDayOptions);
          newFormData.startDateDay = startParts.day;
          newFormData.startDateMonth = startParts.month;
          newFormData.startDateYear = startParts.year;
        }
      }
    }

    // Handle single start/end date fields
    if (section.attributes) {
      Object.entries(section.attributes).forEach(([displayName, snakeKey]) => {
        // Map display name values to snake_case keys
        if (fields[displayName] !== undefined) {
          newFormData[snakeKey] = fields[displayName];
        }
        
        // Parse individual date fields
        const lowerDisplayName = displayName.toLowerCase();
        if (lowerDisplayName.includes("start date") || lowerDisplayName.includes("end date")) {
          const val = fields[snakeKey] !== undefined ? fields[snakeKey] : fields[displayName];
          const prefix = lowerDisplayName.includes("start") ? "start" : "end";
          
          if (val && typeof val === "string") {
            const parts = parseDateParts(val, needsDayOptions);
            newFormData[`${prefix}DateDay`] = parts.day;
            newFormData[`${prefix}DateMonth`] = parts.month;
            newFormData[`${prefix}DateYear`] = parts.year;
          }
        }
      });
    }

    // Autofill "Other" fields for dropdowns
    if (attributesType.dropdown) {
      Object.entries(attributesType.dropdown).forEach(([displayName, options]) => {
        const snakeKey =
          section.attributes && section.attributes[displayName] ? section.attributes[displayName] : displayName;
        const val = fields[snakeKey];
        // Match any option that contains "Other" or "Others" and is followed by " (value)"
        if (Array.isArray(options) && typeof val === "string" && /\bothers?\b/i.test(val) && /\(.*\)$/.test(val)) {
          // Extract the option text (e.g., "i. Other", "ii. Others", "Others") and the value in parentheses
          const match = val.match(/^(.*?\bothers?\b.*?)\s*\((.*)\)$/i);
          if (match) {
            newFormData[snakeKey] = match[1].trim();
            newFormData[`${snakeKey}_other`] = match[2];
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
          newFormData[displayName] = !!fields[snakeKey]; // Convert to true boolean
        }
      });
    }

    // Set all form data at once
    setFormData(newFormData);
  }, [fields]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Special: Courses Taught autocomplete for Course field
    if (isCoursesTaughtSection && name === "course") {
      setFormData((prevState) => ({ ...prevState, [name]: value }));
      if (value && value.length > 1) {
        filterCourseSuggestions(value);
      } else {
        setCourseSearchResults([]);
      }
      return;
    }

    // Handle checkbox inputs differently than text inputs
    if (type === "checkbox") {
      setFormData((prevState) => ({
        ...prevState,
        [name]: checked,
      }));
      return;
    }

    // Auto-fill both endDateDay, endDateMonth and endDateYear if "Current" or "None" is selected
    if (name === "endDateMonth" && (value === "Current" || value === "None")) {
      setFormData((prevState) => ({
        ...prevState,
        endDateDay: value,
        endDateMonth: value,
        endDateYear: value,
      }));
      return;
    }
    if (name === "endDateYear" && (value === "Current" || value === "None")) {
      setFormData((prevState) => ({
        ...prevState,
        endDateDay: value,
        endDateMonth: value,
        endDateYear: value,
      }));
      return;
    }
    if (name === "endDateDay" && (value === "Current" || value === "None")) {
      setFormData((prevState) => ({
        ...prevState,
        endDateDay: value,
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

  // Special: handle course selection from dropdown
  const handleCourseSelect = (courseObj) => {
    setFormData((prev) => ({
      ...prev,
      course: courseObj.course ? courseObj.course.split("-")[0].trim() : "",
      course_title: prev.course_title
        ? `${prev.course_title}; ${courseObj.course_title}`
        : courseObj.course_title,
      brief_description: prev.brief_description
        ? `${courseObj.course_description}; ${prev.brief_description}`
        : courseObj.course_description,
    }));
    setCourseSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    let finalFormData = { ...formData };

    // Collect values from rich text editors before validation and save as HTML
    if (window.richTextEditorRefs) {
      Object.entries(window.richTextEditorRefs).forEach(([fieldName, ref]) => {
        if (ref && ref.getValue) {
          finalFormData[fieldName] = ref.getValue();
        }
      });
    }

    // Validate date fields using DateEntry's validation
    if (attributesType.date) {
      const dateError = validateDateFields(finalFormData, attributesType.date);
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
        if (!finalFormData[snakeKey]) {
          setError(`Please select a value for the field "${displayName}".`);
          return;
        }
      }
    }

    // Validate Highlight field - if checked, ensure Highlight Notes is not empty
    if (attributesType.boolean) {
      const highlightAttr = Object.keys(attributesType.boolean).find((attr) => attr.toLowerCase() === "highlight");

      if (highlightAttr && formData[highlightAttr] === true) {
        // Find the Highlight Notes field (case insensitive)
        const highlightNotesKey = Object.keys(formData).find(
          (key) => key.toLowerCase().includes("highlight") && key.toLowerCase().includes("note")
        );

        if (!highlightNotesKey || !formData[highlightNotesKey] || formData[highlightNotesKey].trim() === "") {
          setError("Please provide Highlight Notes when marking an entry as a Highlight.");
          return;
        }
      }
    }

    // --- Date fields saving ---
    const lowerSection = section.title ? section.title.toLowerCase() : "";
    const needsDayOptions = lowerSection.includes("employment record") || lowerSection.includes("leaves of absence");

    // Helper function to construct a date string from day/month/year
    const constructDateString = (day, month, year, needsDay) => {
      if (!month && !year) return "";
      if (month === "Current" || month === "None") return month;
      if (year === "Current" || year === "None") return year;
      
      if (month && year) {
        if (needsDay && day) {
          return `${day}, ${month}, ${year}`;
        }
        return `${month} ${year}`; // No comma between month and year
      }
      if (year) return year; // Only year provided
      return "";
    };

    // For "dates" field (date range with startDate* and endDate*)
    if (dateFieldName) {
      const startDateDay = finalFormData.startDateDay;
      const startDateMonth = finalFormData.startDateMonth;
      const startDateYear = finalFormData.startDateYear;
      const endDateDay = finalFormData.endDateDay;
      const endDateMonth = finalFormData.endDateMonth;
      const endDateYear = finalFormData.endDateYear;

      const startStr = constructDateString(startDateDay, startDateMonth, startDateYear, needsDayOptions);
      const endStr = constructDateString(endDateDay, endDateMonth, endDateYear, needsDayOptions);

      let dates = "";
      if (startStr && endStr) {
        // Special case: if end is "None", only show start date
        if (endStr === "None") {
          dates = startStr;
        } else {
          dates = `${startStr} - ${endStr}`;
        }
      } else if (startStr) {
        dates = startStr;
      } else if (endStr) {
        dates = endStr;
      }

      finalFormData[dateFieldName] = dates;

      // Remove temporary date fields
      delete finalFormData.startDateDay;
      delete finalFormData.startDateMonth;
      delete finalFormData.startDateYear;
      delete finalFormData.endDateDay;
      delete finalFormData.endDateMonth;
      delete finalFormData.endDateYear;
    }

    // For single start/end date fields (individual start_date or end_date attributes)
    if (section.attributes) {
      Object.entries(section.attributes).forEach(([displayName, snakeKey]) => {
        const lowerDisplayName = displayName.toLowerCase();
        if (lowerDisplayName.includes("start date") || lowerDisplayName.includes("end date")) {
          const prefix = lowerDisplayName.includes("start") ? "start" : "end";
          const day = finalFormData[`${prefix}DateDay`];
          const month = finalFormData[`${prefix}DateMonth`];
          const year = finalFormData[`${prefix}DateYear`];

          const dateStr = constructDateString(day, month, year, needsDayOptions);
          if (dateStr) {
            finalFormData[snakeKey] = dateStr;
          }

          // Remove temporary date fields
          delete finalFormData[`${prefix}DateDay`];
          delete finalFormData[`${prefix}DateMonth`];
          delete finalFormData[`${prefix}DateYear`];
        }
      });
    }

    // Handle "Other" for dropdowns before saving
    if (attributesType.dropdown) {
      Object.entries(attributesType.dropdown).forEach(([displayName, options]) => {
        const snakeKey =
          section.attributes && section.attributes[displayName] ? section.attributes[displayName] : displayName;
        const selectedValue = finalFormData[snakeKey];
        const otherVal = finalFormData[`${snakeKey}_other`] || "";
        // If the selected value contains "Other" or "Others" (case-insensitive) and there is an other value
        if (
          options.some((opt) => /\bothers?\b/i.test(opt)) &&
          typeof selectedValue === "string" &&
          /\bothers?\b/i.test(selectedValue) &&
          otherVal.trim() !== ""
        ) {
          finalFormData[snakeKey] = `${selectedValue} (${otherVal})`;
          delete finalFormData[`${snakeKey}_other`];
        }
      });
    }

    // Handle boolean fields - ensure they use snake_case keys and proper boolean values
    if (attributesType.boolean) {
      Object.entries(attributesType.boolean).forEach(([displayName]) => {
        const snakeKey =
          section.attributes && section.attributes[displayName] ? section.attributes[displayName] : displayName;

        // If the original key exists in finalFormData, ensure it's saved with snake_case key
        if (finalFormData[displayName] !== undefined) {
          finalFormData[snakeKey] = !!finalFormData[displayName]; // Convert to true boolean

          // Remove original key if different from snake_case key
          if (displayName !== snakeKey) {
            delete finalFormData[displayName];
          }
        }
      });
    }

    // Only keep snake_case keys as defined in section.attributes
    const allowedKeys = section.attributes ? Object.values(section.attributes) : [];
    
    // Special handling: preserve record_id if it exists (for RISE grant data)
    if (finalFormData.record_id !== undefined) {
      allowedKeys.push('record_id');
      console.log("🔑 Preserving record_id in grant update:", finalFormData.record_id);
    }
    
    // Special handling: preserve author metadata fields for publications
    const authorMetadataFields = [
      'author_trainees',
      'author_doctoral_supervisors', 
      'author_postdoctoral_supervisors',
      'author_types',
      'mark_as_important'
    ];
    authorMetadataFields.forEach(field => {
      if (finalFormData[field] !== undefined) {
        allowedKeys.push(field);
      }
    });
    
    const filteredFormData = Object.fromEntries(
      Object.entries(finalFormData).filter(([key]) => allowedKeys.includes(key))
    );
    
    console.log("🔍 Final filtered form data with author metadata:", filteredFormData);

    console.log("Submitting form data:", filteredFormData);
    try {
      if (isNew) {
        // Add new CV data
        await addUserCVData(userInfo.user_id, section.data_section_id, JSON.stringify(filteredFormData));
        // Log the addition action
        await logAction(AUDIT_ACTIONS.ADD_CV_DATA, {
          user_id: userInfo.user_id,
          user_name: userInfo.first_name + " " + userInfo.last_name,
          user_email: userInfo.email,
        });
      } else {
        // Update existing CV data
        await updateUserCVData(user_cv_data_id, JSON.stringify(filteredFormData));
        // Log the update action
        await logAction(AUDIT_ACTIONS.UPDATE_CV_DATA, {
          user_id: userInfo.user_id,
          user_name: userInfo.first_name + " " + userInfo.last_name,
          user_email: userInfo.email,
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Failed to save data. Please try again."); // User-friendly error message
    }
    setIsSubmitting(false);
    onClose(); // Close the modal after submission
    fetchData(); // Refresh data in the parent component
  };

  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <ModalStylingWrapper>
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl min-w-[32rem] w-full max-h-[85vh] overflow-y-auto mx-4 relative">
        <form method="dialog" onSubmit={handleSubmit}>
          <h3 className="font-bold mb-3 text-lg">
            {isNew ? "Add" : "Edit"} {entryType}
          </h3>
          <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={onClose}>
            ✕
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mt-4 w-full max-w-2xl">
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
                    sectionName={section.title}
                  />
                );
              } else if (type === "dropdown") {
                return (
                  <DropdownEntry
                    attrsObj={attrsObj}
                    attributes={section.attributes}
                    formData={formData}
                    handleChange={handleChange}
                    section={section}
                  />
                );
              } else if (type === "text") {
                // Special: Courses Taught section
                if (isCoursesTaughtSection) {
                  // Render text fields with Course autocomplete
                  return Object.entries(attrsObj).map(([attrName, value]) => {
                    const snakeKey =
                      section.attributes && section.attributes[attrName] ? section.attributes[attrName] : attrName;
                    const lower = attrName.toLowerCase();
                    const currentValue = formData[snakeKey] || "";
                    // Course field: autocomplete
                    if (lower === "course") {
                      return (
                        <div key={attrName} className="col-span-2 relative">
                          <label className="block text-sm font-semibold capitalize mb-1">{attrName}</label>
                          <input
                            type="text"
                            name={snakeKey}
                            value={currentValue}
                            onChange={handleChange}
                            autoComplete="off"
                            className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                          />
                          {isCourseLoading && (
                            <div className="absolute left-0 top-full text-xs text-gray-400">Searching...</div>
                          )}
                          {courseSearchResults.length > 0 && (
                            <ul className="absolute left-0 top-full bg-white border border-gray-300 rounded shadow z-10 w-full mt-1 max-h-40 overflow-y-auto">
                              {courseSearchResults.map((courseObj) => (
                                <li
                                  key={courseObj.course}
                                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                                  onClick={() => handleCourseSelect(courseObj)}
                                >
                                  <span className="font-semibold">{courseObj.course}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    }
                    // Course Title and Brief Description: autofill
                    if (lower === "course title" || lower === "brief description") {
                      return (
                        <div key={attrName} className="col-span-2">
                          <label className="block text-sm font-semibold capitalize mb-1">{attrName}</label>
                          <textarea
                            name={snakeKey}
                            value={formData[snakeKey] || ""}
                            onChange={handleChange}
                            rows={lower === "brief description" ? 3 : 1}
                            className="w-full rounded text-sm px-3 py-2 border border-gray-300 resize-none"
                          />
                        </div>
                      );
                    }
                    // Default: fallback to normal text field
                    return (
                      <div key={attrName} className="">
                        <label className="block text-sm capitalize mb-1 font-semibold">{attrName}</label>
                        <input
                          type="text"
                          name={snakeKey}
                          value={currentValue}
                          onChange={handleChange}
                          maxLength={500}
                          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                        />
                      </div>
                    );
                  });
                }
                // Default: normal text entry
                return (
                  <TextEntry
                    attrsObj={attrsObj}
                    attributes={section.attributes}
                    formData={formData}
                    handleChange={handleChange}
                    section={section}
                  />
                  
                );
              }
              // ...existing code...
              return null;
            })}
          </div>
          
          {/* Special: Mark as Important checkbox for Journal Publications only */}
          {section?.title?.toLowerCase().includes('journal publications') && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="mark_as_important"
                  checked={formData.mark_as_important || false}
                  onChange={handleChange}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-semibold">Mark as Important</span>
              </label>
            </div>
          )}
          
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
