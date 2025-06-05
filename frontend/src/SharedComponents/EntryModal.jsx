import React, { useState, useEffect } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { addUserCVData, updateUserCVData } from '../graphql/graphqlHelpers';
import { useApp } from '../Contexts/AppContext';
import ModalStylingWrapper from './ModalStylingWrapper';

const EntryModal = ({ isNew, section, onClose, entryType, fields, user_cv_data_id, fetchData }) => {
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [dateFieldName, setDateFieldName] = useState('');
    const [dateNeeded, setDateNeeded] = useState(false);

    const { userInfo } = useApp();

    useEffect(() => {
        // Initialize formData with all fields
        setFormData(fields);

        // Handle specific year fields if they exist
        if ('year_published' in fields) {
            setFormData(prevState => ({
                ...prevState,
                year_published: fields.year_published
            }));
        }
        if ('year' in fields) {
            setFormData(prevState => ({
                ...prevState,
                year: fields.year
            }));
        }

        // Handle 'dates' field for start and end dates
        if ('dates' in fields) {
            setDateNeeded(true);
            const dateField = 'dates';
            setDateFieldName(dateField);

            // Split the date string into start and end parts
            // If it's a new entry and no hyphen, end is empty. Otherwise, if no hyphen, end is 'None'.
            const [start, end] = fields[dateField].includes(' - ')
                ? fields[dateField].split(' - ')
                : (isNew ? [fields[dateField], ''] : [fields[dateField], 'None']);

            const [startDateMonth, startDateYear] = start.split(', ');

            // Set initial state for end dates based on parsed 'end' value
            if (end === 'Current') {
                setFormData(prevState => ({
                    ...prevState,
                    startDateMonth,
                    startDateYear,
                    endDateMonth: 'Current', // Set both month and year to 'Current'
                    endDateYear: 'Current'
                }));
            } else if (end === 'None') {
                setFormData(prevState => ({
                    ...prevState,
                    startDateMonth,
                    startDateYear,
                    endDateMonth: 'None', // Set both month and year to 'None'
                    endDateYear: 'None'
                }));
            } else {
                const [endDateMonth, endDateYear] = end.split(', ');
                setFormData(prevState => ({
                    ...prevState,
                    startDateMonth,
                    startDateYear,
                    endDateMonth,
                    endDateYear
                }));
            }
        }
    }, [fields, isNew]); // Added isNew to dependencies as it's used in parsing

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => {
            let newState = { ...prevState, [name]: value };

            // Special handling for end date fields to keep them synchronized
            if (name === 'endDateMonth' || name === 'endDateYear') {
                const currentMonth = newState.endDateMonth;
                const currentYear = newState.endDateYear;

                if (name === 'endDateMonth') {
                    if (value === 'Current') {
                        newState.endDateYear = 'Current'; // If month is 'Current', year must be 'Current'
                    } else if (value === 'None') {
                        newState.endDateYear = 'None'; // If month is 'None', year must be 'None'
                    } else {
                        // If month is a real month, and year was 'Current'/'None', clear year
                        if (currentYear === 'Current' || currentYear === 'None') {
                            newState.endDateYear = '';
                        }
                    }
                } else if (name === 'endDateYear') {
                    if (value === 'Current') {
                        newState.endDateMonth = 'Current'; // If year is 'Current', month must be 'Current'
                    } else if (value === 'None') {
                        newState.endDateMonth = 'None'; // If year is 'None', month must be 'None'
                    } else {
                        // If year is a real year, and month was 'Current'/'None', clear month
                        if (currentMonth === 'Current' || currentMonth === 'None') {
                            newState.endDateMonth = '';
                        }
                    }
                }
            }
            return newState;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate year_published or year fields
        if (('year_published' in formData && !formData.year_published) || ('year' in formData && !formData.year)) {
            setError('Please select the year.');
            return;
        }

        const { startDateMonth, startDateYear, endDateMonth, endDateYear, ...rest } = formData;

        // Validate date fields if 'dates' is required
        if (dateNeeded) {
            if (!startDateMonth || !startDateYear) {
                setError('Please select a start date.');
                return;
            }

            const isEndDateSpecial = endDateMonth === 'Current' || endDateMonth === 'None';

            // If end date is not 'Current' or 'None', then both month and year must be selected
            if (!isEndDateSpecial && (!endDateMonth || !endDateYear)) {
                setError('Please select a valid end date (month and year) or "Current" / "None".');
                return;
            }
        }

        if (endDateMonth === "None" || endDateYear === "None") {
            setError('Please select a valid end date (month and year) or "Current".');
            return;
        }

        setIsSubmitting(true);

        // Construct the 'dates' string based on the selected values
        const dates = endDateMonth === 'Current'
            ? `${startDateMonth}, ${startDateYear} - ${endDateMonth}`
            : endDateMonth === 'None'
                ? `${startDateMonth}, ${startDateYear}`
                : `${startDateMonth}, ${startDateYear} - ${endDateMonth}, ${endDateYear}`;

        // Create the updated form data, including the constructed 'dates' string if applicable
        const updatedFormData = dateFieldName ? { ...rest, [dateFieldName]: dates } : { ...rest };

        try {
            if (isNew) {
                // Add new CV data
                await addUserCVData(userInfo.user_id, section.data_section_id, JSON.stringify(updatedFormData));
            } else {
                // Update existing CV data
                await updateUserCVData(user_cv_data_id, JSON.stringify(updatedFormData));
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setError('Failed to save data. Please try again.'); // User-friendly error message
        }
        setIsSubmitting(false);
        onClose(); // Close the modal after submission
        fetchData(); // Refresh data in the parent component
    };

    // Helper function to format field keys for display
    const formatKey = (key) => {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Filter and sort keys for rendering inputs, excluding internal date states and IDs
    const filteredKeys = Object.keys(formData).filter(key =>
        !key.toLowerCase().includes('id') &&
        !['startDateMonth', 'startDateYear', 'endDateMonth', 'endDateYear'].includes(key)
    ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    // Arrays for month and year dropdown options
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());

    return (
        <ModalStylingWrapper>
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 relative">
                <form method="dialog" onSubmit={handleSubmit}>
                    <h3 className="font-bold mb-3 text-lg">{isNew ? "Add" : "Edit"} {entryType}</h3>
                    <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={onClose}>✕</button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredKeys.map((key) => (
                            key === 'dates' ? (
                                // Render date selectors for 'dates' field
                                <div key={key} className="mb-1">
                                    <label className="block text-sm capitalize">Start Date</label>
                                    <div className="flex space-x-2">
                                        <select
                                            name="startDateMonth"
                                            value={formData.startDateMonth || ''}
                                            onChange={handleChange}
                                            className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                                        >
                                            <option value="">Month</option>
                                            {months.map(month => (
                                                <option key={month} value={month}>{month}</option>
                                            ))}
                                        </select>
                                        <select
                                            name="startDateYear"
                                            value={formData.startDateYear || ''}
                                            onChange={handleChange}
                                            className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                                        >
                                            <option value="">Year</option>
                                            {years.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <label className="block text-sm capitalize mt-2">End Date</label>
                                    <div className="flex space-x-2">
                                        <select
                                            name="endDateMonth"
                                            value={formData.endDateMonth || ''} // Corrected value
                                            onChange={handleChange} // Use unified handleChange
                                            className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                                        >
                                            <option value="">Month</option> {/* Default empty option */}
                                            <option value="Current">Current</option>
                                            <option value="None">None</option>
                                            {months.map(month => (
                                                <option key={month} value={month}>{month}</option>
                                            ))}
                                        </select>
                                        <select
                                            name="endDateYear"
                                            value={formData.endDateYear || ''} // Corrected value
                                            onChange={handleChange} // Use unified handleChange
                                            className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                                        >
                                            <option value="">Year</option> {/* Default empty option */}
                                            <option value="Current">Current</option>
                                            <option value="None">None</option>
                                            {years.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : key === 'year_published' || key === 'year' ? (
                                // Render year selector for 'year_published' or 'year' fields
                                <div key={key} className="mb-1">
                                    <label className="block text-sm capitalize">{formatKey(key)}</label>
                                    <select
                                        name={key}
                                        value={formData[key] || ''}
                                        onChange={handleChange}
                                        className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                                    >
                                        <option value="">Select Year</option>
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : key === 'details' ? (
                                // Render textarea for 'details' field
                                <div key={key} className="mb-1">
                                    <label className="block text-sm capitalize">{formatKey(key)}</label>
                                    <textarea
                                        name={key}
                                        value={formData[key] || ''}
                                        onChange={handleChange}
                                        className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                                    />
                                </div>
                            ) : (
                                // Render text input for other fields
                                <div key={key} className="mb-1">
                                    <label className="block text-sm capitalize">{formatKey(key)}</label>
                                    <input
                                        type="text"
                                        name={key}
                                        value={formData[key] || ''}
                                        onChange={handleChange}
                                        maxLength={500}
                                        className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                                    />
                                </div>
                            )
                        ))}
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <div className="flex justify-end">
                        <button type="submit" className="btn btn-success text-white mt-3 py-1 px-2 w-1/5 min-h-0 h-8 leading-tight" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </ModalStylingWrapper>
    );
}

export default EntryModal;
