import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
  defaultDropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  buildTree,
  flattenTree,
  getProjection,
  removeChildrenOf,
  setProperty,
  findItemDeep,
} from "../../utilities";
import SortableAttribute from "./Attribute/SortableAttribute";
import SortableAttributeGroup from "./AttributeGroup/SortableAttributeGroup";
import AddAttributeModal from "./AddAttributeModal";
import AddAttributeGroupModal from "./AddAttributeGroupModal";

const measuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

const dropAnimationConfig = {
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      {
        opacity: 0,
        transform: CSS.Transform.toString({
          ...transform.final,
          x: transform.final.x + 5,
          y: transform.final.y + 5,
        }),
      },
    ];
  },
  easing: "ease-out",
  sideEffects({ active }) {
    active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: defaultDropAnimation.duration,
      easing: defaultDropAnimation.easing,
    });
  },
};

// Drag Overlay Item Component
const DragOverlayItem = ({
  type,
  originalName,
  rename,
}) => {
  if (type === "attribute_group") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          backgroundColor: "#f5f5f5",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <span style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>
          📁 {originalName}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        backgroundColor: "#fafafa",
        border: "1px solid #e0e0e0",
        borderRadius: 4,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <span style={{ fontSize: 13, color: "#333", fontWeight: 400 }}>
        📊 {originalName}
      </span>
    </div>
  );
};


// Main ColumnBuilder Component
const ColumnBuilder = ({ dataSource, tableSettings, setTable }) => {
  // Initialize data - minimal reproducible example
  const [attributeItems, setAttributeItems] = useState(() => {
    if (tableSettings?.columns && tableSettings.columns.length > 0) {
      return tableSettings.columns;
    }

    // Minimal example with both attribute and attribute_group types
    return [
      {
        id: "attr-1",
        type: "attribute",
        originalName: "Dates",
        rename: "",
        settings: { key: "dates" },
        children: [],
      },
      {
        id: "group-1",
        type: "attribute_group",
        originalName: "Academic Info",
        rename: "",
        settings: {},
        children: [
          {
            id: "attr-2",
            type: "attribute",
            originalName: "University/Organization",
            rename: "",
            settings: { key: "university" },
            children: [],
          },
        ],
      },
      {
        id: "attr-3",
        type: "attribute",
        originalName: "Department",
        rename: "",
        settings: { key: "department" },
        children: [],
      },
    ];
  });

  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const indentationWidth = 50;

  const sensorContext = useRef({
    items: [],
    offset: 0,
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(attributeItems);
    const collapsedItems = flattenedTree.reduce((acc, { children, collapsed, id }) =>
      collapsed && children.length ? [...acc, id] : acc,
      []
    );
    return removeChildrenOf(
      flattenedTree,
      activeId != null ? [activeId, ...collapsedItems] : collapsedItems
    );
  }, [activeId, attributeItems]);

  const projected =
    activeId && overId
      ? getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth)
      : null;

  const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [flattenedItems]);

  const activeItem = activeId
    ? flattenedItems.find(({ id }) => id === activeId)
    : null;

  useEffect(() => {
    sensorContext.current = {
      items: flattenedItems,
      offset: offsetLeft,
    };
  }, [flattenedItems, offsetLeft]);

  useEffect(() => {
    setTable((prev) => ({
      ...prev,
      tableSettings: {
        ...prev.tableSettings,
        columns: attributeItems,
      },
    }));
  }, [attributeItems, setTable]);

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
    setOverId(active.id);
    document.body.style.setProperty("cursor", "grabbing");
  };

  const handleDragMove = ({ delta }) => {
    setOffsetLeft(delta.x);
  };

  const handleDragOver = ({ over }) => {
    setOverId(over?.id ?? null);
  };

  const handleDragEnd = ({ active, over }) => {
    resetState();

    if (projected && over) {
      const { depth, parentId } = projected;
      const clonedItems = JSON.parse(JSON.stringify(flattenTree(attributeItems)));
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = clonedItems[activeIndex];

      clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId };

      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      const newItems = buildTree(sortedItems);

      setAttributeItems(newItems);
    }
  };

  const handleDragCancel = () => {
    resetState();
  };

  const resetState = () => {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);
    document.body.style.setProperty("cursor", "");
  };

  const handleCollapse = (id) => {
    setAttributeItems((items) =>
      setProperty(items, id, "collapsed", (value) => !value)
    );
  };

  const handleRemove = (id) => {
    setAttributeItems((items) => {
      const removeRecursive = (nodeList) => {
        return nodeList.filter((item) => {
          if (item.id === id) {
            return false;
          }
          if (item.children.length) {
            item.children = removeRecursive(item.children);
          }
          return true;
        });
      };
      return removeRecursive(items);
    });
  };

  const handleAddAttribute = (name) => {
    const newAttribute = {
      id: crypto.randomUUID(),
      type: "attribute",
      originalName: name,
      rename: "",
      settings: { key: name.toLowerCase().replace(/\s+/g, "_") },
      children: [],
    };

    setAttributeItems((prevItems) => [newAttribute, ...prevItems]);
  };

  const handleAddAttributeGroup = (name) => {
    const newGroup = {
      id: crypto.randomUUID(),
      type: "attribute_group",
      originalName: name,
      rename: "",
      settings: {},
      children: [],
    };

    setAttributeItems((prevItems) => [newGroup, ...prevItems]);
  };

  if (!dataSource) {
    return (
      <div style={{ color: "#999", fontSize: 12, padding: "8px 0" }}>
        No data source selected
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16, padding: "12px", backgroundColor: "#f9f9f9", borderRadius: 6 }}>
      <div style={{ marginBottom: 16 }}>
        <strong style={{ fontSize: 13, color: "#333" }}>Columns for {dataSource}</strong>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <AddAttributeGroupModal onAdd={handleAddAttributeGroup} />
        <AddAttributeModal onAdd={handleAddAttribute} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        measuring={measuring}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
          {flattenedItems.map(({ id, children, collapsed, depth, type, originalName, rename }) => {
            const itemData = findItemDeep(attributeItems, id);
            
            return type === "attribute" ? (
              <SortableAttribute
                key={id}
                id={id}
                depth={id === activeId && projected ? projected.depth : depth}
                originalName={originalName}
                rename={rename}
                indentationWidth={indentationWidth}
                onRemove={() => handleRemove(id)}
                attribute={itemData}
                setAttribute={(updates) => {
                  // Handle attribute settings updates
                }}
              />
            ) : (
              <SortableAttributeGroup
                key={id}
                id={id}
                depth={id === activeId && projected ? projected.depth : depth}
                originalName={originalName}
                rename={rename}
                indentationWidth={indentationWidth}
                collapsed={Boolean(collapsed && children.length)}
                onCollapse={children.length ? () => handleCollapse(id) : undefined}
                onRemove={() => handleRemove(id)}
                attributeGroup={itemData}
                setAttributeGroup={(updates) => {
                  // Handle attribute group settings updates
                }}
              />
            );
          })}

          {createPortal(
            <DragOverlay dropAnimation={dropAnimationConfig}>
              {activeId && activeItem ? (
                <DragOverlayItem
                  type={activeItem.type}
                  originalName={activeItem.originalName}
                  rename={activeItem.rename}
                />
              ) : null}
            </DragOverlay>,
            document.body
          )}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default ColumnBuilder;