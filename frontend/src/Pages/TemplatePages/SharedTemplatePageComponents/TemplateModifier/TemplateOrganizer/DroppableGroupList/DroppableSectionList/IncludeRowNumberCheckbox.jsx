import { useTemplateModifier } from "../../../TemplateModifierContext";

const IncludeRowNumberCheckbox = ({ preparedSection }) => {
    const { setGroups, getGroupIdContainingPreparedSectionId } = useTemplateModifier();

    const handleToggleIncludeRowNumber = (e) => {
        const isChecked = e.target.checked;
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
                                    include_row_number_column: isChecked
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

    return (
        <div className="px-4 py-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                    type="checkbox"
                    checked={preparedSection.include_row_number_column || false}
                    onChange={handleToggleIncludeRowNumber}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Include row number column</span>
            </label>
        </div>
    );
};

export default IncludeRowNumberCheckbox;