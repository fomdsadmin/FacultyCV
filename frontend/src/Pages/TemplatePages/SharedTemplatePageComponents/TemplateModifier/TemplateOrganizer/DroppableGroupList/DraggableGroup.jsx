import { Draggable } from "react-beautiful-dnd"
import { FaTimesCircle, FaGripVertical } from "react-icons/fa";
import DroppableSectionList from "./DroppableSectionList/DroppableSectionList";
import { Accordion } from "SharedComponents/Accordion/Accordion"
import { AccordionItem } from "SharedComponents/Accordion/AccordionItem"
import { useTemplateModifier } from "../../TemplateModifierContext";
import React, { useState } from "react";

const DraggableGroup = ({ group, groupIndex }) => {

    const { HIDDEN_GROUP_ID, groups, setGroups } = useTemplateModifier();
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [newGroupTitle, setNewGroupTitle] = useState(group.title);

    const onRemoveGroup = () => {
        var updatedGroups = [...groups];

        const indexOfDefaultGroupToModify = groups.findIndex((group) => group.id === HIDDEN_GROUP_ID);
        const indexOfCurrentGroupToDelete = groups.findIndex((grp) => grp.id === group.id);
        const defaultGroup = groups[indexOfDefaultGroupToModify];
        const updatedDefaultGroupPreparedSections = [...groups[indexOfCurrentGroupToDelete].prepared_sections, ...defaultGroup.prepared_sections];
        updatedGroups[indexOfDefaultGroupToModify] = {
            ...defaultGroup,
            prepared_sections: updatedDefaultGroupPreparedSections
        };

        updatedGroups = updatedGroups.filter((grp) => grp.id !== group.id);

        setGroups(updatedGroups);
    }

    const handleRenameGroup = () => {
        const updatedGroups = groups.map(g =>
            g.id === group.id ? { ...g, title: newGroupTitle } : g
        );
        setGroups(updatedGroups);
        setShowRenameModal(false);
    };

    const isHiddenGroup = group.id === HIDDEN_GROUP_ID

    return (
        <Draggable
            draggableId={group.id}
            index={groupIndex}
            isDragDisabled={isHiddenGroup}>
            {(provided) => {
                const accordionTitle = (
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                            {!isHiddenGroup && (
                                <div 
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
                                >
                                    <FaGripVertical className="h-4 w-4 text-gray-500" />
                                </div>
                            )}
                            <h2 className="font-bold text-lg">{group.title}</h2>
                            {!isHiddenGroup && (
                                <button
                                    className="ml-2 px-2 py-1 text-blue-500 hover:text-blue-700 border border-blue-300 rounded text-xs"
                                    onClick={e => { e.stopPropagation(); setShowRenameModal(true); }}
                                    title="Rename Group"
                                >
                                    Rename
                                </button>
                            )}
                        </div>
                        {group.id !== HIDDEN_GROUP_ID && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveGroup();
                                }} 
                                className="btn btn-xs btn-circle btn-ghost"
                            >
                                <FaTimesCircle className="h-6 w-6 text-red-500" />
                            </button>
                        )}
                    </div>
                );

                return (
                    <div
                        className="mb-2 border rounded shadow-glow"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                    >
                        <Accordion>
                            <AccordionItem title={accordionTitle} hideIsOpenIcon={true && !isHiddenGroup}>
                                <DroppableSectionList group={group} isInHiddenGroup={isHiddenGroup} />
                            </AccordionItem>
                        </Accordion>
                        {showRenameModal && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                                <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
                                    <h3 className="text-lg font-semibold mb-2">Rename Group</h3>
                                    <input
                                        type="text"
                                        className="border rounded px-2 py-1 w-full mb-4"
                                        value={newGroupTitle}
                                        onChange={e => setNewGroupTitle(e.target.value)}
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            className="px-3 py-1 bg-blue-500 text-white rounded"
                                            onClick={handleRenameGroup}
                                        >
                                            Save
                                        </button>
                                        <button
                                            className="px-3 py-1 bg-gray-300 rounded"
                                            onClick={() => setShowRenameModal(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }}
        </Draggable>
    );
}

export default DraggableGroup;