import { Draggable } from "react-beautiful-dnd"
import DroppableSectionList from "../DroppableSectionList/DroppableSectionList"

const DraggableGroup = ({ group, groupIndex }) => {
    return <Draggable draggableId={group.id} index={groupIndex}>
        {(provided) => (
            <div
                className="mb-2 p-2 border rounded flex flex-col justify-between items-start shadow-glow"
                ref={provided.innerRef}
                {...provided.draggableProps}
            >
                <h2 className="font-bold mb-2" {...provided.dragHandleProps}>
                    {group.title}
                </h2>
                <DroppableSectionList group={group}></DroppableSectionList>
            </div>
        )}
    </Draggable>
}

export default DraggableGroup;