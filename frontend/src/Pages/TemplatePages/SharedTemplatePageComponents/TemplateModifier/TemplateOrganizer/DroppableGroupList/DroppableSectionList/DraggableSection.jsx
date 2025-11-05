import React from "react";
import { Draggable } from "react-beautiful-dnd"
import { FaGripVertical, FaEdit } from "react-icons/fa"
import DroppableAttributeGroupList from "./DroppableAttributeGroupList/DroppableAttributeGroupList"
import { Accordion } from "SharedComponents/Accordion/Accordion"
import { AccordionItem } from "SharedComponents/Accordion/AccordionItem"
import AddAttributeGroupButton from "./AddAttributeGroupButton/AddAttributeGroupButton"
import RenameSectionButton from "./RenameSectionButton/RenameSectionButton"
import RemoveSectionButton from "./RemoveSectionButton"
import RowCountCheckbox from "./RowCountCheckbox"
import IncludeRowNumberCheckbox from "./IncludeRowNumberCheckbox"
import MergeVisibleAttributesCheckbox from "./MergeVisibleAttributesCheckbox"
import SectionByAttributeButton from "./SectionByAttributeButton/SectionByAttributeButton"
import ModifiedWarningModal from "./ModifiedWarningModal"
import InstructionTextField from "./InstructionTextField"
import AddUnderlinedHeader from "./AddUnderlinedHeader"

const DraggableSection = ({ draggableId, preparedSectionIndex, preparedSection, isInHiddenGroup }) => {
    const [showModal, setShowModal] = React.useState(false);

    return <Draggable
        draggableId={draggableId}
        index={preparedSectionIndex}
    >
        {(provided) => {
            const accordionTitle = (
                <div className="flex justify-between items-start w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded flex-shrink-0"
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
                                {preparedSection.modified && (
                                    <button
                                        className="ml-2 flex items-center gap-1 text-yellow-500 hover:text-yellow-700 focus:outline-none"
                                        title="Show Changes"
                                        onClick={e => { e.stopPropagation(); setShowModal(true); }}
                                        style={{ background: 'none', border: 'none', padding: 0 }}
                                    >
                                        <FaEdit />
                                        <span className="text-xs font-semibold">Modified</span>
                                    </button>
                                )}
                            </h3>
                            <p className="text-sm text-gray-600 break-words">{preparedSection.data_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-4 flex-shrink-0">
                        <AddAttributeGroupButton dataSectionId={preparedSection.data_section_id} dataSectionTitle={preparedSection.title} />
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
                            <InstructionTextField preparedSection={preparedSection} />
                            <AddUnderlinedHeader preparedSection={preparedSection} />
                            <SectionByAttributeButton preparedSection={preparedSection} />
                            <RowCountCheckbox preparedSection={preparedSection} />
                            <IncludeRowNumberCheckbox preparedSection={preparedSection} />
                            <MergeVisibleAttributesCheckbox preparedSection={preparedSection} />
                            <DroppableAttributeGroupList
                                attributeGroups={preparedSection.attribute_groups}
                                dataSectionId={preparedSection.data_section_id}
                                dataSectionTitle={preparedSection.title}
                            />
                        </AccordionItem>
                    </Accordion>
                    <ModifiedWarningModal
                        open={showModal}
                        onClose={() => setShowModal(false)}
                        descriptions={preparedSection.modified_description || []}
                        sectionId={preparedSection.data_section_id}
                        dataSectionTitle={preparedSection.title}
                    />
                </div>
            );
        }}
    </Draggable>
}

export default DraggableSection;