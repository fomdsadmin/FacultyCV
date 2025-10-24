import AttributesList from "../Attributes/AttributesList";
import SubSectionTitle from "./SubSectionTitle";

const SubSectionItem = ({ subSection, index, preparedSection, setSubSectionSettings, toggleSubSectionHidden }) => {
    const handleToggle = () => {
        if (typeof toggleSubSectionHidden === "function") {
            toggleSubSectionHidden(subSection.id);
            return;
        }

        // fallback if no toggle handler provided: update via setSubSectionSettings
        setSubSectionSettings(prev => {
            const subs = (prev.sub_sections || []).map(s =>
                s.id === subSection.id ? { ...s, hidden: !s.hidden } : s
            );
            return { ...prev, sub_sections: subs };
        });
    };

    return (
        <div className="bg-white p-4 rounded border">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 mr-4">
                    <SubSectionTitle 
                        subSection={subSection}
                        index={index}
                        setSubSectionSettings={setSubSectionSettings}
                    />
                </div>

                <div className="flex-shrink-0 mt-1">
                    <label className="inline-flex items-center text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={!!subSection.hidden}
                            onChange={handleToggle}
                            className="form-checkbox h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2">Hide</span>
                    </label>
                </div>
            </div>

            <AttributesList 
                subSection={subSection}
                preparedSection={preparedSection}
                setSubSectionSettings={setSubSectionSettings}
            />
        </div>
    );
};

export default SubSectionItem;