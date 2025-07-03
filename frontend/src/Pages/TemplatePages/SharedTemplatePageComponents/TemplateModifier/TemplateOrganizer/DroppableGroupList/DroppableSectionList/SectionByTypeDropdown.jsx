import { useTemplateModifier } from "../../../TemplateModifierContext";
import { FaChevronDown } from "react-icons/fa";

const SectionByTypeDropdown = ({ preparedSection }) => {
    const { setGroups, getGroupIdContainingPreparedSectionId, HIDDEN_ATTRIBUTE_GROUP_ID } = useTemplateModifier();

    // Get available attributes (excluding hidden ones, like SortingButton)
    const availableAttributes = preparedSection.attribute_groups
        .filter(group => group.id !== HIDDEN_ATTRIBUTE_GROUP_ID)
        .flatMap(group => group.attributes || []);

    const handleSectionByTypeChange = (e) => {
        const selectedAttribute = e.target.value === "" ? null : e.target.value;
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
                                    section_by_type: selectedAttribute
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

    const getDisplayText = () => {
        if (!preparedSection.section_by_type) {
            return "Section by type (unselected)";
        }
        return (
            <span>
                Section by → <span className="font-mono bg-gray-100 px-2 py-1 rounded">{preparedSection.section_by_type}</span>
            </span>
        );
    };

    return (
        <div className="relative inline-block mt-2">
            {/* Hidden select for functionality */}
            <select
                value={preparedSection.section_by_type || ""}
                onChange={handleSectionByTypeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
                <option value={""}>{"Section by type (unselected)"}</option>
                {availableAttributes.map(attribute => (
                    <option key={attribute} value={attribute}>
                        Section by {attribute}
                    </option>
                ))}
            </select>
            
            {/* Visible styled button */}
            <div className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border cursor-pointer whitespace-nowrap">
                {getDisplayText()}
                <FaChevronDown className="ml-1 h-3 w-3 text-gray-500 flex-shrink-0" />
            </div>
        </div>
    );
};

export default SectionByTypeDropdown;