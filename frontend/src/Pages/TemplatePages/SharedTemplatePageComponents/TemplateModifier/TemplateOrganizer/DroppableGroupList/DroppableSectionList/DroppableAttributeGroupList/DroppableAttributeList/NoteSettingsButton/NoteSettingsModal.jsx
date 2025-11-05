import { useState, useEffect } from "react";
import ModalStylingWrapper from "SharedComponents/ModalStylingWrapper";
import { toast } from "react-toastify";
import { useTemplateModifier } from "Pages/TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";

const NoteSettingsModal = ({ isOpen, attribute, dataSectionId, dataSectionTitle, onClose }) => {
    const { groups, setGroups, getGroupIdContainingPreparedSectionId, sectionsMap } = useTemplateModifier();
    const [displayAttributeName, setDisplayAttributeName] = useState(true);
    const [attributeToAssociateNote, setAttributeToAssociateNote] = useState("");
    const [availableAttributes, setAvailableAttributes] = useState([]);
    const [attributeRenameMap, setAttributeRenameMap] = useState({});

    // Get available attributes and rename map
    useEffect(() => {
        const groupId = getGroupIdContainingPreparedSectionId(dataSectionId);
        const targetGroup = groups.find(group => group.id === groupId);
        const targetSection = targetGroup?.prepared_sections?.find(
            section => section.data_section_id === dataSectionId
        );

        if (sectionsMap && sectionsMap[dataSectionTitle] && sectionsMap[dataSectionTitle].attributes) {
            const allAttributes = Object.keys(JSON.parse(sectionsMap[dataSectionTitle].attributes));
            setAvailableAttributes(allAttributes.filter(attr => attr !== attribute));
        } else {
            setAvailableAttributes([]);
        }

        // Get the rename map
        setAttributeRenameMap(targetSection?.attribute_rename_map || {});
    }, [dataSectionId, attribute, sectionsMap, groups, getGroupIdContainingPreparedSectionId]);

    // Load current note settings
    useEffect(() => {
        const groupId = getGroupIdContainingPreparedSectionId(dataSectionId);
        const targetGroup = groups.find(group => group.id === groupId);
        const targetSection = targetGroup?.prepared_sections?.find(
            section => section.data_section_id === dataSectionId
        );
        
        const currentNoteSetting = targetSection?.note_settings?.find(
            setting => setting.attribute === attribute
        );
        
        if (currentNoteSetting) {
            setDisplayAttributeName(currentNoteSetting.display_attribute_name ?? true);
            setAttributeToAssociateNote(currentNoteSetting.attribute_to_associate_note || "");
        } else {
            setDisplayAttributeName(true);
            setAttributeToAssociateNote("");
        }
    }, [attribute, dataSectionId, groups, getGroupIdContainingPreparedSectionId]);

    // Helper function to get display name for attribute
    const getAttributeDisplayName = (attr) => {
        const renamed = attributeRenameMap[attr];
        if (renamed) {
            return `${attr} → ${renamed}`;
        }
        return attr;
    };

    const handleSave = () => {
        const groupId = getGroupIdContainingPreparedSectionId(dataSectionId);
        
        setGroups(prevGroups => 
            prevGroups.map(group => {
                if (group.id === groupId) {
                    return {
                        ...group,
                        prepared_sections: group.prepared_sections.map(section => {
                            if (section.data_section_id === dataSectionId) {
                                const existingNoteSettings = section.note_settings || [];
                                const otherSettings = existingNoteSettings.filter(
                                    setting => setting.attribute !== attribute
                                );
                                
                                const newNoteSetting = {
                                    attribute: attribute,
                                    display_attribute_name: displayAttributeName,
                                    attribute_to_associate_note: attributeToAssociateNote
                                };

                                console.log(existingNoteSettings)

                                return {
                                    ...section,
                                    note_settings: [...otherSettings, newNoteSetting]
                                };
                            }
                            return section;
                        })
                    };
                }
                return group;
            })
        );

        toast.success(`Note settings updated for "${attribute}"!`, { autoClose: 3000 });
        onClose();
    };

    const handleRemove = () => {
        const groupId = getGroupIdContainingPreparedSectionId(dataSectionId);
        
        setGroups(prevGroups => 
            prevGroups.map(group => {
                if (group.id === groupId) {
                    return {
                        ...group,
                        prepared_sections: group.prepared_sections.map(section => {
                            if (section.data_section_id === dataSectionId) {
                                const existingNoteSettings = section.note_settings || [];
                                const filteredSettings = existingNoteSettings.filter(
                                    setting => setting.attribute !== attribute
                                );

                                return {
                                    ...section,
                                    note_settings: filteredSettings
                                };
                            }
                            return section;
                        })
                    };
                }
                return group;
            })
        );

        toast.success(`Note settings removed for "${attribute}"!`, { autoClose: 3000 });
        onClose();
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
            
            <h3 className="text-lg font-semibold mb-2">
                Configure Note Settings
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
                Attributes with note settings will be displayed as notes in the final output, regardless of their visibility status in attribute groups.
            </p>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attribute: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{getAttributeDisplayName(attribute)}</span>
                </label>
                
                <div className="mb-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="display-attribute-name"
                            checked={displayAttributeName}
                            onChange={(e) => setDisplayAttributeName(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="display-attribute-name" className="text-sm text-gray-700">
                            Display attribute name
                        </label>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Associate note with attribute:
                    </label>
                    <select
                        value={attributeToAssociateNote}
                        onChange={(e) => setAttributeToAssociateNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">No association</option>
                        {availableAttributes.map(attr => (
                            <option key={attr} value={attr}>
                                {getAttributeDisplayName(attr)}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Select which attribute this note should be associated with.
                    </p>
                </div>
            </div>

            <div className="flex justify-between mt-6">
                <button 
                    type="button" 
                    onClick={handleRemove}
                    className="btn btn-error btn-outline px-4 py-2 text-sm"
                >
                    Remove Settings
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
                        onClick={handleSave}
                        className="btn btn-primary px-4 py-2 text-sm"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </ModalStylingWrapper>
    );
};

export default NoteSettingsModal;