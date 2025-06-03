"use client"

import { Droppable } from "react-beautiful-dnd"
import DraggableSection from "./DraggableSection"
import { useTemplate } from "./TemplateContext"

const DraggableSectionList = () => {
    const { sections } = useTemplate()

    return (
        <Droppable droppableId="sections">
            {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {sections.map((section, index) => (
                        <DraggableSection key={section.data_section_id} section={section} index={index} />
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    )
}

export default DraggableSectionList
