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
                {group.prepared_sections.map((preparedSection, preparedSectionIndex) => (
                    <DraggableSection key={preparedSection.data_section_id} draggableId={preparedSection.data_section_id} preparedSectionIndex={preparedSectionIndex} preparedSection={preparedSection}></DraggableSection>
                ))}
                {provided.placeholder}
            </div>
        )}
    </Droppable>
}

export default DroppableSectionList;