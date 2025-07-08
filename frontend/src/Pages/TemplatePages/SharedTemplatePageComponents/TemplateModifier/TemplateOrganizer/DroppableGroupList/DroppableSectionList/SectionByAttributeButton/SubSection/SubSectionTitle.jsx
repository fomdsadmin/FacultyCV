const SubSectionTitle = ({ subSection, index, setSubSectionSettings }) => {
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setSubSectionSettings(prevSettings => ({
            ...prevSettings,
            sub_sections: prevSettings.sub_sections.map(prevSubSection => 
                prevSubSection.id === subSection.id 
                    ? { ...prevSubSection, renamed_title: newTitle }
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
                    value={subSection.renamed_title || subSection.original_title}
                    onChange={handleTitleChange}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>
        </div>
    );
};

export default SubSectionTitle;