import { useState, useEffect } from 'react';
import SubSectionInstructionTextField from './SubSectionInstructionTextField';
import SubSectionUnderlinedTitle from './SubSectionUnderlinedTitle';

const SubSectionTitle = ({ subSection, index, setSubSectionSettings }) => {
    // Track input value separately from the fallback logic
    const [inputValue, setInputValue] = useState(subSection.renamed_title || '');

    // Update input when subSection changes from outside
    useEffect(() => {
        setInputValue(subSection.renamed_title || '');
    }, [subSection.renamed_title]);

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setInputValue(newTitle); // Update local input state immediately
        setSubSectionSettings(prevSettings => ({
            ...prevSettings,
            sub_sections: prevSettings.sub_sections.map(prevSubSection => 
                prevSubSection.id === subSection.id 
                    ? { ...prevSubSection, renamed_title: newTitle || null }
                    : prevSubSection
            )
        }));
    };

    return (
        <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600">
                    Subsection {index + 1}:
                </span>
                <span className="font-mono bg-gray-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {subSection.original_title}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 min-w-0 w-20">Custom title:</label>
                <input
                    type="text"
                    value={inputValue}
                    placeholder={subSection.original_title}
                    onChange={handleTitleChange}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {/* Label for subsection instructions */}
            <div className="mt-2 text-xs text-gray-600 font-medium">
                Instructions:
            </div>

            {/* Subsection instructions textbox placed below custom title */}
            <SubSectionInstructionTextField
                subSection={subSection}
                setSubSectionSettings={setSubSectionSettings}
            />

            {/* Subsection underlined title (non-expanding) placed below instructions */}
            <SubSectionUnderlinedTitle
                subSection={subSection}
                setSubSectionSettings={setSubSectionSettings}
            />
            
        </div>
    );
};

export default SubSectionTitle;