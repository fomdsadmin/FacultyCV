import { Draggable } from "react-beautiful-dnd"
import { FaTimesCircle, FaGripVertical } from "react-icons/fa";
import DroppableSectionList from "./DroppableSectionList/DroppableSectionList";
import { Accordion } from "SharedComponents/Accordion/Accordion"
import { AccordionItem } from "SharedComponents/Accordion/AccordionItem"
import { useTemplateModifier } from "../../TemplateModifierContext";

const DraggableGroup = ({ group, groupIndex }) => {

    const { HIDDEN_GROUP_ID, groups, setGroups } = useTemplateModifier();

    const onRemoveGroup = () => {
        var updatedGroups = [...groups];

        const indexOfDefaultGroupToModify = groups.findIndex((group) => group.id === HIDDEN_GROUP_ID);
        const indexOfCurrentGroupToDelete = groups.findIndex((grp) => grp.id === group.id);
        const defaultGroup = groups[indexOfDefaultGroupToModify];
        const updatedDefaultGroupPreparedSections = [...groups[indexOfCurrentGroupToDelete].prepared_sections, ...defaultGroup.prepared_sections];
        updatedGroups[indexOfDefaultGroupToModify] = {
            ...defaultGroup,
            prepared_sections: updatedDefaultGroupPreparedSections
        };

        updatedGroups = updatedGroups.filter((grp) => grp.id !== group.id);

        setGroups(updatedGroups);
    }

    const isHiddenGroup = group.id === HIDDEN_GROUP_ID

    return (
        <Draggable
            draggableId={group.id}
            index={groupIndex}
            isDragDisabled={isHiddenGroup}>
            {(provided) => {
                const accordionTitle = (
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                            {!isHiddenGroup && (
                                <div 
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
                                >
                                    <FaGripVertical className="h-4 w-4 text-gray-500" />
                                </div>
                            )}
                            <h2 className="font-bold text-lg">{group.title}</h2>
                        </div>
                        {group.id !== HIDDEN_GROUP_ID && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveGroup();
                                }} 
                                className="btn btn-xs btn-circle btn-ghost"
                            >
                                <FaTimesCircle className="h-6 w-6 text-red-500" />
                            </button>
                        )}
                    </div>
                );

                return (
                    <div
                        className="mb-2 border rounded shadow-glow"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                    >
                        <Accordion>
                            <AccordionItem title={accordionTitle} hideIsOpenIcon={true && !isHiddenGroup}>
                                <DroppableSectionList group={group} isInHiddenGroup={isHiddenGroup} />
                            </AccordionItem>
                        </Accordion>
                    </div>
                );
            }}
        </Draggable>
    );
}

export default DraggableGroup;