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
import { TemplateBuilderProvider } from "./TemplateBuilderContext";
import SortableItem from "./SortableItem";
import AddGroupModal from "./AddGroupModal";
import AddTableModal from "./AddTableModal";
import {
  buildTree,
  flattenTree,
  getProjection,
  removeItem,
  removeChildrenOf,
  setProperty,
} from "./utilities";

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

const TemplateBuilder = ({
  template,
  setTemplate,
  title,
  setTitle,
  onBack,
  templateId,
  setCreatedWithRole,
  createdWithRole,
  showDeclaration,
  setShowDeclaration,
}) => {
  const [items, setItems] = useState([
    { id: "g1", type: "group", name: "Group 1", children: [] },
    { id: "g2", type: "group", name: "Group 2", children: [] },
    { id: "t1", type: "table", name: "Table 1", children: [] },
    { id: "t2", type: "table", name: "Table 2", children: [] },
  ]);

  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const indentationWidth = 50;

  const setSortAscending = (ascending) => {
    setTemplate((prevTemplate) => ({
      ...prevTemplate,
      sort_ascending: ascending,
    }));
  };

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);
    const collapsedItems = flattenedTree.reduce((acc, { children, collapsed, id }) =>
      collapsed && children.length ? [...acc, id] : acc,
      []
    );

    return removeChildrenOf(
      flattenedTree,
      activeId != null ? [activeId, ...collapsedItems] : collapsedItems
    );
  }, [activeId, items]);

  const projected =
    activeId && overId
      ? getProjection(
          flattenedItems,
          activeId,
          overId,
          offsetLeft,
          indentationWidth
        )
      : null;

  const sensorContext = useRef({
    items: flattenedItems,
    offset: offsetLeft,
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [
    flattenedItems,
  ]);

  const activeItem = activeId
    ? flattenedItems.find(({ id }) => id === activeId)
    : null;

  useEffect(() => {
    sensorContext.current = {
      items: flattenedItems,
      offset: offsetLeft,
    };
  }, [flattenedItems, offsetLeft]);

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
      const clonedItems = JSON.parse(
        JSON.stringify(flattenTree(items))
      );
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = clonedItems[activeIndex];

      clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId };

      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      const newItems = buildTree(sortedItems);

      setItems(newItems);
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

  const handleRemove = (id) => {
    setItems((items) => removeItem(items, id));
  };

  const handleCollapse = (id) => {
    setItems((items) =>
      setProperty(items, id, "collapsed", (value) => {
        return !value;
      })
    );
  };

  const handleAddGroup = (name) => {
    const newGroup = {
      id: crypto.randomUUID(),
      type: "group",
      name,
      children: [],
    };

    setItems((prevItems) => [newGroup, ...prevItems]);
  };

  const handleAddTable = (name) => {
    const newTable = {
      id: crypto.randomUUID(),
      type: "table",
      name,
      children: [],
    };

    setItems((prevItems) => [newTable, ...prevItems]);
  };

  return (
    <TemplateBuilderProvider
      title={title}
      setTitle={setTitle}
      onBack={onBack}
      sortAscending={template.sort_ascending}
      setSortAscending={setSortAscending}
      setCreatedWithRole={setCreatedWithRole}
      createdWithRole={createdWithRole}
      showDeclaration={showDeclaration}
      setShowDeclaration={setShowDeclaration}
      templateId={templateId}
    >
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
        <h3>Template Builder</h3>
        
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <AddGroupModal onAdd={handleAddGroup} />
          <AddTableModal onAdd={handleAddTable} />
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
          <SortableContext
            items={sortedIds}
            strategy={verticalListSortingStrategy}
          >
            {flattenedItems.map(({ id, children, collapsed, depth, type, name }) => (
              <SortableItem
                key={id}
                id={id}
                value={id}
                depth={id === activeId && projected ? projected.depth : depth}
                type={type}
                name={name}
                indentationWidth={indentationWidth}
                collapsed={Boolean(collapsed && children.length)}
                onCollapse={
                  children.length ? () => handleCollapse(id) : undefined
                }
                onRemove={() => handleRemove(id)}
              />
            ))}
            {createPortal(
              <DragOverlay dropAnimation={dropAnimationConfig}>
                {activeId && activeItem ? (
                  <SortableItem
                    id={activeId}
                    depth={activeItem.depth}
                    clone
                    value={activeId}
                    type={activeItem.type}
                    name={activeItem.name}
                    indentationWidth={indentationWidth}
                  />
                ) : null}
              </DragOverlay>,
              document.body
            )}
          </SortableContext>
        </DndContext>
      </div>
    </TemplateBuilderProvider>
  );
};

export default TemplateBuilder;
