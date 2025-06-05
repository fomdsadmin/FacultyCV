import { Droppable } from "react-beautiful-dnd"
import DraggableSection from "./DraggableSection"

const DroppableSectionList = ({ group }) => {
    return <Droppable droppableId={group.id} type="item">
        {(provided, snapshot) => (
            <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-white p-2 rounded min-h-[50px] w-full"
            >
                {group.sections.map((section, sectionIndex) => (
                    <DraggableSection key={section.data_section_id} draggableId={section.data_section_id} sectionIndex={sectionIndex} section={section}></DraggableSection>
                ))}
                {provided.placeholder}
            </div>
        )}
    </Droppable>
}

export default DroppableSectionList;