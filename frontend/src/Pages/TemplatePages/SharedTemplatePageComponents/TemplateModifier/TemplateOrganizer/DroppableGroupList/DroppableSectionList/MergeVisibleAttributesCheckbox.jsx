import { useTemplateModifier } from "../../../TemplateModifierContext";

const MergeVisibleAttributesCheckbox = ({ preparedSection }) => {
    const { setGroups, getGroupIdContainingPreparedSectionId } = useTemplateModifier();

    const handleToggleMergeVisibleAttributes = (e) => {
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
                                    merge_visible_attributes: isChecked
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
                    checked={preparedSection.merge_visible_attributes || false}
                    onChange={handleToggleMergeVisibleAttributes}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Merge visible attributes</span>
            </label>
        </div>
    );
};

export default MergeVisibleAttributesCheckbox;