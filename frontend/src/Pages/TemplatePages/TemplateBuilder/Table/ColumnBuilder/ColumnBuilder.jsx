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
import { useTemplateBuilder } from "../../TemplateBuilderContext";
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
import { buildAttributeObject } from "../../TemplateBuilderContext";

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
    name,
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
                    📁 {name}
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
    const { sectionsMap } = useTemplateBuilder();

    // Initialize data from datasource attributes
    const [attributeItems, setAttributeItems] = useState(() => {
        if (tableSettings?.columns && tableSettings.columns.length > 0) {
            return tableSettings.columns;
        }

        // Get attributes from the selected dataSource
        const section = dataSource && sectionsMap ? sectionsMap[dataSource] : null;
        if (section && section.attributes) {
            return section.attributes;
        }

        // Fallback to empty array if no datasource selected
        return [];
    });

    // Update attributes when dataSource changes, but preserve saved columns
    useEffect(() => {
        // Only update if we don't have saved columns
        if (!tableSettings?.columns || tableSettings.columns.length === 0) {
            const section = dataSource && sectionsMap ? sectionsMap[dataSource] : null;
            if (section && section.attributes) {
                setAttributeItems(section.attributes);
            } else {
                setAttributeItems([]);
            }
        }
    }, [dataSource, sectionsMap, tableSettings?.columns]);

    const [activeId, setActiveId] = useState(null);
    const [overId, setOverId] = useState(null);
    const [offsetLeft, setOffsetLeft] = useState(0);
    const [hideColumns, setHideColumns] = useState(false);

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
                hideColumns: hideColumns,
            },
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attributeItems, hideColumns]);

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

    const handleSetAttribute = (id, updates) => {
        setAttributeItems((items) => {
            const updateRecursive = (nodeList) => {
                return nodeList.map((item) => {
                    if (item.id === id) {
                        // For footnoteSettings, we need to deeply merge to preserve all properties
                        if (updates.footnoteSettings) {
                            return {
                                ...item,
                                ...updates,
                                footnoteSettings: {
                                    ...(item.footnoteSettings || {}),
                                    ...updates.footnoteSettings,
                                },
                            };
                        }
                        return { ...item, ...updates };
                    }
                    if (item.children.length) {
                        return {
                            ...item,
                            children: updateRecursive(item.children),
                        };
                    }
                    return item;
                });
            };
            return updateRecursive(items);
        });
    };

    const handleAddAttribute = (attributeName, attributeKey) => {
        const newAttribute = buildAttributeObject(attributeName, attributeKey);

        setAttributeItems((prevItems) => [newAttribute, ...prevItems]);
    };

    const handleAddAttributeGroup = (name) => {
        const newGroup = {
            id: crypto.randomUUID(),
            type: "attribute_group",
            name: name,
            settings: {
                merge: false
            },
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
        <div style={{ marginTop: 16, marginBottom: 16, padding: "12px", backgroundColor: "#f9f9f9", borderRadius: 6 }}>
            <div style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: 13, color: "#333" }}>Columns for {dataSource}</strong>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <AddAttributeGroupModal onAdd={handleAddAttributeGroup} />
                <AddAttributeModal
                    onAdd={handleAddAttribute}
                    dataSource={dataSource}
                    attributeItems={attributeItems}
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={hideColumns}
                        onChange={(e) => setHideColumns(e.target.checked)}
                        style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 13, color: "#333" }}>Hide Columns</span>
                </label>
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
                                indentationWidth={indentationWidth}
                                onRemove={() => handleRemove(id)}
                                attribute={itemData}
                                setAttribute={(updates) => handleSetAttribute(id, updates)}
                                availableAttributes={dataSource && sectionsMap ? sectionsMap[dataSource].attributes : []}
                            />
                        ) : (
                            <SortableAttributeGroup
                                key={id}
                                id={id}
                                depth={id === activeId && projected ? projected.depth : depth}
                                indentationWidth={indentationWidth}
                                collapsed={Boolean(collapsed && children.length)}
                                onCollapse={children.length ? () => handleCollapse(id) : undefined}
                                onRemove={() => handleRemove(id)}
                                attributeGroup={itemData}
                                setAttributeGroup={(updates) => {
                                    handleSetAttribute(id, updates);
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
                                    name={activeItem.name}
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