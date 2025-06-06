import { useTemplate } from "Pages/NewTemplate/TemplateContext";

const RowCountCheckbox = ({ preparedSection }) => {
    const { setGroups, getGroupIdContainingPreparedSectionId } = useTemplate();

    const handleToggleRowCount = (e) => {
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
                                    show_row_count: isChecked
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
                    checked={preparedSection.show_row_count || false}
                    onChange={handleToggleRowCount}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Show row count</span>
            </label>
        </div>
    );
};

export default RowCountCheckbox;