import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AccordionItem } from "SharedComponents/Accordion/AccordionItem";
import { FaGripVertical, FaTrash } from "react-icons/fa";
import Attribute from "./Attribute";

const SortableAttribute = ({
  id,
  depth,
  originalName,
  rename,
  indentationWidth,
  onRemove,
  attribute,
  setAttribute,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, animateLayoutChanges: () => false });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginLeft: depth * indentationWidth,
    marginBottom: 8,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: isDragging ? "#e3f2fd" : "#fff",
        border: `1px solid ${isDragging ? "#2196F3" : "#ddd"}`,
        borderRadius: 4,
      }}
      {...attributes}
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
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
            >
              <FaGripVertical className="h-4 w-4 text-gray-500" />
            </div>

            <span style={{ fontSize: 13, color: "#333", fontWeight: 400 }}>
              📊 {originalName}
            </span>

            {rename && (
              <span style={{ fontSize: 11, color: "#999", marginLeft: "auto", fontStyle: "italic" }}>
                → {rename}
              </span>
            )}

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
          {/* Attribute settings go here */}
          <Attribute/>
        </div>
      </AccordionItem>
    </div>
  );
};

export default SortableAttribute;
