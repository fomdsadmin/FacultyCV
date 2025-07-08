import SubSectionItem from "./SubSectionItem";

const SubSectionPreview = ({ subSections, setSubSectionSettings, preparedSection }) => {
    if (subSections.length === 0) {
        return (
            <p className="text-xs text-gray-500 mt-2">
                Each subsection will contain entries where the selected attribute matches that value. All attributes can be renamed individually for each subsection.
            </p>
        );
    }

    return (
        <>
            <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-3">
                    Preview: This will create {subSections.length} subsections:
                </h4>
                <div className="space-y-4">
                    {subSections.map((subSection, index) => (
                        <SubSectionItem
                            key={subSection.id}
                            subSection={subSection}
                            index={index}
                            preparedSection={preparedSection}
                            setSubSectionSettings={setSubSectionSettings}
                        />
                    ))}
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Each subsection will contain entries where the selected attribute matches that value. All attributes can be renamed individually for each subsection.
            </p>
        </>
    );
};

export default SubSectionPreview;