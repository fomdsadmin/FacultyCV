import { useState, useEffect } from "react";
import { useTemplate } from "Pages/NewTemplate/TemplateContext";
import ModalStylingWrapper from "SharedComponents/ModalStylingWrapper";
import { toast } from "react-toastify";

const RenameSectionModal = ({ isOpen, preparedSection, onClose }) => {
    const { groups, setGroups, getGroupIdContainingPreparedSectionId } = useTemplate();
    const [newTitle, setNewTitle] = useState("");

    // Get current renamed value from renamed_section_title
    useEffect(() => {
        const groupId = getGroupIdContainingPreparedSectionId(preparedSection.data_section_id);
        const targetGroup = groups.find(group => group.id === groupId);
        const targetSection = targetGroup?.prepared_sections?.find(
            section => section.data_section_id === preparedSection.data_section_id
        );
        
        const currentRename = targetSection?.renamed_section_title;
        setNewTitle(currentRename || preparedSection.title);
    }, [preparedSection, groups, getGroupIdContainingPreparedSectionId]);

    const handleRename = () => {
        if (!newTitle.trim()) {
            toast.warning("Section title cannot be empty!", { autoClose: 3000 });
            return;
        }

        const groupId = getGroupIdContainingPreparedSectionId(preparedSection.data_section_id);
        
        setGroups(prevGroups => 
            prevGroups.map(group => {
                if (group.id === groupId) {
                    return {
                        ...group,
                        prepared_sections: group.prepared_sections.map(section => {
                            if (section.data_section_id === preparedSection.data_section_id) {
                                // If the new title is the same as original, set to null
                                const renamedTitle = newTitle.trim() === preparedSection.title ? null : newTitle.trim();
                                
                                return {
                                    ...section,
                                    renamed_section_title: renamedTitle
                                };
                            }
                            return section;
                        })
                    };
                }
                return group;
            })
        );

        const message = newTitle.trim() === preparedSection.title 
            ? "Section title reset to original!"
            : `Section renamed to "${newTitle}"!`;
        
        toast.success(message, { autoClose: 3000 });
        onClose();
    };

    const handleReset = () => {
        setNewTitle(preparedSection.title);
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
                Rename Section
            </h3>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original title: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{preparedSection.title}</span>
                </label>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display title:
                </label>
                <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new display title"
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleRename();
                        }
                    }}
                />
                <p className="text-xs text-gray-500 mt-1">
                    This will change how the section appears in your CV, but won't affect the original data.
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

export default RenameSectionModal;