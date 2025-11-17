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
import SaveTemplateButton from "./SaveTemplateButton";
import SortButton from "./SortButton";
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

    const { sectionsMap, items, setItems } = useTemplateBuilder();

    const [activeId, setActiveId] = useState(null);
    const [overId, setOverId] = useState(null);
    const [offsetLeft, setOffsetLeft] = useState(0);

    const indentationWidth = 50;

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
            groupSettings: {
                header: "",
                headerWrapperTag: "div"
            },
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
                header: "",
                headerWrapperTag: "div",
                columns: [],
                hideColumns: false
            },
            dataSettings: {
                dataSource: Object.keys(sectionsMap)[0],
                skipDateFilter: false,
                sqlSettings: {
                    query: "SELECT * FROM ?",
                    columnTextTemplate: {
                        html: "",
                        selected: false
                    },
                    sqlViewTemplate: {
                        selected: false,
                        showHeaders: true,
                        grayFirstColumn: false
                    }
                }
            },
            children: [],
        };

        setItems((prevItems) => [newTable, ...prevItems]);
    };
    return (
        <div style={{ width: "100%", margin: "0 auto", padding: 16 }}>
            {/* Header Section */}
            <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Template Title
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter template title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                </div>

                {/* Show Declaration Checkbox */}
                <div className="mb-4 flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="showDeclaration"
                        checked={showDeclaration}
                        onChange={(e) => setShowDeclaration(e.target.checked)}
                        className="w-4 h-4 border border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="showDeclaration" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Show Declaration
                    </label>
                </div>

                <div className="flex justify-end gap-3">
                    <SortButton />
                    <SaveTemplateButton
                        templateId={templateId}
                        onBack={onBack}
                    />
                </div>
            </div>

            {/* Instructions */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">How to use Template Builder</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Add groups to organize sections by category</li>
                    <li>• Add tables to display data from your CV sections</li>
                    <li>• Drag and drop to reorder items</li>
                    <li>• Configure table settings, filters, and column displays</li>
                </ul>
            </div>

            {/* Add Items Section */}
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
    sortAscending,
    setSortAscending,
}) => {
    const [items, setItems] = useState([]);

    // Initialize items from template once
    useEffect(() => {
        if (template && template.templateBuilder && template.templateBuilder.items) {
            setItems(template.templateBuilder.items);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateId]);

    return (
        <TemplateBuilderProvider
            title={title}
            setTitle={setTitle}
            onBack={onBack}
            sortAscending={sortAscending}
            setSortAscending={setSortAscending}
            setCreatedWithRole={setCreatedWithRole}
            createdWithRole={createdWithRole}
            showDeclaration={showDeclaration}
            setShowDeclaration={setShowDeclaration}
            templateId={templateId}
            items={items}
            setItems={setItems}
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
