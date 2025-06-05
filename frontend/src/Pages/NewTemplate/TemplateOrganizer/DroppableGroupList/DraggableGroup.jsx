import { Draggable } from "react-beautiful-dnd"
import DroppableSectionList from "../DroppableSectionList/DroppableSectionList"
import { useTemplate } from "../../TemplateContext";
import { FaTimesCircle } from "react-icons/fa";

const DraggableGroup = ({ group, groupIndex }) => {

    const { DEFAULT_GROUP_ID, groups, setGroups } = useTemplate();

    const onRemoveGroup = () => {

        var updatedGroups = [...groups];

        const indexOfDefaultGroupToModify = groups.findIndex((group) => group.id === DEFAULT_GROUP_ID);
        const indexOfCurrentGroupToDelete = groups.findIndex((grp) => grp.id === group.id);
        const defaultGroup = groups[indexOfDefaultGroupToModify];
        const updatedDefaultGroupSections = [...groups[indexOfCurrentGroupToDelete].sections, ...defaultGroup.sections];
        updatedGroups[indexOfDefaultGroupToModify] = {
            ...defaultGroup,
            sections: updatedDefaultGroupSections
        };

        updatedGroups = updatedGroups.filter((grp) => grp.id !== group.id);

        setGroups(updatedGroups);
    }

    return <Draggable draggableId={group.id} index={groupIndex}>
        {(provided) => (
            <div
                className="mb-2 p-2 border rounded flex flex-col justify-between items-start shadow-glow"
                ref={provided.innerRef}
                {...provided.draggableProps}
            >
                <div className="flex items-center justify-between justify-center w-full pl-3 pr-4 pt-3">
                    <h2 className="font-bold mb-2" {...provided.dragHandleProps}>
                        {group.title}
                    </h2>
                    {group.id !== DEFAULT_GROUP_ID && (
                        <button onClick={onRemoveGroup} className="btn btn-xs btn-circle btn-ghost">
                            <FaTimesCircle className="h-6 w-6 text-red-500" />
                        </button>
                    )}
                </div>
                <DroppableSectionList group={group}></DroppableSectionList>
            </div>
        )}
    </Draggable>
}

export default DraggableGroup;