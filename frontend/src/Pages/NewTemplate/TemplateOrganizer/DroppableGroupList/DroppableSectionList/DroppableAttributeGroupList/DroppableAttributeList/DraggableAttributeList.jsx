import { Draggable } from "react-beautiful-dnd";

const DraggableAttributeList = ({draggableId, attributeIndex, attribute}) => {


    return (
        <Draggable
            draggableId={draggableId}
            index={attributeIndex}
            isDragDisabled={false}>
            {(provided) => (
                <div
                    className="mb-2 p-2 border rounded flex flex-row justify-between items-start shadow-glow"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                >
                    <div className="flex items-center justify-between justify-center w-full pl-3 pr-4 pt-3">
                        <h2 className="font-bold mb-2" {...provided.dragHandleProps}>
                            {attribute}
                        </h2>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

export default DraggableAttributeList;