import { Draggable } from "react-beautiful-dnd";

const DraggableAttributeList = ({draggableId, attributeIndex, attribute}) => {

    return (
        <Draggable
            draggableId={draggableId}
            index={attributeIndex}
            isDragDisabled={false}>
            {(provided) => (
                <div
                    className="mb-1 px-2 py-1 border rounded-full flex items-center justify-center text-center shadow-sm cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <span className="text-xs font-medium text-gray-700">
                        {attribute}
                    </span>
                </div>
            )}
        </Draggable>
    );
}

export default DraggableAttributeList;