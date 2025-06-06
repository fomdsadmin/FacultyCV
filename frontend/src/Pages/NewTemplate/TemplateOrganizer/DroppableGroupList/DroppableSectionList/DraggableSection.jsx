import { useTemplate } from "Pages/NewTemplate/TemplateContext"
import { Draggable } from "react-beautiful-dnd"
import { FaTimesCircle, FaGripVertical } from "react-icons/fa"
import DroppableAttributeGroupList from "./DroppableAttributeGroupList/DroppableAttributeGroupList"
import { Accordion } from "SharedComponents/Accordion/Accordion"
import { AccordionItem } from "SharedComponents/Accordion/AccordionItem"
import AddAttributeGroupButton from "./AddAttributeGroupButton/AddAttributeGroupButton"

const DraggableSection = ({ draggableId, preparedSectionIndex, preparedSection, isInHiddenGroup }) => {

    const { getGroupIdContainingPreparedSectionId, HIDDEN_GROUP_ID, groups, setGroups } = useTemplate();

    const currentGroupId = getGroupIdContainingPreparedSectionId(preparedSection.data_section_id);

    const handleRemoveSection = () => {
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
    }

    return <Draggable
        draggableId={draggableId}
        index={preparedSectionIndex}
    >
        {(provided) => {
            const accordionTitle = (
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                        <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
                        >
                            <FaGripVertical className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{preparedSection.title}</h3>
                            <p className="text-sm text-gray-600">{preparedSection.data_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pr-4">
                        <AddAttributeGroupButton groupId={currentGroupId} dataSectionId={preparedSection.data_section_id}/>
                        {getGroupIdContainingPreparedSectionId(preparedSection.data_section_id) !== HIDDEN_GROUP_ID && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSection();
                                }}
                                className="btn btn-xs btn-circle btn-ghost"
                            >
                                <FaTimesCircle className="h-6 w-6 text-red-500" />
                            </button>
                        )}
                    </div>
                </div>
            );

            return (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="mb-2 border rounded shadow-glow w-full"
                >
                    <Accordion>
                        <AccordionItem title={accordionTitle} hideIsOpenIcon={true && !isInHiddenGroup}>
                            <DroppableAttributeGroupList
                                attributeGroups={preparedSection.attribute_groups}
                                dataSectionId={preparedSection.data_section_id}
                            />
                        </AccordionItem>
                    </Accordion>
                </div>
            );
        }}
    </Draggable>
}

export default DraggableSection;