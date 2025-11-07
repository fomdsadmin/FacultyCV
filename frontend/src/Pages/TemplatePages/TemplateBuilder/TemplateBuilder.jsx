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

import { useTemplateBuilder } from "./TemplateBuilderContext";
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TemplateBuilderProvider } from "./TemplateBuilderContext";
import SortableGroup from "./Group/SortableGroup";
import SortableTable from "./Table/SortableTable";
import AddGroupModal from "./AddGroupModal";
import AddTableModal from "./AddTableModal";
import {
    buildTree,
    flattenTree,
    getProjection,
    removeItem,
    removeChildrenOf,
    setProperty,
    updateItem,
    findItemDeep,
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

const TemplateBuilderContent = ({
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

    const { sectionsMap } = useTemplateBuilder();

    const [items, setItems] = useState([]);

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

    const handleSetGroup = (id, updates) => {
        setItems((prevItems) => updateItem(prevItems, id, updates));
    };

    const handleSetTable = (id, updates) => {
        setItems((prevItems) => updateItem(prevItems, id, updates));
    };

    const getGroup = (id) => {
        return findItemDeep(items, id);
    };

    const getTable = (id) => {
        return findItemDeep(items, id);
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
            tableSettings: {
            },
            dataSettings: {
                dataSource: Object.keys(sectionsMap)[0],
                filterSettings: {
                    include: {
                        and: []
                    },
                    filterOut: {
                        or: []
                    }
                }
            },
            children: [],
        };

        setItems((prevItems) => [newTable, ...prevItems]);
    };

    return (
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
                    {flattenedItems.map(({ id, children, collapsed, depth, type, name }) => {
                        const itemData = type === "group" ? getGroup(id) : getTable(id);
                        const setter = type === "group" ? handleSetGroup : handleSetTable;

                        return type === "group" ? (
                            <SortableGroup
                                key={id}
                                id={id}
                                depth={id === activeId && projected ? projected.depth : depth}
                                name={name}
                                indentationWidth={indentationWidth}
                                collapsed={Boolean(collapsed && children.length)}
                                onCollapse={
                                    children.length ? () => handleCollapse(id) : undefined
                                }
                                onRemove={() => handleRemove(id)}
                                group={itemData}
                                setGroup={setter}
                            />
                        ) : (
                            <SortableTable
                                key={id}
                                id={id}
                                depth={id === activeId && projected ? projected.depth : depth}
                                indentationWidth={indentationWidth}
                                onRemove={() => handleRemove(id)}
                                table={itemData}
                                setTable={setter}
                            />
                        );
                    })}
                    {createPortal(
                        <DragOverlay dropAnimation={dropAnimationConfig}>
                            {activeId && activeItem ? (
                                activeItem.type === "group" ? (
                                    <SortableGroup
                                        id={activeId}
                                        depth={activeItem.depth}
                                        name={activeItem.name}
                                        indentationWidth={indentationWidth}
                                        collapsed={false}
                                    />
                                ) : (
                                    <SortableTable
                                        id={activeId}
                                        depth={activeItem.depth}
                                        indentationWidth={indentationWidth}
                                        table={activeItem}
                                        setTable={() => { }}
                                    />
                                )
                            ) : null}
                        </DragOverlay>,
                        document.body
                    )}
                </SortableContext>
            </DndContext>
        </div>
    );
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
    return (
        <TemplateBuilderProvider
            title={title}
            setTitle={setTitle}
            onBack={onBack}
            sortAscending={template.sort_ascending}
            setSortAscending={(ascending) => {
                setTemplate((prevTemplate) => ({
                    ...prevTemplate,
                    sort_ascending: ascending,
                }));
            }}
            setCreatedWithRole={setCreatedWithRole}
            createdWithRole={createdWithRole}
            showDeclaration={showDeclaration}
            setShowDeclaration={setShowDeclaration}
            templateId={templateId}
        >
            <TemplateBuilderContent
                template={template}
                setTemplate={setTemplate}
                title={title}
                setTitle={setTitle}
                onBack={onBack}
                templateId={templateId}
                setCreatedWithRole={setCreatedWithRole}
                createdWithRole={createdWithRole}
                showDeclaration={showDeclaration}
                setShowDeclaration={setShowDeclaration}
            />
        </TemplateBuilderProvider>
    );
};

export default TemplateBuilder;
