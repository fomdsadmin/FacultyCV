import React, { useState } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import DroppableGroup from "./DroppableGroupList/DroppableGroup";
import { useTemplate } from "../TemplateContext";

export default function TemplateOrganizer() {
  
  const { groups, setGroups } = useTemplate();

  const onDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "column") {
      const newGroups = Array.from(groups);
      const [moved] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, moved);
      setGroups(newGroups);
    } else {
      const sourceGroupIndex = groups.findIndex((l) => l.id === source.droppableId);
      const destGroupIndex = groups.findIndex((l) => l.id === destination.droppableId);
      const sourceList = groups[sourceGroupIndex];
      const destList = groups[destGroupIndex];

      const sourceSections = Array.from(sourceList.sections);
      const [movedSection] = sourceSections.splice(source.index, 1);

      if (source.droppableId === destination.droppableId) {
        sourceSections.splice(destination.index, 0, movedSection);
        const updatedLists = [...groups];
        updatedLists[sourceGroupIndex] = { ...sourceList, sections: sourceSections };
        setGroups(updatedLists);
      } else {
        const destSections = Array.from(destList.sections);
        destSections.splice(destination.index, 0, movedSection);
        const updatedLists = [...groups];
        updatedLists[sourceGroupIndex] = { ...sourceList, sections: sourceSections };
        updatedLists[destGroupIndex] = { ...destList, sections: destSections };
        setGroups(updatedLists);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <DroppableGroup groups={groups}/>
    </DragDropContext>
  );
}
