import { Draggable } from "react-beautiful-dnd"
import { useTemplate } from "../../TemplateContext"
import { FaTimesCircle } from "react-icons/fa"

const DraggableSection = ({ draggableId, sectionIndex, section }) => {

    const { getGroupIdContainingSectionId, DEFAULT_GROUP_ID, groups, setGroups } = useTemplate()

    const handleRemoveSection = () => {
        const indexOfGroupToModify = groups.findIndex((group) => group.id === getGroupIdContainingSectionId(section.data_section_id));
        const group = groups[indexOfGroupToModify];
        const updatedSections = group.sections.filter(s => s.data_section_id !== section.data_section_id);
        const updatedGroups = [...groups];
        updatedGroups[indexOfGroupToModify] = {
            ...group,
            sections: updatedSections
        };

        const indexOfDefaultGroupToModify = groups.findIndex((group) => group.id === DEFAULT_GROUP_ID);
        const defaultGroup = groups[indexOfDefaultGroupToModify];
        const updatedDefaultGroupSections = [section, ...defaultGroup.sections];
        updatedGroups[indexOfDefaultGroupToModify] = {
            ...defaultGroup,
            sections: updatedDefaultGroupSections
        };

        setGroups(updatedGroups);
    }

    return <Draggable
        draggableId={draggableId}
        index={sectionIndex}
    >
        {(provided) => (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className="mb-2 p-2 border rounded flex justify-between items-center shadow-glow w-full"
            >
                <div>
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                    <p className="text-sm text-gray-600">{section.data_type}</p>
                </div>
                {getGroupIdContainingSectionId(section.data_section_id) !== DEFAULT_GROUP_ID && (
                    <button onClick={handleRemoveSection} className="btn btn-xs btn-circle btn-ghost">
                        <FaTimesCircle className="h-6 w-6 text-red-500" />
                    </button>
                )}

            </div>
        )}
    </Draggable>
}

export default DraggableSection;