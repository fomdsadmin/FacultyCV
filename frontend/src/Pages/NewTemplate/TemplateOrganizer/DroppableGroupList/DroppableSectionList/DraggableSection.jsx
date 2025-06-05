import { useTemplate } from "Pages/NewTemplate/TemplateContext"
import { Draggable } from "react-beautiful-dnd"
import { FaTimesCircle } from "react-icons/fa"
import DroppableAttributeGroupList from "./DroppableAttributeGroupList/DroppableAttributeGroupList"

const DraggableSection = ({ draggableId, preparedSectionIndex, preparedSection }) => {

    const { getGroupIdContainingPreparedSectionId, HIDDEN_GROUP_ID, groups, setGroups } = useTemplate()

    const handleRemoveSection = () => {
        const indexOfGroupToModify = groups.findIndex((group) => group.id === getGroupIdContainingPreparedSectionId(preparedSection.data_section_id));
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
    }

    return <Draggable
        draggableId={draggableId}
        index={preparedSectionIndex}
    >
        {(provided) => (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className="mb-2 p-2 border rounded shadow-glow w-full"
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold">{preparedSection.title}</h3>
                        <p className="text-sm text-gray-600">{preparedSection.data_type}</p>
                    </div>
                    {getGroupIdContainingPreparedSectionId(preparedSection.data_section_id) !== HIDDEN_GROUP_ID && (
                        <button onClick={handleRemoveSection} className="btn btn-xs btn-circle btn-ghost">
                            <FaTimesCircle className="h-6 w-6 text-red-500" />
                        </button>
                    )}
                </div>
                <DroppableAttributeGroupList attributeGroups={preparedSection.attribute_groups} dataSectionId={preparedSection.data_section_id}></DroppableAttributeGroupList>
            </div>
        )}
    </Draggable>
}

export default DraggableSection;