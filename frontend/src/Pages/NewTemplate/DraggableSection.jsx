import { Draggable } from "react-beautiful-dnd"
import { FaTimesCircle, FaPlusCircle } from "react-icons/fa"
import { useTemplate } from "./TemplateContext"

const DraggableSection = ({ section, index }) => {
    const { toggleSection } = useTemplate()

    const handleToggle = () => {
        toggleSection(index)
    }

    return (
        <Draggable key={section.data_section_id} draggableId={section.data_section_id.toString()} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="mb-2 p-2 border rounded flex justify-between items-center shadow-glow"
                >
                    <div>
                        <h3 className="text-lg font-semibold">{section.title}</h3>
                        <p className="text-sm text-gray-600">{section.data_type}</p>
                    </div>
                    <button onClick={handleToggle} className="btn btn-xs btn-circle btn-ghost">
                        {section.showMinus ? (
                            <FaTimesCircle className="h-6 w-6 text-red-500" />
                        ) : (
                            <FaPlusCircle className="h-6 w-6 text-green-500" />
                        )}
                    </button>
                </div>
            )}
        </Draggable>
    )
}

export default DraggableSection
