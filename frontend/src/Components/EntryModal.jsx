import React, { useState, useEffect } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { addUserCVData, updateUserCVData } from '../graphql/graphqlHelpers';

const EntryModal = ({ isNew, user, section, onClose, entryType, fields, user_cv_data_id, fetchData}) => {
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        
        setFormData(fields);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        setIsSubmitting(true);
        e.preventDefault();
        // Stringify formData and escape special characters
        const formDataString = JSON.stringify(formData).replace(/"/g, '\\"');
        
        try {
            // Handle form submission here
            if (isNew) {
                // Handle adding new entry
                const result = await addUserCVData(user.user_id, section.data_section_id, `"${formDataString}"`);
                
            } else {
                // Handle editing existing entry
                const result = await updateUserCVData(user_cv_data_id, `"${formDataString}"`);
                
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
    
    const filteredKeys = Object.keys(formData).filter(key => !key.toLowerCase().includes('id'));

    return (
        <dialog className="modal-dialog" open>
            <form method="dialog" onSubmit={handleSubmit}>
                <h3 className="font-bold mb-3 text-lg">{isNew ? "Add" : "Edit"} {entryType}</h3>
                <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={onClose}>✕</button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredKeys.map((key) => (
                        <div key={key} className="mb-1">
                            <label className="block text-sm capitalize">{formatKey(key)}</label>
                            <input
                                type="text"
                                name={key}
                                value={formData[key] || ''}
                                onChange={handleChange}
                                className="w-full rounded text-sm px-3 py-2 border border-gray-300"
                            />
                        </div>
                    ))}
                </div>

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
