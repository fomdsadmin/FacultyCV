import React, { useState } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import DroppableGroup from "./DroppableGroupList/DroppableGroup";
import { useTemplate } from "../TemplateContext";

export default function TemplateOrganizer() {
  
  const { groups } = useTemplate();

  const onDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "column") {
      const newLists = Array.from(lists);
      const [moved] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, moved);
      setLists(newLists);
    } else {
      const sourceListIndex = lists.findIndex((l) => l.id === source.droppableId);
      const destListIndex = lists.findIndex((l) => l.id === destination.droppableId);
      const sourceList = lists[sourceListIndex];
      const destList = lists[destListIndex];

      const sourceItems = Array.from(sourceList.items);
      const [movedItem] = sourceItems.splice(source.index, 1);

      if (source.droppableId === destination.droppableId) {
        sourceItems.splice(destination.index, 0, movedItem);
        const updatedLists = [...lists];
        updatedLists[sourceListIndex] = { ...sourceList, items: sourceItems };
        setLists(updatedLists);
      } else {
        const destItems = Array.from(destList.items);
        destItems.splice(destination.index, 0, movedItem);
        const updatedLists = [...lists];
        updatedLists[sourceListIndex] = { ...sourceList, items: sourceItems };
        updatedLists[destListIndex] = { ...destList, items: destItems };
        setLists(updatedLists);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <DroppableGroup groups={groups}/>
    </DragDropContext>
  );
}
