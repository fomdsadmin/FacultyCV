import { toast } from "react-toastify";
import { useTemplateModifier } from "Pages/TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";

const ModalFooter = ({ 
    preparedSection, 
    selectedAttribute, 
    subSectionSettings,
    onClose 
}) => {
    const { setGroups, getGroupIdContainingPreparedSectionId } = useTemplateModifier();

    const handleSave = () => {
        const finalAttribute = selectedAttribute === "" ? null : selectedAttribute;
        const groupId = getGroupIdContainingPreparedSectionId(preparedSection.data_section_id);
        
        setGroups(prevGroups => 
            prevGroups.map(group => {
                if (group.id === groupId) {
                    return {
                        ...group,
                        prepared_sections: group.prepared_sections.map(section => {
                            if (section.data_section_id === preparedSection.data_section_id) {
                                return {
                                    ...section,
                                    section_by_attribute: finalAttribute,
                                    sub_section_settings: finalAttribute ? subSectionSettings : null
                                };
                            }
                            return section;
                        })
                    };
                }
                return group;
            })
        );

        const message = finalAttribute 
            ? `Section sectioned by "${finalAttribute}" with ${subSectionSettings.sub_sections.length} subsections!`
            : "Sectioning removed!";
        
        toast.success(message, { autoClose: 3000 });
        onClose();
    };

    return (
        <div className="flex justify-between mt-6">
            <div className="flex gap-2">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="button" 
                    onClick={handleSave}
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                    Save sectioning settings
                </button>
            </div>
        </div>
    );
};

export default ModalFooter;