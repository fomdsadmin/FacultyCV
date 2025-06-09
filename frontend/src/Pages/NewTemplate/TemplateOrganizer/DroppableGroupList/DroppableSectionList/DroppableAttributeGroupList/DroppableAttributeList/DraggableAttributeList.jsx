import { Draggable } from "react-beautiful-dnd";
import { FaGripVertical } from "react-icons/fa";

const DraggableAttributeList = ({draggableId, attributeIndex, attribute}) => {

    return (
        <Draggable
            draggableId={draggableId}
            index={attributeIndex}
            isDragDisabled={false}>
            {(provided) => (
                <div
                    className="mb-1 px-2 py-1 border rounded flex items-center shadow-sm hover:bg-gray-50 transition-colors"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                >
                    <div
                        {...provided.dragHandleProps}
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded mr-2"
                    >
                        <FaGripVertical className="h-3 w-3 text-gray-500" />
                    </div>
                    <span className="text-ms font-medium text-gray-700 flex-1">
                        {attribute}
                    </span>
                </div>
            )}
        </Draggable>
    );
}

export default DraggableAttributeList;