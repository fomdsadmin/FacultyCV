import React, { useMemo, useState } from "react";
import ModalStylingWrapper from "SharedComponents/ModalStylingWrapper";
import { useTemplateBuilder } from "../../TemplateBuilderContext";

const AddAttributeModal = ({ onAdd, dataSources, attributeItems }) => {
    const { sectionsMap } = useTemplateBuilder();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDataSource, setSelectedDataSource] = useState("");
    const [selectedId, setSelectedId] = useState("");

    // Get available data sources
    const availableDataSources = useMemo(() => {
        return dataSources && Array.isArray(dataSources) 
            ? dataSources.map(ds => ds.dataSource) 
            : [];
    }, [dataSources]);

    // Get available attributes for the selected data source
    const availableAttributes = useMemo(() => {
        if (!selectedDataSource) return [];
        
        const section = sectionsMap ? sectionsMap[selectedDataSource] : null;
        if (!section || !section.attributes) return [];

        // Include row number as a special attribute
        const sectionWithRowNumKey = [
            ...section.attributes,
            { id: "custom_row_number", key: "row_number", originalName: "Row #" }
        ];
        
        // Note: We allow duplicates, so we don't filter by usedIds anymore
        return sectionWithRowNumKey;
    }, [selectedDataSource, sectionsMap]);

    // Initialize selected data source on open
    const handleOpen = () => {
        if (availableDataSources.length > 0 && !selectedDataSource) {
            setSelectedDataSource(availableDataSources[0]);
        }
        setIsOpen(true);
    };

    const handleClose = () => {
        setSelectedId("");
        setSelectedDataSource("");
        setIsOpen(false);
    };

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

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSubmit();
        }
    };

    if (availableDataSources.length === 0) {
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
                + Add Attribute (No data sources)
            </button>
        );
    }

    return (
        <>
            <button
                onClick={handleOpen}
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
                        
                        {/* Data Source Selector */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4, fontWeight: 500 }}>
                                Data Source
                            </label>
                            <select
                                value={selectedDataSource}
                                onChange={(e) => {
                                    setSelectedDataSource(e.target.value);
                                    setSelectedId(""); // Reset attribute selection
                                }}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: "1px solid #ddd",
                                    borderRadius: 4,
                                    fontSize: 14,
                                    boxSizing: "border-box",
                                }}
                                autoFocus
                            >
                                {availableDataSources.map((ds) => (
                                    <option key={ds} value={ds}>
                                        {ds}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Attribute Selector */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4, fontWeight: 500 }}>
                                Attribute
                            </label>
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
                                    boxSizing: "border-box",
                                }}
                            >
                                <option value="">Select an attribute...</option>
                                {availableAttributes.map((attr) => (
                                    <option key={attr.id || attr.key} value={attr.id || attr.key}>
                                        {attr.originalName}
                                    </option>
                                ))}
                            </select>
                        </div>

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

