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

  const { userInfo } = useApp();

  useEffect(() => {
    // Initialize formData with provided fields
    const initialData = { ...fields };
    console.log("Initial Fields:", initialData);

    // Set Type dropdown and check if it's "Other"
    if (initialData.type === "Other") {
      setTypeIsOther(true);
    }

    // Initialize highlight and note checkboxes (convert string to boolean)
    initialData.highlight =
      initialData.highlight === "true" ||
      initialData.highlight === true ||
      false;
    initialData.note =
      initialData.note === "true" || initialData.note === true || false;

    setFormData(initialData);
  }, [fields]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle checkbox fields
    if (type === "checkbox") {
      setFormData((prevState) => ({
        ...prevState,
        [name]: checked,
      }));
      return;
    }

    // Handle special case for Type dropdown
    if (name === "type") {
      setTypeIsOther(value === "other");
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

    if (!formData.type) {
      setError("Please select a presentation type.");
      return;
    }

    if (formData.type === "other" && !formData.other) {
      setError("Please specify the other presentation type.");
      return;
    }

    if (!formData.scale) {
      setError("Please select a scale.");
      return;
    }

    // Validate date fields
    if (!formData.start_month || !formData.start_year) {
      setError("Please select a start date.");
      return;
    }

    // Validate note field if Note is checked
    if (formData.note && !formData.noteText) {
      setError("Please add a note or uncheck the Add note option.");
      return;
    }

    setIsSubmitting(true);

    // Create the updated form data with booleans converted to strings
    const updatedFormData = {
      ...formData,
      highlight: formData.highlight.toString(),
      note: formData.note.toString(),
    };

    console.log("Updated Form Data:", updatedFormData);

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

  const physicians = ["Physician 1", "Physician 2"];
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
            {isNew ? "Add a new" : "Edit"} {"Presentation"}
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

            {/* Start Date Fields */}
            <div className="mb-1">
              <label className="block text-sm font-semibold">Start Date</label>
              <div className="flex space-x-2">
                <select
                  name="start_month"
                  value={formData.start_month || ""}
                  onChange={handleChange}
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
                  name="start_year"
                  value={formData.start_year || ""}
                  onChange={handleChange}
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

            {/* Scale Dropdown with Helper Text */}
            <div className="mb-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold">Scale</label>
              </div>
              <select
                name="Scale"
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

            {/* End Date Fields */}
            <div className="mb-1">
              <label className="block text-sm font-semibold">End Date</label>
              <div className="flex space-x-2">
                <select
                  name="end_month"
                  value={formData.end_month || ""}
                  onChange={handleChange}
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
                  name="end_year"
                  value={formData.end_year || ""}
                  onChange={handleChange}
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

            {/* Type Dropdown with Other Text Field */}
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
          </div>

          {/* Details Text Box */}
          <div className="mt-4 mb-1">
            <label className="block text-sm font-semibold">Details</label>
            <textarea
              name="details"
              value={formData.details || ""}
              onChange={handleChange}
              placeholder="Enter presentation details here"
              rows={4}
              className="w-full rounded text-sm px-3 py-2 mt-1 border border-gray-300"
            />
          </div>

          {/* Note Checkbox */}
          <div className="mb-1 mt-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="note"
                name="note"
                checked={formData.note || false}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="note" className="ml-2 text-sm">
                Add a note to this presentation
              </label>
            </div>

            {/* Note Text Field - Only shows when Note is checked */}
            {formData.note && (
              <div className="mt-2 mb-3">
                <textarea
                  name="NoteText"
                  value={formData.noteText || ""}
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
                      name="Highlight"
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

          <div className="flex items-center justify-between">
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
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

export default InvitedPresentationModal;
