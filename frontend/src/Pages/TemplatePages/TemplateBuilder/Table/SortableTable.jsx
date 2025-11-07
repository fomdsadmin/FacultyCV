import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AccordionItem } from "SharedComponents/Accordion/AccordionItem";
import {
  FaGripVertical,
  FaTrash,
} from "react-icons/fa";
import Table from "./Table";

const SortableTable = ({
  id,
  depth,
  onRemove,
  indentationWidth,
  table,
  setTable,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        marginBottom: 8,
        marginLeft: depth * indentationWidth,
        background: isDragging ? "#e3f2fd" : "#fff",
        border: `1px solid ${isDragging ? "#2196F3" : "#ddd"}`,
        borderRadius: 4,
      }}
      {...attributes}
    >
      <AccordionItem
        isCollapsed={isDragging}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
            >
              <FaGripVertical className="h-4 w-4 text-gray-500" />
            </div>

            <strong>{table?.name}</strong>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#666" }}>
              📊
            </span>

            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                className="text-red-500 hover:bg-red-100 rounded"
              >
                <FaTrash className="h-3 w-3" />
              </button>
            )}
          </div>
        }
      >
        <div style={{ padding: "12px" }}>
          <Table table={table} setTable={setTable} />
        </div>
      </AccordionItem>
    </div>
  );
};

export default SortableTable;
