import { Droppable } from "react-beautiful-dnd"
import DraggableSection from "./DraggableSection"

const DroppableSectionList = ({ group }) => {
    return <Droppable droppableId={group.id} type="item">
        {(provided, snapshot) => (
            <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-white p-2 rounded min-h-[50px]"
            >
                {group.items.map((item, itemIndex) => (
                    <DraggableSection key={item.id} draggableId={item.id} sectionIndex={itemIndex} section={item}></DraggableSection>
                ))}
                {provided.placeholder}
            </div>
        )}
    </Droppable>
}

export default DroppableSectionList;