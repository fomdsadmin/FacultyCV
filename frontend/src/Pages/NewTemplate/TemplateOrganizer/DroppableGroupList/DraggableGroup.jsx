import { Draggable } from "react-beautiful-dnd"
import { useTemplate } from "../../TemplateContext";
import { FaTimesCircle, FaGripVertical } from "react-icons/fa";
import DroppableSectionList from "./DroppableSectionList/DroppableSectionList";
import { Accordion } from "SharedComponents/Accordion/Accordion"
import { AccordionItem } from "SharedComponents/Accordion/AccordionItem"

const DraggableGroup = ({ group, groupIndex }) => {

    const { HIDDEN_GROUP_ID, groups, setGroups } = useTemplate();

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

    const isDefaultGroup = group.id === HIDDEN_GROUP_ID

    return (
        <Draggable
            draggableId={group.id}
            index={groupIndex}
            isDragDisabled={isDefaultGroup}>
            {(provided) => {
                const accordionTitle = (
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                            {!isDefaultGroup && (
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
                            <AccordionItem title={accordionTitle} hideIsOpenIcon={true}>
                                <DroppableSectionList group={group} />
                            </AccordionItem>
                        </Accordion>
                    </div>
                );
            }}
        </Draggable>
    );
}

export default DraggableGroup;