import { Droppable } from "react-beautiful-dnd"
import DraggableAttributeList from "./DraggableAttributeList";

const DroppableAttributeList = ({ attributes, attributeGroupId, dataSectionId, dataSectionTitle }) => {

    console.log(dataSectionId)

    return (
        <Droppable 
            droppableId={`attributes-${dataSectionId}-${attributeGroupId}`} 
            direction="vertical" 
            type={`attributes-${dataSectionId}`}
        >
            {(provided) => (
                <div
                    className="flex flex-col gap-2 p-4"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                >
                    {attributes.map((attribute, attributeIndex) => (
                        <DraggableAttributeList 
                            key={attribute}
                            attribute={attribute} 
                            attributeIndex={attributeIndex}
                            draggableId={`${attributeGroupId}-${attribute}-${dataSectionId}`}
                            dataSectionId={dataSectionId}
                            dataSectionTitle={dataSectionTitle}
                        />
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
}

export default DroppableAttributeList