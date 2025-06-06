import { useTemplate } from "Pages/NewTemplate/TemplateContext";
import { FaTimesCircle } from "react-icons/fa";

const RemoveSectionButton = ({ preparedSection }) => {
    const { getGroupIdContainingPreparedSectionId, HIDDEN_GROUP_ID, groups, setGroups } = useTemplate();

    const currentGroupId = getGroupIdContainingPreparedSectionId(preparedSection.data_section_id);

    const handleRemoveSection = (e) => {
        e.stopPropagation();

        const indexOfGroupToModify = groups.findIndex((group) => group.id === currentGroupId);
        const group = groups[indexOfGroupToModify];
        const updatedPreparedSections = group.prepared_sections.filter(s => s.data_section_id !== preparedSection.data_section_id);
        const updatedGroups = [...groups];
        updatedGroups[indexOfGroupToModify] = {
            ...group,
            prepared_sections: updatedPreparedSections
        };

        const indexOfDefaultGroupToModify = groups.findIndex((group) => group.id === HIDDEN_GROUP_ID);
        const defaultGroup = groups[indexOfDefaultGroupToModify];
        const updatedDefaultGroupPreparedSections = [preparedSection, ...defaultGroup.prepared_sections];
        updatedGroups[indexOfDefaultGroupToModify] = {
            ...defaultGroup,
            prepared_sections: updatedDefaultGroupPreparedSections
        };

        setGroups(updatedGroups);
    };

    // Don't render button if section is in hidden group
    if (getGroupIdContainingPreparedSectionId(preparedSection.data_section_id) === HIDDEN_GROUP_ID) {
        return null;
    }

    return (
        <button
            onClick={handleRemoveSection}
            className="btn btn-xs btn-circle btn-ghost"
        >
            <FaTimesCircle className="h-6 w-6 text-red-500" />
        </button>
    );
};

export default RemoveSectionButton;