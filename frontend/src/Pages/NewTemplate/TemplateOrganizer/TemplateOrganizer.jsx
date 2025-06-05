import React, { useState } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import DroppableGroup from "./DroppableGroupList/DroppableGroup";
import { useTemplate } from "../TemplateContext";

export default function TemplateOrganizer() {

  const { groups, setGroups, HIDDEN_GROUP_ID } = useTemplate();

  const onDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    // Find the default group index
    const hiddenGroupIndex = groups.findIndex(group => group.id === HIDDEN_GROUP_ID);

    // If default group is not at the bottom of the page, don't allow any group reordering (makes no sense to allow default group to be reordered)
    console.log(result)
    if (destination.index >= hiddenGroupIndex && result.source.droppableId === "all-groups") {
      return;
    }

    if (type === "column") {
      const newGroups = Array.from(groups);
      const [moved] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, moved);
      setGroups(newGroups);
    } else {
      const sourceGroupIndex = groups.findIndex((l) => l.id === source.droppableId);
      const destGroupIndex = groups.findIndex((l) => l.id === destination.droppableId);
      const sourceGroup = groups[sourceGroupIndex];
      const destGroup = groups[destGroupIndex];

      const sourcePreparedSections = Array.from(sourceGroup.prepared_sections);
      const [movedPreparedSection] = sourcePreparedSections.splice(source.index, 1);

      if (source.droppableId === destination.droppableId) {
        sourcePreparedSections.splice(destination.index, 0, movedPreparedSection);
        const updatedLists = [...groups];
        updatedLists[sourceGroupIndex] = { ...sourceGroup, prepared_sections: sourcePreparedSections };
        setGroups(updatedLists);
      } else {
        const destPreparedSections = Array.from(destGroup.prepared_sections);
        destPreparedSections.splice(destination.index, 0, movedPreparedSection);
        const updatedGroups = [...groups];
        updatedGroups[sourceGroupIndex] = { ...sourceGroup, prepared_sections: sourcePreparedSections };
        updatedGroups[destGroupIndex] = { ...destGroup, prepared_sections: destPreparedSections };
        setGroups(updatedGroups);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <DroppableGroup groups={groups} />
    </DragDropContext>
  );
}
