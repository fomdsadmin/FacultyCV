import React, { useState, useEffect } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';

const EntryModal = ({ isNew, onClose, entryType, ...fields }) => {
    const [formData, setFormData] = useState({});

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

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form data submitted:', formData);
        // Handle form submission here
        onClose();
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
                            <label className="block text-sm capitalize">{key.replace('_', ' ')}</label>
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
                    <button type="submit" className="text-white btn btn-success mt-3 py-1 px-2 w-1/5 min-h-0 h-8 leading-tight">
                        Save
                    </button>
                </div>
            </form>
        </dialog>
    );
}

export default EntryModal;
