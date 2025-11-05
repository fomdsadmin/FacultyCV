import React from "react";
import { useTemplateModifier } from "../../../TemplateModifierContext";

const AddUnderlinedHeader = ({ preparedSection }) => {
    const { setGroups, getGroupIdContainingPreparedSectionId } = useTemplateModifier();
    const [value, setValue] = React.useState(preparedSection?.underlined_title || '');

    React.useEffect(() => {
        setValue(preparedSection?.underlined_title || '');
    }, [preparedSection?.underlined_title]);

    const handleClear = () => {
        setValue('');
        const groupId = getGroupIdContainingPreparedSectionId(preparedSection.data_section_id);
        setGroups(prev =>
            prev.map(group => {
                if (group.id !== groupId) return group;
                return {
                    ...group,
                    prepared_sections: group.prepared_sections.map(section =>
                        section.data_section_id === preparedSection.data_section_id
                            ? { ...section, underlined_title: null }
                            : section
                    )
                };
            })
        );
    };

    // Persist immediately on change (no Save button)
    const handleChange = (next) => {
        setValue(next);
        const groupId = getGroupIdContainingPreparedSectionId(preparedSection.data_section_id);
        setGroups(prev =>
            prev.map(group => {
                if (group.id !== groupId) return group;
                return {
                    ...group,
                    prepared_sections: group.prepared_sections.map(section =>
                        section.data_section_id === preparedSection.data_section_id
                            ? { ...section, underlined_title: next || null }
                            : section
                    )
                };
            })
        );
    };

    return (
        <div className="px-4 py-2">
            <div className="text-xs text-gray-600 mb-1">
                Section underlined header (displayed above the table, underlined)
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    className="flex-1 text-sm border rounded px-2 py-1"
                    placeholder="Add underlined header..."
                    value={value}
                    onChange={e => handleChange(e.target.value)}
                />
                <button
                    type="button"
                    className="px-3 py-1 bg-gray-200 text-sm rounded"
                    onClick={handleClear}
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

export default AddUnderlinedHeader;