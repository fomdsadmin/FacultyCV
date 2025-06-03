import { Draggable } from "react-beautiful-dnd"

const DraggableSection = ({ draggableId, sectionIndex, section }) => {
    return <Draggable
        draggableId={section.id}
        index={sectionIndex}
    >
        {(provided) => (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className="mb-2 p-2 border rounded flex flex-col justify-between items-start shadow-glow"
            >
                {section.content}
            </div>
        )}
    </Draggable>
}

export default DraggableSection;