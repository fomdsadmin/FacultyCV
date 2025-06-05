import { Droppable } from "react-beautiful-dnd"
import DraggableGroup from "./DraggableGroup"

const DroppableGroup = ({ groups }) => {
    return <Droppable droppableId="all-groups" direction="vertical" type="column">
        {(provided) => (
            <div
                className="flex flex-col gap-4 p-4"
                {...provided.droppableProps}
                ref={provided.innerRef}
            >
                {groups.map((group, groupIndex) => (
                    <DraggableGroup group={group} groupIndex={groupIndex} key={group.id}></DraggableGroup>
                ))}
                {provided.placeholder}
            </div>
        )}
    </Droppable>
}

export default DroppableGroup