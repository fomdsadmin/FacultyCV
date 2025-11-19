import React from "react";
import { useTemplateBuilder } from "../TemplateBuilderContext";

const AggregateComponent = ({ dataSource, aggregateSettings, setAggregateSettings }) => {
    const { sectionsMap } = useTemplateBuilder();

    // Get all attributes for this datasource
    const attributesType = sectionsMap?.[dataSource]?.attributes_type || {};
    const allAttributeNames = Object.keys(attributesType);

    const handleAddAggregateField = () => {
        const aggregateFields = aggregateSettings || [];
        setAggregateSettings([
            ...aggregateFields,
            { attribute: "", operation: "sum", label: "" },
        ]);
    };

    const handleRemoveAggregateField = (index) => {
        setAggregateSettings(
            (aggregateSettings || []).filter((_, i) => i !== index)
        );
    };

    const handleAggregateFieldChange = (index, field, value) => {
        const aggregateFields = [...(aggregateSettings || [])];
        aggregateFields[index] = { ...aggregateFields[index], [field]: value };
        
        // If changing attribute to a non-date type, remove dateFilter
        if (field === "attribute") {
            const attrType = attributesType[value];
            if (attrType !== "date") {
                delete aggregateFields[index].dateFilter;
            }
        }
        
        setAggregateSettings(aggregateFields);
    };

    if (allAttributeNames.length === 0) {
        return (
            <div style={{ color: "#999", fontSize: 12, padding: "8px 0" }}>
                No attributes available for aggregation
            </div>
        );
    }

    return (
        <div style={{ marginTop: 16, padding: "12px", backgroundColor: "#f9f9f9", borderRadius: 6 }}>
            <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 13, color: "#333" }}>Aggregate</strong>
                <p style={{ color: "#666", fontSize: 12, marginTop: 8, marginBottom: 12, fontWeight: 500 }}>
                    Aggregate these fields:
                </p>
            </div>

            <div style={{ padding: "12px", backgroundColor: "white", borderRadius: 4 }}>
                {(aggregateSettings || []).length === 0 ? (
                    <p style={{ color: "#999", fontSize: 12, margin: "8px 0" }}>
                        No aggregate fields set yet
                    </p>
                ) : (
                    (aggregateSettings || []).map((aggField, index) => {
                        const selectedAttrType = attributesType[aggField.attribute];
                        const isDateAttribute = selectedAttrType === "date";
                        
                        return (
                            <div
                                key={index}
                                style={{
                                    marginBottom: 12,
                                    padding: "8px",
                                    backgroundColor: "#f9f9f9",
                                    borderRadius: 4,
                                    border: "1px solid #e0e0e0",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        marginBottom: isDateAttribute ? 8 : 0,
                                        alignItems: "flex-end",
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>
                                            Attribute
                                        </label>
                                        <select
                                            value={aggField.attribute || ""}
                                            onChange={(e) =>
                                                handleAggregateFieldChange(index, "attribute", e.target.value)
                                            }
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
                                    <div style={{ flex: 0.8 }}>
                                        <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>
                                            Operation
                                        </label>
                                        <select
                                            value={aggField.operation || "sum"}
                                            onChange={(e) =>
                                                handleAggregateFieldChange(index, "operation", e.target.value)
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "6px 8px",
                                                border: "1px solid #ddd",
                                                borderRadius: 3,
                                                fontSize: 12,
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <option value="sum">Sum</option>
                                            <option value="count">Count</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>
                                            Display Label
                                        </label>
                                        <input
                                            type="text"
                                            value={aggField.label || ""}
                                            onChange={(e) =>
                                                handleAggregateFieldChange(index, "label", e.target.value)
                                            }
                                            placeholder="e.g., Total Students"
                                            style={{
                                                width: "100%",
                                                padding: "6px 8px",
                                                border: "1px solid #ddd",
                                                borderRadius: 3,
                                                fontSize: 12,
                                                boxSizing: "border-box",
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleRemoveAggregateField(index)}
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
                                
                                {/* Date filter option for date attributes */}
                                {isDateAttribute && (
                                    <div
                                        style={{
                                            paddingTop: 8,
                                            paddingLeft: 8,
                                            borderTop: "1px solid #ddd",
                                        }}
                                    >
                                        <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 500 }}>
                                            Include:
                                        </label>
                                        <select
                                            value={aggField.dateFilter || "all"}
                                            onChange={(e) =>
                                                handleAggregateFieldChange(index, "dateFilter", e.target.value)
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "6px 8px",
                                                border: "1px solid #ddd",
                                                borderRadius: 3,
                                                fontSize: 12,
                                                boxSizing: "border-box",
                                                backgroundColor: "#fff",
                                            }}
                                        >
                                            <option value="all">All Dates</option>
                                            <option value="current">Current Dates Only</option>
                                            <option value="completed">Completed Dates Only</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                <button
                    onClick={handleAddAggregateField}
                    style={{
                        padding: "6px 12px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                        marginTop: 8,
                    }}
                >
                    + Add Aggregate Field
                </button>
            </div>
        </div>
    );
};

export default AggregateComponent;
