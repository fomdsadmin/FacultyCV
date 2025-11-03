import React from "react";
import { useTemplateModifier } from "../../../TemplateModifierContext";

const InstructionTextField = ({ preparedSection }) => {
    const { setGroups, getGroupIdContainingPreparedSectionId } = useTemplateModifier();
    const [expanded, setExpanded] = React.useState(false);
    const [value, setValue] = React.useState(preparedSection?.instructions || '');

    React.useEffect(() => {
        setValue(preparedSection?.instructions || '');
    }, [preparedSection?.instructions]);

    const handleSave = () => {
        const groupId = getGroupIdContainingPreparedSectionId(preparedSection.data_section_id);
        setGroups(prev =>
            prev.map(group => {
                if (group.id !== groupId) return group;
                return {
                    ...group,
                    prepared_sections: group.prepared_sections.map(section =>
                        section.data_section_id === preparedSection.data_section_id
                            ? { ...section, instructions: value }
                            : section
                    )
                };
            })
        );
        setExpanded(false);
    };

    const handleCancel = () => {
        setValue(preparedSection?.instructions || '');
        setExpanded(false);
    };

    return (
        <div className="px-4 py-2">
            <div className="text-xs text-gray-600 mb-1">
                Instructions (these will display above the table)
            </div>
            {!expanded ? (
                <input
                    type="text"
                    className="w-full text-sm border rounded px-2 py-1 cursor-text"
                    placeholder="Add instructions..."
                    value={value}
                    onFocus={() => setExpanded(true)}
                    onChange={e => setValue(e.target.value)}
                    aria-label="Section instructions"
                />
            ) : (
                <div className="flex flex-col gap-2">
                    <textarea
                        rows={4}
                        className="w-full text-sm border rounded px-2 py-1"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        aria-label="Section instructions expanded"
                    />
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                            onClick={handleSave}
                        >
                            Save
                        </button>
                        <button
                            className="px-3 py-1 bg-gray-200 text-sm rounded"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructionTextField;