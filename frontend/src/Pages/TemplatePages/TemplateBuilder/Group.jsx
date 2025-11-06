import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { AccordionItem } from "SharedComponents/Accordion/AccordionItem";
import { FaGripVertical } from "react-icons/fa";

const Group = ({ group, index, onRenderList }) => {
  return (
    <Draggable draggableId={group.id} index={index} key={group.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            marginBottom: 8,
            background: snapshot.isDragging ? "#e3f2fd" : "#fff",
            border: `1px solid ${snapshot.isDragging ? "#2196F3" : "#ddd"}`,
            borderRadius: 4,
            ...provided.draggableProps.style,
          }}
        >
          <AccordionItem
            title={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  {...provided.dragHandleProps}
                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
                >
                  <FaGripVertical className="h-4 w-4 text-gray-500" />
                </div>
                <strong>{group.name}</strong>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#666" }}>📁</span>
              </div>
            }
          >
            {onRenderList(group.children || [], group.id)}
          </AccordionItem>
        </div>
      )}
    </Draggable>
  );
};

export default Group;
