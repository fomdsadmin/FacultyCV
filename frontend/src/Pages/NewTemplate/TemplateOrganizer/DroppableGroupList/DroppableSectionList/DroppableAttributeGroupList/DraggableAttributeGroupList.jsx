import { useTemplate } from "Pages/NewTemplate/TemplateContext";
import { Draggable } from "react-beautiful-dnd"
import DroppableAttributeList from "./DroppableAttributeList/DroppableAttributeList";

const DraggableAttributeGroupList = ({ attributeGroup, attributeGroupIndex, draggableId, dataSectionId}) => {

    const { HIDDEN_GROUP_ID } = useTemplate();


    return (
        <Draggable
            draggableId={draggableId}
            index={attributeGroupIndex}
            isDragDisabled={false}>
            {(provided) => (
                <div
                    className="mb-2 p-2 border rounded flex flex-row justify-between items-start shadow-glow"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                >
                    <div className="flex flex-col w-full pl-3 pr-4 pt-3">
                        <h2 className="font-bold mb-2" {...provided.dragHandleProps}>
                            {attributeGroup.title}
                        </h2>
                        <DroppableAttributeList attributes={attributeGroup.attributes} attributeGroupId={attributeGroup.id} dataSectionId={dataSectionId}/>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

export default DraggableAttributeGroupList;