const AttributeSelector = ({ 
    preparedSection, 
    selectedAttribute, 
    dropdownAttributes, 
    setSelectedAttribute,
    subSectionSettings,
    setSubSectionSettings
}) => {
    const handleAttributeChange = (e) => {
        setSelectedAttribute(e.target.value);
    };

    const handleDisplayTitlesChange = (e) => {
        setSubSectionSettings(prevSettings => ({
            ...prevSettings,
            display_titles: e.target.checked
        }));
    };

    const handleDisplaySectionTitleChange = (e) => {
        setSubSectionSettings(prevSettings => ({
            ...prevSettings,
            display_section_title: e.target.checked
        }));
    };

    return (
        <>
            <p className="text-sm text-gray-600 mb-4">
                Organize this section by attribute values. Each unique value will create a separate subsection with customizable attributes.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
                Section: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{preparedSection.title}</span>
            </label>

            <label className="block text-sm font-medium text-gray-700 mb-2">
                Organize by attribute:
            </label>
            
            <select
                value={selectedAttribute}
                onChange={handleAttributeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
                <option value="">No organization (keep as single section)</option>
                {dropdownAttributes.map(attribute => (
                    <option key={attribute} value={attribute}>
                        {attribute}
                    </option>
                ))}
            </select>

            {selectedAttribute && (
                <>
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            id="display-section-title"
                            checked={subSectionSettings.display_section_title || false}
                            onChange={handleDisplaySectionTitleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="display-section-title" className="text-sm text-gray-700">
                            Display section title
                        </label>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            id="display-titles"
                            checked={subSectionSettings.display_titles || false}
                            onChange={handleDisplayTitlesChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="display-titles" className="text-sm text-gray-700">
                            Display subsection titles
                        </label>
                    </div>
                </>
            )}
        </>
    );
};

export default AttributeSelector;