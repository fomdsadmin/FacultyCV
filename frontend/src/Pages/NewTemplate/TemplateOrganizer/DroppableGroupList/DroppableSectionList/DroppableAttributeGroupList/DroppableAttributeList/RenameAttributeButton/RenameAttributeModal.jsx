import { useState, useEffect } from "react";
import { useTemplate } from "Pages/NewTemplate/TemplateContext";
import ModalStylingWrapper from "SharedComponents/ModalStylingWrapper";
import { toast } from "react-toastify";

const RenameAttributeModal = ({ isOpen, attribute, dataSectionId, onClose }) => {
    const { groups, setGroups, getGroupIdContainingPreparedSectionId } = useTemplate();
    const [newName, setNewName] = useState("");

    // Get current renamed value from attribute_rename_map
    useEffect(() => {
        const groupId = getGroupIdContainingPreparedSectionId(dataSectionId);
        const targetGroup = groups.find(group => group.id === groupId);
        const targetSection = targetGroup?.prepared_sections?.find(
            section => section.data_section_id === dataSectionId
        );
        
        const currentRename = targetSection?.attribute_rename_map?.[attribute];
        setNewName(currentRename || attribute);
    }, [attribute, dataSectionId, groups, getGroupIdContainingPreparedSectionId]);

    const handleRename = () => {
        if (!newName.trim()) {
            toast.warning("Attribute name cannot be empty!", { autoClose: 3000 });
            return;
        }

        const groupId = getGroupIdContainingPreparedSectionId(dataSectionId);
        
        setGroups(prevGroups => 
            prevGroups.map(group => {
                if (group.id === groupId) {
                    return {
                        ...group,
                        prepared_sections: group.prepared_sections.map(section => {
                            if (section.data_section_id === dataSectionId) {
                                const updatedRenameMap = {
                                    ...section.attribute_rename_map,
                                    [attribute]: newName.trim()
                                };

                                // If the new name is the same as original, remove from rename map
                                if (newName.trim() === attribute) {
                                    delete updatedRenameMap[attribute];
                                }

                                return {
                                    ...section,
                                    attribute_rename_map: updatedRenameMap
                                };
                            }
                            return section;
                        })
                    };
                }
                return group;
            })
        );

        toast.success(`Attribute renamed to "${newName}"!`, { autoClose: 3000 });
        onClose();
    };

    const handleReset = () => {
        setNewName(attribute);
    };

    if (!isOpen) return null;

    return (
        <ModalStylingWrapper useDefaultBox={true}>
            <button 
                type="button" 
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" 
                onClick={onClose}
            >
                ✕
            </button>
            
            <h3 className="text-lg font-semibold mb-4">
                Rename Attribute
            </h3>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original name: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{attribute}</span>
                </label>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display name:
                </label>
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new display name"
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleRename();
                        }
                    }}
                />
                <p className="text-xs text-gray-500 mt-1">
                    This will change how the attribute appears in your CV, but won't affect the original data.
                </p>
            </div>

            <div className="flex justify-between mt-6">
                <button 
                    type="button" 
                    onClick={handleReset}
                    className="btn btn-ghost px-4 py-2 text-sm"
                >
                    Reset to Original
                </button>
                <div className="flex gap-2">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="btn btn-ghost px-4 py-2 text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleRename}
                        className="btn btn-primary px-4 py-2 text-sm"
                    >
                        Rename
                    </button>
                </div>
            </div>
        </ModalStylingWrapper>
    );
};

export default RenameAttributeModal;