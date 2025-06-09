import { useTemplate } from "Pages/NewTemplate/TemplateContext";
import { useTemplateOrganizer } from "Pages/NewTemplate/TemplateOrganizer/TemplateOrganizerContext";
import { useState } from "react";
import { toast } from "react-toastify";
import ModalStylingWrapper from "SharedComponents/ModalStylingWrapper";

const AddAttributeGroupModal = ({ onClose, dataSectionId, groupId }) => {

    const { setGroups, groups } = useTemplateOrganizer();

    const [attributeGroupName, setAttributeGroupName] = useState("");

    const createAttributeGroup = () => {
        if (!attributeGroupName.trim()) {
            toast.warning("Please enter an attribute group name!", { autoClose: 3000 });
            return;
        }

        // Find the section to add the attribute group to
        const targetGroup = groups.find((group) => group.id === groupId);
        const targetSection = targetGroup?.prepared_sections?.find(
            (preparedSection) => preparedSection.data_section_id === dataSectionId
        );

        // Check if attribute group name already exists in this section
        const existingAttributeGroupNames = targetSection.attribute_groups?.map(
            (attributeGroup) => attributeGroup.id
        ) || [];

        if (existingAttributeGroupNames.includes(attributeGroupName)) {
            toast.warning("An attribute group with that name already exists!", { autoClose: 3000 });
            setAttributeGroupName("");
            return;
        }

        // Create new attribute group
        const newAttributeGroup = {
            id: attributeGroupName,
            title: attributeGroupName,
            attributes: []
        };

        // Update the groups state
        setGroups((prevGroups) => 
            prevGroups.map(group => {
                if (group.id === groupId) {
                    return {
                        ...group,
                        prepared_sections: group.prepared_sections.map(section => {
                            if (section.data_section_id === dataSectionId) {
                                return {
                                    ...section,
                                    attribute_groups: [...(section.attribute_groups || []), newAttributeGroup]
                                };
                            }
                            return section;
                        })
                    };
                }
                return group;
            })
        );

        toast.success(`Attribute group "${attributeGroupName}" created successfully!`, { autoClose: 3000 });
        onClose();
    };

    return <>
        <ModalStylingWrapper useDefaultBox={true}>
            <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={onClose}>✕</button>
            <h3 className="text-lg font-semibold mb-4">Add New Attribute Group</h3>
            <input
                className="mt-2 w-full rounded-lg border-4 border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 resize-y transition-all duration-150"
                placeholder="Enter attribute group name..."
                value={attributeGroupName}
                onChange={(e) => setAttributeGroupName(e.target.value)}
                onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        createAttributeGroup();
                    }
                }}
            />
            <div className="flex justify-end mt-4 gap-2">
                <button type="button" onClick={onClose} className="btn btn-ghost px-4 py-2 text-sm">
                    Cancel
                </button>
                <button type="button" onClick={createAttributeGroup} className="btn btn-success text-white px-4 py-2 text-sm">
                    Create Attribute Group
                </button>
            </div>
        </ModalStylingWrapper>
    </>
}

export default AddAttributeGroupModal;