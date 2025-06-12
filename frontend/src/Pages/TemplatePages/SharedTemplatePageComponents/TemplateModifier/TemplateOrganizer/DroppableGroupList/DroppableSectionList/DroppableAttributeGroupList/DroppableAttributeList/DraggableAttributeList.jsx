import { Draggable } from "react-beautiful-dnd";
import { FaGripVertical } from "react-icons/fa";
import RenameAttributeButton from "./RenameAttributeButton/RenameAttributeButton";
import { useSectionData } from "Pages/TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateOrganizer/hooks/useSectionData";
import { useEffect, useState } from "react";
import { useTemplateModifier } from "Pages/TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";

const DraggableAttributeList = ({ draggableId, attributeIndex, attribute, dataSectionId }) => {

    const [alternativeName, setAlternativeName] = useState(null);

    const { groups } = useTemplateModifier();
    const { groupId } = useSectionData(dataSectionId);

    // Get current renamed value from attribute_rename_map
    useEffect(() => {
        const targetGroup = groups.find(group => group.id === groupId);
        const targetSection = targetGroup?.prepared_sections?.find(
            section => section.data_section_id === dataSectionId
        );

        const currentRename = targetSection?.attribute_rename_map?.[attribute];
        setAlternativeName(currentRename || null);
    }, [attribute, dataSectionId, groups, groupId]);

    return (
        <Draggable
            draggableId={draggableId}
            index={attributeIndex}
            isDragDisabled={false}>
            {(provided) => (
                <div
                    className="mb-1 px-2 py-1 border rounded flex items-center shadow-sm hover:bg-gray-50 transition-colors"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                >
                    <div
                        {...provided.dragHandleProps}
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded mr-2"
                    >
                        <FaGripVertical className="h-3 w-3 text-gray-500" />
                    </div>
                    <RenameAttributeButton
                        attribute={attribute}
                        dataSectionId={dataSectionId}
                    />
                    <span className="text-ms font-medium text-gray-700 flex-1 flex items-center gap-2">
                        {attribute}
                        {alternativeName && (
                            <span className="text-sm text-gray-600">
                                → <span className="font-mono bg-gray-100 px-2 py-1 rounded">{alternativeName}</span>
                            </span>
                        )}  
                    </span>
                </div>
            )}
        </Draggable>
    );
}

export default DraggableAttributeList;