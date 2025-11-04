import React, { useState, useEffect } from 'react';

const SubSectionInstructionTextField = ({ subSection, setSubSectionSettings }) => {
    const [expanded, setExpanded] = useState(false);
    const [value, setValue] = useState(subSection?.instructions || '');

    useEffect(() => {
        setValue(subSection?.instructions || '');
    }, [subSection?.instructions]);

    const handleSave = () => {
        setSubSectionSettings(prev => ({
            ...prev,
            sub_sections: (prev.sub_sections || []).map(s =>
                s.id === subSection.id ? { ...s, instructions: value || null } : s
            )
        }));
        setExpanded(false);
    };

    const handleCancel = () => {
        setValue(subSection?.instructions || '');
        setExpanded(false);
    };

    return (
        <div className="mt-2">
            {!expanded ? (
                <input
                    type="text"
                    className="w-full text-sm border rounded px-2 py-1 cursor-text"
                    placeholder="Add subsection instructions..."
                    value={value}
                    onFocus={() => setExpanded(true)}
                    onChange={e => setValue(e.target.value)}
                />
            ) : (
                <div className="flex flex-col gap-2">
                    <textarea
                        rows={3}
                        className="w-full text-sm border rounded px-2 py-1"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                            onClick={handleSave}
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            className="px-3 py-1 bg-gray-200 text-sm rounded"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubSectionInstructionTextField;