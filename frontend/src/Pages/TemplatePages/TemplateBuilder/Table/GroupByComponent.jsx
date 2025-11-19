import React from "react";
import { useTemplateBuilder } from "../TemplateBuilderContext";

const GroupByComponent = ({ dataSource, groupBySettings, setGroupBySettings, groupingMode, setGroupingMode }) => {
    const { sectionsMap } = useTemplateBuilder();

    // Get all attributes for this datasource
    const attributesType = sectionsMap?.[dataSource]?.attributes_type || {};
    const allAttributeNames = Object.keys(attributesType);

    const handleAddGroupByAttribute = () => {
        const groupBy = groupBySettings || [];
        setGroupBySettings([
            ...groupBy,
            { attribute: "", displayOrder: groupBy.length },
        ]);
    };

    const handleRemoveGroupByAttribute = (index) => {
        setGroupBySettings(
            (groupBySettings || []).filter((_, i) => i !== index)
        );
    };

    const handleGroupByChange = (index, field, value) => {
        const groupBy = [...(groupBySettings || [])];
        groupBy[index] = { ...groupBy[index], [field]: value };
        setGroupBySettings(groupBy);
    };

    if (allAttributeNames.length === 0) {
        return (
            <div style={{ color: "#999", fontSize: 12, padding: "8px 0" }}>
                No attributes available for grouping
            </div>
        );
    }

    return (
        <div style={{ marginTop: 16, padding: "12px", backgroundColor: "#f9f9f9", borderRadius: 6 }}>
            <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 13, color: "#333" }}>Group By</strong>
                <p style={{ color: "#666", fontSize: 12, marginTop: 8, marginBottom: 12, fontWeight: 500 }}>
                    Group data by these attributes:
                </p>
            </div>

            {/* Grouping Mode Selection */}
            <div style={{ marginBottom: 12, padding: "8px 12px", backgroundColor: "white", borderRadius: 4, border: "1px solid #e0e0e0" }}>
                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 8, fontWeight: 500 }}>
                    Grouping Mode:
                </label>
                <div style={{ display: "flex", gap: 16 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#333" }}>
                        <input
                            type="radio"
                            name="groupingMode"
                            value="hierarchical"
                            checked={groupingMode === "hierarchical"}
                            onChange={(e) => setGroupingMode(e.target.value)}
                            style={{ cursor: "pointer" }}
                        />
                        Hierarchical (nested groups)
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#333" }}>
                        <input
                            type="radio"
                            name="groupingMode"
                            value="composite"
                            checked={groupingMode === "composite"}
                            onChange={(e) => setGroupingMode(e.target.value)}
                            style={{ cursor: "pointer" }}
                        />
                        Composite (match all attributes)
                    </label>
                </div>
            </div>

            <div style={{ padding: "12px", backgroundColor: "white", borderRadius: 4 }}>
                {groupingMode === "hierarchical" && (
                    <p style={{ color: "#666", fontSize: 11, marginBottom: 12, fontStyle: "italic" }}>
                        Records will be grouped hierarchically: first by the first attribute, then by the second within each group, etc.
                    </p>
                )}
                {groupingMode === "composite" && (
                    <p style={{ color: "#666", fontSize: 11, marginBottom: 12, fontStyle: "italic" }}>
                        Records will be grouped together only if ALL selected attributes have matching values.
                    </p>
                )}
                
                {(groupBySettings || []).length === 0 ? (
                    <p style={{ color: "#999", fontSize: 12, margin: "8px 0" }}>
                        No group by attributes set yet
                    </p>
                ) : (
                    (groupBySettings || []).map((group, index) => (
                        <div
                            key={index}
                            style={{
                                display: "flex",
                                gap: 8,
                                marginBottom: 12,
                                padding: "8px",
                                backgroundColor: "#f9f9f9",
                                borderRadius: 4,
                                border: "1px solid #e0e0e0",
                                alignItems: "flex-end",
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>
                                    Attribute
                                </label>
                                <select
                                    value={group.attribute || ""}
                                    onChange={(e) => handleGroupByChange(index, "attribute", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "6px 8px",
                                        border: "1px solid #ddd",
                                        borderRadius: 3,
                                        fontSize: 12,
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <option value="">Select attribute...</option>
                                    {allAttributeNames.map((attrName) => (
                                        <option key={attrName} value={attrName}>
                                            {attrName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => handleRemoveGroupByAttribute(index)}
                                style={{
                                    padding: "6px 12px",
                                    backgroundColor: "#ff5252",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 3,
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 500,
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    ))
                )}
                <button
                    onClick={handleAddGroupByAttribute}
                    style={{
                        padding: "6px 12px",
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                        marginTop: 8,
                    }}
                >
                    + Add Group By
                </button>
            </div>
        </div>
    );
};

export default GroupByComponent;
