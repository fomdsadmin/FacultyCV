import { Droppable } from "react-beautiful-dnd"
import DraggableAttributeGroupList from "./DraggableAttributeGroupList"

const DroppableAttributeGroupList = ({ attributeGroups, dataSectionId }) => {

    console.log(dataSectionId)

    return (
        <Droppable 
            droppableId={`attribute-groups-${dataSectionId}`} 
            direction="vertical" 
            type={`attribute-group-${dataSectionId}`}
        >
            {(provided) => (
                <div
                    className="flex flex-col gap-4 p-4"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                >
                    {attributeGroups.map((attributeGroup, attributeGroupIndex) => (
                        <DraggableAttributeGroupList 
                            key={attributeGroup.id}
                            attributeGroup={attributeGroup} 
                            attributeGroupIndex={attributeGroupIndex}
                            draggableId={`${dataSectionId}-${attributeGroup.id}`}
                            dataSectionId={dataSectionId}
                        />
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
}

export default DroppableAttributeGroupList