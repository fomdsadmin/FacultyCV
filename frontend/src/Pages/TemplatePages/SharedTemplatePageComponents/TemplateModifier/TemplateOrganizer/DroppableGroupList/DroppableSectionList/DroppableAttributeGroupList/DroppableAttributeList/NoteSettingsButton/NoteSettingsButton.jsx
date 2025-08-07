import { useState, useEffect } from "react";
import { FaStickyNote, FaRegStickyNote } from "react-icons/fa";
import { useTemplateModifier } from "Pages/TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";
import NoteSettingsModal from "./NoteSettingsModal";

const NoteSettingsButton = ({ attribute, dataSectionId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasNoteSettings, setHasNoteSettings] = useState(false);
    const { groups, getGroupIdContainingPreparedSectionId } = useTemplateModifier();

    // Check if this attribute has note settings configured
    useEffect(() => {
        const groupId = getGroupIdContainingPreparedSectionId(dataSectionId);
        const targetGroup = groups.find(group => group.id === groupId);
        const targetSection = targetGroup?.prepared_sections?.find(
            section => section.data_section_id === dataSectionId
        );
        
        const currentNoteSetting = targetSection?.note_settings?.find(
            setting => setting.attribute === attribute
        );
        
        setHasNoteSettings(!!currentNoteSetting);
    }, [attribute, dataSectionId, groups, getGroupIdContainingPreparedSectionId]);

    const handleOpenModal = (e) => {
        e.stopPropagation();
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <button
                onClick={handleOpenModal}
                className={`p-1 hover:bg-gray-200 rounded mr-2 transition-colors ${
                    hasNoteSettings ? 'text-blue-600' : 'text-gray-500'
                }`}
                title={
                    hasNoteSettings 
                        ? `Note settings configured for ${attribute}` 
                        : `Configure notes for ${attribute}`
                }
            >
                {hasNoteSettings ? (
                    <FaStickyNote className="h-3 w-3" />
                ) : (
                    <FaRegStickyNote className="h-3 w-3" />
                )}
            </button>

            {isModalOpen && (
                <NoteSettingsModal
                    isOpen={isModalOpen}
                    attribute={attribute}
                    dataSectionId={dataSectionId}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default NoteSettingsButton;