import { Draggable } from "react-beautiful-dnd"
import { FaGripVertical } from "react-icons/fa"
import DroppableAttributeGroupList from "./DroppableAttributeGroupList/DroppableAttributeGroupList"
import { Accordion } from "SharedComponents/Accordion/Accordion"
import { AccordionItem } from "SharedComponents/Accordion/AccordionItem"
import AddAttributeGroupButton from "./AddAttributeGroupButton/AddAttributeGroupButton"
import RemoveSectionButton from "./RemoveSectionButton"
import SortingButton from "./SortingButton/SortingButton"
import RowCountCheckbox from "./RowCountCheckbox"

const DraggableSection = ({ draggableId, preparedSectionIndex, preparedSection, isInHiddenGroup }) => {

    return <Draggable
        draggableId={draggableId}
        index={preparedSectionIndex}
    >
        {(provided) => {
            const accordionTitle = (
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                        <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
                        >
                            <FaGripVertical className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{preparedSection.title}</h3>
                            <p className="text-sm text-gray-600">{preparedSection.data_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pr-4">
                        <AddAttributeGroupButton dataSectionId={preparedSection.data_section_id} />
                        <RemoveSectionButton preparedSection={preparedSection} />
                    </div>
                </div>
            );

            return (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="mb-2 border rounded shadow-glow w-full"
                >
                    <Accordion>
                        <AccordionItem title={accordionTitle} hideIsOpenIcon={true && !isInHiddenGroup}>
                            <SortingButton preparedSection={preparedSection}/>
                            <RowCountCheckbox preparedSection={preparedSection} />
                            <DroppableAttributeGroupList
                                attributeGroups={preparedSection.attribute_groups}
                                dataSectionId={preparedSection.data_section_id}
                            />
                        </AccordionItem>
                    </Accordion>
                </div>
            );
        }}
    </Draggable>
}

export default DraggableSection;