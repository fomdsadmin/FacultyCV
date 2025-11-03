import React, { useState, useEffect } from 'react';

/**
 * SubSectionUnderlinedTitle
 * - non-expanding single-line input for subsection underlined title
 * - updates setSubSectionSettings.prev.sub_sections[].underlined_title
 */
const SubSectionUnderlinedTitle = ({ subSection, setSubSectionSettings }) => {
    const [value, setValue] = useState(subSection?.underlined_title || '');

    useEffect(() => {
        setValue(subSection?.underlined_title || '');
    }, [subSection?.underlined_title]);

    const handleClear = () => {
        setValue('');
        setSubSectionSettings(prev => ({
            ...prev,
            sub_sections: (prev.sub_sections || []).map(s =>
                s.id === subSection.id ? { ...s, underlined_title: null } : s
            )
        }));
    };

    // Persist immediately on change (no Save button)
    const handleChange = (next) => {
        setValue(next);
        setSubSectionSettings(prev => ({
            ...prev,
            sub_sections: (prev.sub_sections || []).map(s =>
                s.id === subSection.id ? { ...s, underlined_title: next || null } : s
            )
        }));
    };

    return (
        <div className="mt-2 px-0">
            <div className="text-xs text-gray-600 mb-1">
                Subsection underlined title (displayed above subsection, underlined)
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    className="flex-1 text-sm border rounded px-2 py-1"
                    placeholder="Add underlined subsection title..."
                    value={value}
                    onChange={e => handleChange(e.target.value)}
                />
                <button
                    type="button"
                    className="px-3 py-1 bg-gray-200 text-sm rounded"
                    onClick={handleClear}
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

export default SubSectionUnderlinedTitle;