import { useTemplate } from "Pages/NewTemplate/TemplateContext";
import { FaTimesCircle } from "react-icons/fa";

const RemoveAttributeGroupButton = ({ attributeGroup, dataSectionId }) => {
    const { setGroups, getGroupIdContainingPreparedSectionId, HIDDEN_ATTRIBUTE_GROUP_ID, SHOWN_ATTRIBUTE_GROUP_ID } = useTemplate();

    const handleRemoveAttributeGroup = (e) => {
        e.stopPropagation();
        
        const groupId = getGroupIdContainingPreparedSectionId(dataSectionId);
        
        setGroups(prevGroups => 
            prevGroups.map(group => {
                if (group.id === groupId) {
                    return {
                        ...group,
                        prepared_sections: group.prepared_sections.map(section => {
                            if (section.data_section_id === dataSectionId) {
                                // Get attributes from the group being removed
                                const attributesToMove = attributeGroup.attributes || [];
                                
                                // Remove the attribute group and move its attributes to shown group
                                const updatedAttributeGroups = section.attribute_groups
                                    .filter(group => group.id !== attributeGroup.id)
                                    .map(group => {
                                        // Add attributes to the shown group
                                        if (group.id === SHOWN_ATTRIBUTE_GROUP_ID) {
                                            return {
                                                ...group,
                                                attributes: [...group.attributes, ...attributesToMove]
                                            };
                                        }
                                        return group;
                                    });

                                return {
                                    ...section,
                                    attribute_groups: updatedAttributeGroups
                                };
                            }
                            return section;
                        })
                    };
                }
                return group;
            })
        );
    };

    // Don't render button for hidden or shown attribute groups
    if (attributeGroup.id === HIDDEN_ATTRIBUTE_GROUP_ID || attributeGroup.id === SHOWN_ATTRIBUTE_GROUP_ID) {
        return null;
    }

    return (
        <button
            onClick={handleRemoveAttributeGroup}
            className="btn btn-xs btn-circle btn-ghost"
            title={`Remove ${attributeGroup.title} group`}
        >
            <FaTimesCircle className="h-4 w-4 text-red-500" />
        </button>
    );
};

export default RemoveAttributeGroupButton;