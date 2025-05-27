import React, { useState, useEffect } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { addUserCVData, updateUserCVData } from '../graphql/graphqlHelpers';
import { useApp } from '../Contexts/AppContext';

const EntryModal = ({ isNew, section, onClose, entryType, fields, user_cv_data_id, fetchData }) => {
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [dateFieldName, setDateFieldName] = useState('');
    const [dateNeeded, setDateNeeded] = useState(false);

    const { userInfo } = useApp();

    useEffect(() => {
        setFormData(fields);
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
        if ('dates' in fields) {
            setDateNeeded(true);
            const dateField = 'dates';
            setDateFieldName(dateField);
            const [start, end] = fields[dateField].includes(' - ') ? fields[dateField].split(' - ') : (isNew ? [fields[dateField], ''] : [fields[dateField], 'None']);
            const [startDateMonth, startDateYear] = start.split(', ');
            if (end === 'Current') {
                setFormData(prevState => ({
                    ...prevState,
                    startDateMonth,
                    startDateYear,
                    endDateMonth: 'Current',
                    endDateYear: ''
                }));
            } else if (end === 'None') {
                setFormData(prevState => ({
                    ...prevState,
                    startDateMonth,
                    startDateYear,
                    endDateMonth: 'None',
                    endDateYear: ''
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
    }, [fields]);    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleEndDateChange = (e) => {
        const { name, value } = e.target;
        if (value === 'Current' || value === 'None') {
            setFormData(prevState => ({
                ...prevState,
                [name]: value,
                endDateMonth: value,
                endDateYear: ''
            }));
        } else {
            setFormData(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if ('year_published' in formData && !formData.year_published) {
            setError('Please select the year.');
            return;
        }

        const { startDateMonth, startDateYear, endDateMonth, endDateYear, ...rest } = formData;
        if ((dateNeeded) && (!startDateMonth || !startDateYear || (!endDateMonth && endDateMonth !== 'Current' && endDateMonth !== 'None') || (!endDateYear && endDateMonth !== 'Current' && endDateMonth !== 'None'))) {
            setError('Please select a start date and an end date.');
            return;
        }
        setIsSubmitting(true);
        const dates = endDateMonth === 'Current'
            ? `${startDateMonth}, ${startDateYear} - ${endDateMonth}`
            : endDateMonth === 'None'
            ? `${startDateMonth}, ${startDateYear}`
            : `${startDateMonth}, ${startDateYear} - ${endDateMonth}, ${endDateYear}`;
        const updatedFormData = dateFieldName ? { ...rest, [dateFieldName]: dates } : { ...rest };
        
        try {
            if (isNew) {
                const result = await addUserCVData(userInfo.user_id, section.data_section_id, JSON.stringify(updatedFormData));
                
            } else {
                const result = await updateUserCVData(user_cv_data_id, JSON.stringify(updatedFormData));
                
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
        setIsSubmitting(false);
        onClose();
        fetchData();
    };    

    const formatKey = (key) => {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const filteredKeys = Object.keys(formData).filter(key => !key.toLowerCase().includes('id') && !['startDateMonth', 'startDateYear', 'endDateMonth', 'endDateYear'].includes(key)).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());

    return (
        <dialog className="modal-dialog" open>
            <form method="dialog" onSubmit={handleSubmit}>
                <h3 className="font-bold mb-3 text-lg">{isNew ? "Add" : "Edit"} {entryType}</h3>
                <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={onClose}>✕</button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredKeys.map((key) => (
                        key === 'dates' ? (
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
                                        value={(formData.endDateYear === 'Current' || formData.endDateYear === 'None') ? formData.endDateYear : (formData.endDateMonth || '')}
                                        onChange={handleEndDateChange}
                                        className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                                        disabled={formData.endDateYear === 'Current' || formData.endDateYear === 'None'}

                                    >
                                        <option value="Current">Current</option>
                                        <option value="None">None</option>
                                        <option value="">Month</option>
                                        {months.map(month => (
                                            <option key={month} value={month}>{month}</option>
                                        ))}
                                    </select>
                                    <select
                                        name="endDateYear"
                                        value={(formData.endDateMonth === 'Current' || formData.endDateMonth === 'None') ? formData.endDateMonth : (formData.endDateYear || '')}
                                        onChange={handleChange}
                                        className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                                        disabled={formData.endDateMonth === 'Current' || formData.endDateMonth === 'None'}
                                    >
                                        <option value="Current">Current</option>
                                        <option value="None">None</option>
                                        <option value="">Year</option>
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) :  key === 'year_published' || key === 'year' ? (
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
        </dialog>
    );
}

export default EntryModal;
