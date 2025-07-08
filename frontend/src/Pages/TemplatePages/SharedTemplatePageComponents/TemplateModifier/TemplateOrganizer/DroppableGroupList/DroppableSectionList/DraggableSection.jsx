import { Draggable } from "react-beautiful-dnd"
import { FaGripVertical } from "react-icons/fa"
import DroppableAttributeGroupList from "./DroppableAttributeGroupList/DroppableAttributeGroupList"
import { Accordion } from "SharedComponents/Accordion/Accordion"
import { AccordionItem } from "SharedComponents/Accordion/AccordionItem"
import AddAttributeGroupButton from "./AddAttributeGroupButton/AddAttributeGroupButton"
import SortingButton from "./SortingButton/SortingButton"
import RenameSectionButton from "./RenameSectionButton/RenameSectionButton"
import RemoveSectionButton from "./RemoveSectionButton"
import RowCountCheckbox from "./RowCountCheckbox"
import IncludeRowNumberCheckbox from "./IncludeRowNumberCheckbox"
import MergeVisibleAttributesCheckbox from "./MergeVisibleAttributesCheckbox"
import SectionByAttributeButton from "./SectionByAttributeButton/SectionByAttributeButton"

const DraggableSection = ({ draggableId, preparedSectionIndex, preparedSection, isInHiddenGroup }) => {

    return <Draggable
        draggableId={draggableId}
        index={preparedSectionIndex}
    >
        {(provided) => {
            const accordionTitle = (
                <div className="flex justify-between items-start w-full"> {/* Changed from items-center to items-start */}
                    <div className="flex items-center gap-2 flex-1 min-w-0"> {/* Added flex-1 min-w-0 */}
                        <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded flex-shrink-0" // Added flex-shrink-0
                        >
                            <FaGripVertical className="h-4 w-4 text-gray-500" />
                        </div>
                        <RenameSectionButton preparedSection={preparedSection} />
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold flex items-start gap-2 flex-wrap">
                                <span className="break-words">{preparedSection.title}</span>
                                {preparedSection.renamed_section_title && (
                                    <span className="text-sm text-gray-600 flex items-center gap-1 flex-shrink-0">
                                        → <span className="font-mono bg-gray-100 px-2 py-1 rounded break-words">
                                            {preparedSection.renamed_section_title}
                                        </span>
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-gray-600 break-words">{preparedSection.data_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-4 flex-shrink-0"> {/* Changed pr-4 to pl-4 and added flex-shrink-0 */}
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
                            {/**<SortingButton preparedSection={preparedSection} /> */}
                            <SectionByAttributeButton preparedSection={preparedSection} />
                            <RowCountCheckbox preparedSection={preparedSection} />
                            <IncludeRowNumberCheckbox preparedSection={preparedSection} />
                            <MergeVisibleAttributesCheckbox preparedSection={preparedSection} />
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