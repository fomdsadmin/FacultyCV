import React, { useState, useEffect } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import { addUserCVData, updateUserCVData } from "../graphql/graphqlHelpers";
import { useApp } from "../Contexts/AppContext";
import ModalStylingWrapper from "../SharedComponents/ModalStylingWrapper";

const InvitedPresentationModal = ({
  isNew,
  section,
  onClose,
  entryType,
  fields = {},
  user_cv_data_id,
  fetchData,
}) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [typeIsOther, setTypeIsOther] = useState(false);
  const [showNote, setShowNote] = useState(false);

  // New state for EntryModal-style date fields
  const [startDateMonth, setStartDateMonth] = useState("");
  const [startDateYear, setStartDateYear] = useState("");
  const [endDateMonth, setEndDateMonth] = useState("");
  const [endDateYear, setEndDateYear] = useState("");

  const { userInfo } = useApp();

  useEffect(() => {
    const initialData = { ...fields };

    // Parse "dates" field if present
    if (initialData.dates) {
      const [start, end] = initialData.dates.includes(" - ")
        ? initialData.dates.split(" - ")
        : [initialData.dates, ""];

      const [sMonth, sYear] = start.split(", ");
      setStartDateMonth(sMonth || "");
      setStartDateYear(sYear || "");

      if (end === "Current") {
        setEndDateMonth("Current");
        setEndDateYear("Current");
      } else if (end === "None" || !end) {
        setEndDateMonth("None");
        setEndDateYear("None");
      } else {
        const [eMonth, eYear] = end.split(", ");
        setEndDateMonth(eMonth || "");
        setEndDateYear(eYear || "");
      }
    } else {
      setStartDateMonth("");
      setStartDateYear("");
      setEndDateMonth("");
      setEndDateYear("");
    }

    setTypeIsOther(
      initialData.type && initialData.type.toLowerCase() === "other"
    );
    setShowNote(!!initialData.note);
    setFormData(initialData);
  }, [fields]);

  // Handle changes for EntryModal-style date fields
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    if (name === "startDateMonth") setStartDateMonth(value);
    if (name === "startDateYear") setStartDateYear(value);
    if (name === "endDateMonth") {
      setEndDateMonth(value);
      if (value === "Current") {
        setEndDateYear("Current");
      } else if (value === "None") {
        setEndDateYear("None");
      } else if (endDateYear === "Current" || endDateYear === "None") {
        setEndDateYear("");
      }
    }
    if (name === "endDateYear") {
      setEndDateYear(value);
      if (value === "Current") {
        setEndDateMonth("Current");
      } else if (value === "None") {
        setEndDateMonth("None");
      } else if (endDateMonth === "Current" || endDateMonth === "None") {
        setEndDateMonth("");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "showNote") {
      setShowNote(checked);
      if (!checked) {
        setFormData((prevState) => ({
          ...prevState,
          note: "",
        }));
      }
      return;
    }

    if (type === "checkbox" && name === "highlight") {
      setFormData((prevState) => ({
        ...prevState,
        highlight: checked,
      }));
      return;
    }

    if (name === "type") {
      setTypeIsOther(value === "Other");
      setFormData((prevState) => ({
        ...prevState,
        type: value,
        // Reset "other" field if not "Other"
        other: value === "Other" ? prevState.other : "",
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

    // Validate required fields
    if (!formData.physician) {
      setError("Please select a physician.");
      return;
    }
    if (!formData.scale) {
      setError("Please select a scale.");
      return;
    }
    // Validate EntryModal-style date fields
    if (!startDateMonth || !startDateYear) {
      setError("Please select a start date.");
      return;
    }
    if (
      !endDateMonth ||
      !endDateYear ||
      (endDateMonth !== "Current" &&
        endDateMonth !== "None" &&
        (!endDateMonth || !endDateYear))
    ) {
      setError(
        'Please select a valid end date (month and year) or "Current" / "None".'
      );
      return;
    }
    if (endDateMonth === "None" || endDateYear === "None") {
      setError('Please select a valid end date (month and year) or "Current".');
      return;
    }
    if (!formData.type) {
      setError("Please select a presentation type.");
      return;
    }
    if (formData.type === "other" && !formData.other) {
      setError("Please specify the other presentation type.");
      return;
    }
    if (showNote && (!formData.note || formData.note.trim() === "")) {
      setError("Please add a note or uncheck the Add note option.");
      return;
    }

    setIsSubmitting(true);

    // Construct the 'dates' string
    const dates =
      endDateMonth === "Current"
        ? `${startDateMonth}, ${startDateYear} - Current`
        : endDateMonth === "None"
        ? `${startDateMonth}, ${startDateYear}`
        : `${startDateMonth}, ${startDateYear} - ${endDateMonth}, ${endDateYear}`;

    let updatedFormData = {
      ...formData,
      dates,
      highlight: formData.highlight ? "true" : "false",
      // Only include note if showNote is true, otherwise remove it
      ...(showNote ? {} : { note: "" }),
    };

    try {
      if (isNew) {
        await addUserCVData(
          userInfo.user_id,
          section.data_section_id,
          JSON.stringify(updatedFormData)
        );
      } else {
        await updateUserCVData(
          user_cv_data_id,
          JSON.stringify(updatedFormData)
        );
      }
      onClose();
      fetchData();
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Failed to save data. Please try again.");
    }
    setIsSubmitting(false);
  };

  // Arrays for dropdowns
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from({ length: 100 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );

  const physicians = [];
  const physician_name = userInfo?.first_name + " " + userInfo?.last_name;
  physicians.push(physician_name);

  const presentationTypes = [
    "Conference",
    "Workshop",
    "Seminar",
    "Webinar",
    "Lecture",
    "Other",
  ];
  const scales = ["Local", "National", "International"];

  return (
    <ModalStylingWrapper>
      <div className="bg-white rounded-lg shadow-lg p-6 px-12 max-w-3xl w-full mx-2 relative overflow-y-auto max-h-[90vh]">
        <form method="dialog" onSubmit={handleSubmit}>
          <h1 className="font-bold mb-5 text-2xl">
            {isNew ? "Add a new " : "Edit "}
            Record
          </h1>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            onClick={onClose}
          >
            ✕
          </button>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Physician Dropdown */}
            {typeof formData.physician !== "undefined" && (
              <div className="mb-1">
                <label className="block text-sm font-semibold">Physician</label>
                <select
                  name="physician"
                  value={formData.physician || ""}
                  onChange={handleChange}
                  className="w-full rounded text-sm px-3 py-2 mt-1 border border-gray-300"
                >
                  <option value="">Select Physician</option>
                  {physicians.map((physician) => (
                    <option key={physician} value={physician}>
                      {physician}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* EntryModal-style Start/End Date Fields */}
            <div className="mb-1">
              <label className="block text-sm font-semibold">Start Date</label>
              <div className="flex space-x-2">
                <select
                  name="startDateMonth"
                  value={startDateMonth}
                  onChange={handleDateChange}
                  className="w-full rounded text-sm px-3 mt-1 py-2 border border-gray-300"
                >
                  <option value="">Month</option>
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  name="startDateYear"
                  value={startDateYear}
                  onChange={handleDateChange}
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                >
                  <option value="">Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-1">
              <label className="block text-sm font-semibold">End Date</label>
              <div className="flex space-x-2">
                <select
                  name="endDateMonth"
                  value={endDateMonth}
                  onChange={handleDateChange}
                  className="w-full rounded text-sm px-3 py-2 mt-1 border border-gray-300"
                >
                  <option value="">Month</option>
                  <option value="Current">Current</option>
                  <option value="None">None</option>
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  name="endDateYear"
                  value={endDateYear}
                  onChange={handleDateChange}
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                >
                  <option value="">Year</option>
                  <option value="Current">Current</option>
                  <option value="None">None</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scale Dropdown */}
            {typeof formData.scale !== "undefined" && (
              <div className="mb-1">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold">Scale</label>
                </div>
                <select
                  name="scale"
                  value={formData.scale || ""}
                  onChange={handleChange}
                  className="w-full rounded text-sm px-3 py-2 mt-1 border border-gray-300"
                >
                  <option value="">Select Scale</option>
                  {scales.map((scale) => (
                    <option key={scale} value={scale}>
                      {scale}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">
                  (Local, National, International, etc.)
                </span>
              </div>
            )}

            {/* Type Dropdown with Other Text Field */}
            {typeof formData.type !== "undefined" && (
              <div className="mb-1">
                <label className="block text-sm font-semibold">Type</label>
                <select
                  name="type"
                  value={formData.type || ""}
                  onChange={handleChange}
                  className="w-full rounded text-sm px-3 py-2 mt-1 border border-gray-300"
                >
                  <option value="">Select Type</option>
                  {presentationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                {/* Other Type Text Field */}
                <div className="mt-2">
                  <input
                    type="text"
                    name="other"
                    value={formData.other || ""}
                    onChange={handleChange}
                    placeholder="Other"
                    disabled={!typeIsOther}
                    className={`w-full rounded text-sm px-3 py-2 border border-gray-300 ${
                      !typeIsOther ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Details Text Box */}
          {typeof formData.details !== "undefined" && (
            <div className="mt-4 mb-1">
              <label className="block text-sm font-semibold">Details</label>
              <textarea
                name="details"
                value={formData.details || ""}
                onChange={handleChange}
                placeholder="Enter presentation details (e.g Title, etc.) here"
                rows={4}
                className="w-full rounded text-sm px-3 py-2 mt-1 border border-gray-300"
              />
            </div>
          )}

          {/* Note Checkbox */}
          {(typeof formData.note !== "undefined" || showNote) && (
            <div className="mb-1 mt-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showNote"
                  name="showNote"
                  checked={showNote}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="showNote" className="ml-2 text-sm">
                  Add a note to this presentation
                </label>
              </div>
              {/* Note Text Field - Only shows when showNote is checked */}
              {showNote && (
                <div className="mt-2 mb-3">
                  <textarea
                    name="note"
                    value={formData.note || ""}
                    onChange={handleChange}
                    placeholder="Enter your note here"
                    rows={2}
                    className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                  />
                  {/* Highlight Checkbox - Now appears after the Note section */}
                  <div className="mb-1 mt-2">
                    <div className="flex justify-end items-center">
                      <input
                        type="checkbox"
                        id="highlight"
                        name="highlight"
                        checked={formData.highlight || false}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="highlight"
                        className="ml-2 text-sm font-semibold"
                      >
                        Highlight note
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              className="btn btn-success text-white mt-3 py-1 px-2 w-1/5 min-h-0 h-8 leading-tight"
              disabled={isSubmitting}
            >
              {isNew ? "Save" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </ModalStylingWrapper>
  );
};

export default InvitedPresentationModal;
