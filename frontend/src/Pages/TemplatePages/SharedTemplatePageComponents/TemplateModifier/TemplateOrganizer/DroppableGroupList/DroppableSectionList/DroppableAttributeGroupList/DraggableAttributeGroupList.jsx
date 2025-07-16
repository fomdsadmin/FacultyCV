import { Draggable } from "react-beautiful-dnd"
import DroppableAttributeList from "./DroppableAttributeList/DroppableAttributeList";
import RemoveAttributeGroupButton from "./RemoveAttributeGroupButton";
import { Accordion } from "SharedComponents/Accordion/Accordion"
import { AccordionItem } from "SharedComponents/Accordion/AccordionItem"
import { FaGripVertical } from "react-icons/fa";
import { useTemplateModifier } from "Pages/TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";

const DraggableAttributeGroupList = ({ attributeGroup, attributeGroupIndex, draggableId, dataSectionId }) => {

    const { HIDDEN_ATTRIBUTE_GROUP_ID } = useTemplateModifier();

    const isHiddenAttributeGroup = HIDDEN_ATTRIBUTE_GROUP_ID === attributeGroup.id;

    return (
        <Draggable
            draggableId={draggableId}
            index={attributeGroupIndex}
            isDragDisabled={isHiddenAttributeGroup}>
            {(provided) => {
                const accordionTitle = (
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                            {!isHiddenAttributeGroup && (
                                <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
                                >
                                    <FaGripVertical className="h-4 w-4 text-gray-500" />
                                </div>
                            )}
                            <h4 className="font-bold text-md">{attributeGroup.title}</h4>
                        </div>
                        <RemoveAttributeGroupButton 
                            attributeGroup={attributeGroup} 
                            dataSectionId={dataSectionId} 
                        />
                    </div>
                );

                return (
                    <div
                        className="mb-2 border rounded shadow-glow"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                    >
                        <Accordion>
                            <AccordionItem title={accordionTitle}>
                                <DroppableAttributeList
                                    attributes={attributeGroup.attributes}
                                    attributeGroupId={attributeGroup.id}
                                    dataSectionId={dataSectionId}
                                />
                            </AccordionItem>
                        </Accordion>
                    </div>
                );
            }}
        </Draggable>
    );
}

export default DraggableAttributeGroupList;