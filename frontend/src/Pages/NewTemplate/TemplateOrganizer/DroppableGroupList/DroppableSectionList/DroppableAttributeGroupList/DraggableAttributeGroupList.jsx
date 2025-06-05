import { useTemplate } from "Pages/NewTemplate/TemplateContext";
import { Draggable } from "react-beautiful-dnd"

const DraggableAttributeGroupList = ({ attributeGroup, attributeGroupIndex, draggableId}) => {

    const { HIDDEN_GROUP_ID } = useTemplate();


    return (
        <Draggable
            draggableId={draggableId}
            index={attributeGroupIndex}
            isDragDisabled={false}>
            {(provided) => (
                <div
                    className="mb-2 p-2 border rounded flex flex-row justify-between items-start shadow-glow"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                >
                    <div className="flex items-center justify-between justify-center w-full pl-3 pr-4 pt-3">
                        <h2 className="font-bold mb-2" {...provided.dragHandleProps}>
                            {attributeGroup.title}
                        </h2>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

export default DraggableAttributeGroupList;