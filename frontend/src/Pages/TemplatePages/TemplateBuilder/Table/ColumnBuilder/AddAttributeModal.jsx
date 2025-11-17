import React, { useMemo, useState } from "react";
import ModalStylingWrapper from "SharedComponents/ModalStylingWrapper";
import { useTemplateBuilder } from "../../TemplateBuilderContext";

const AddAttributeModal = ({ onAdd, dataSource, attributeItems }) => {
    const { sectionsMap } = useTemplateBuilder();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedId, setSelectedId] = useState("");

    // Get available attributes (in datasource but not in attributeItems)
    const availableAttributes = useMemo(() => {
        const section = dataSource && sectionsMap ? sectionsMap[dataSource] : null;
        if (!section || !section.attributes) return [];

        // Recursively collect all attribute keys from the entire tree
        const collectAttributeKeys = (items) => {
            const keys = new Set();
            const traverse = (nodeList) => {
                for (const item of nodeList) {
                    if (item.type === "attribute") {
                        keys.add(item.key);
                    }
                    if (item.children && item.children.length > 0) {
                        traverse(item.children);
                    }
                }
            };
            traverse(items);
            return keys;
        };

        const usedIds = collectAttributeKeys(attributeItems);

        const sectionWithRowNumKey = [
            ...section.attributes,
            { id: "custom_row_number", key: "row_number", originalName: "Row #" }
        ];
        return sectionWithRowNumKey.filter((attr) => !usedIds.has(attr.key));
    }, [dataSource, sectionsMap, attributeItems]);

    const handleSubmit = () => {
        if (selectedId) {
            const selected = availableAttributes.find((attr) => attr.id === selectedId || attr.key === selectedId);
            if (selected) {
                // Pass the full attribute object so keyRename is initialized
                onAdd(selected.originalName, selected.key, selected);
                setSelectedId("");
                setIsOpen(false);
            }
        }
    };

    const handleClose = () => {
        setSelectedId("");
        setIsOpen(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSubmit();
        }
    };

    if (availableAttributes.length === 0) {
        return (
            <button
                disabled
                style={{
                    padding: "8px 16px",
                    backgroundColor: "#ccc",
                    color: "#999",
                    border: "none",
                    borderRadius: 4,
                    cursor: "not-allowed",
                    fontSize: 14,
                    fontWeight: 500,
                }}
            >
                + Add Attribute (None available)
            </button>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    padding: "8px 16px",
                    backgroundColor: "#FF9800",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                }}
            >
                + Add Attribute
            </button>

            {isOpen && (
                <ModalStylingWrapper useDefaultBox>
                    <div>
                        <h4 style={{ marginTop: 0, marginBottom: 16 }}>Add Attribute</h4>
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            onKeyPress={handleKeyPress}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #ddd",
                                borderRadius: 4,
                                fontSize: 14,
                                marginBottom: 16,
                                boxSizing: "border-box",
                            }}
                            autoFocus
                        >
                            <option value="">Select an attribute...</option>
                            {availableAttributes.map((attr) => (
                                <option key={attr.id || attr.key} value={attr.id || attr.key}>
                                    {attr.originalName}
                                </option>
                            ))}
                        </select>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button
                                onClick={handleClose}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#f0f0f0",
                                    color: "#333",
                                    border: "1px solid #ddd",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    fontSize: 14,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedId}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: selectedId ? "#FF9800" : "#ccc",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: selectedId ? "pointer" : "not-allowed",
                                    fontSize: 14,
                                    fontWeight: 500,
                                }}
                            >
                                Add Attribute
                            </button>
                        </div>
                    </div>
                </ModalStylingWrapper>
            )}
        </>
    );
};

export default AddAttributeModal;
