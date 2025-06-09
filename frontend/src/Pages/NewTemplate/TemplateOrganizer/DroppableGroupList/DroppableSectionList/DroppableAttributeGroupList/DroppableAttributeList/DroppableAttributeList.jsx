import { Droppable } from "react-beautiful-dnd"
import DraggableAttributeList from "./DraggableAttributeList";

const DroppableAttributeList = ({ attributes, attributeGroupId, dataSectionId }) => {

    console.log(dataSectionId)

    return (
        <Droppable 
            droppableId={`attributes-${dataSectionId}-${attributeGroupId}`} 
            direction="vertical" 
            type={`attributes-${dataSectionId}`}
        >
            {(provided) => (
                <div
                    className="flex flex-col gap-4 p-4"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                >
                    {attributes.map((attribute, attributeIndex) => (
                        <DraggableAttributeList 
                            key={attribute}
                            attribute={attribute} 
                            attributeIndex={attributeIndex}
                            draggableId={`${attributeGroupId}-${attribute}-${dataSectionId}`}
                        />
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
}

export default DroppableAttributeList