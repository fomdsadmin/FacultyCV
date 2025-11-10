import React, { useState } from "react";
import { useTemplateBuilder } from "../../TemplateBuilderContext";

const MockDataTable = ({ data, setData, attributeKeys, dataSource }) => {
    const { sectionsMap } = useTemplateBuilder();
    const [editingCell, setEditingCell] = useState(null); // { rowIdx, fieldName }
    const [editingValue, setEditingValue] = useState("");

    const startEditCell = (rowIdx, fieldName, currentValue) => {
        setEditingCell({ rowIdx, fieldName });
        setEditingValue(String(currentValue || ""));
    };

    const cancelEdit = () => {
        setEditingCell(null);
        setEditingValue("");
    };

    const saveEdit = () => {
        if (!editingCell || !data) return;

        const { rowIdx, fieldName } = editingCell;
        const updatedData = [...data];
        const section = sectionsMap[dataSource];
        const attributesType = section?.attributes_type || {};
        const dropdownOptions = section?.dropdownOptions || {};

        // Find the display name for this field name
        let displayName = "";
        for (const [dName, fName] of Object.entries(attributeKeys)) {
            if (fName === fieldName) {
                displayName = dName;
                break;
            }
        }

        // Validate and convert value based on attribute type
        let convertedValue = editingValue;
        const attrType = attributesType[displayName];

        if (attrType === "number") {
            convertedValue = isNaN(editingValue) ? 0 : Number(editingValue);
        } else if (attrType === "dropdown" && dropdownOptions[displayName]) {
            // Ensure value is one of the allowed options
            const opts = dropdownOptions[displayName];
            if (!opts.includes(editingValue)) {
                convertedValue = opts[0];
            }
        }

        updatedData[rowIdx][fieldName] = convertedValue;
        setData(updatedData);
        setEditingCell(null);
        setEditingValue("");
    };

    const handleEditKeyPress = (e) => {
        if (e.key === "Enter") {
            saveEdit();
        } else if (e.key === "Escape") {
            cancelEdit();
        }
    };

    const addRow = () => {
        if (!data) return;

        const newRow = {};
        const section = sectionsMap[dataSource];
        const attributesType = section?.attributes_type || {};
        const dropdownOptions = section?.dropdownOptions || {};

        // Create new row with default values
        for (const [displayName, fieldName] of Object.entries(attributeKeys)) {
            const attrType = attributesType[displayName];

            if (attrType === "dropdown" && dropdownOptions[displayName]) {
                const opts = dropdownOptions[displayName];
                newRow[fieldName] = opts[0];
            } else if (attrType === "date") {
                const year = new Date().getFullYear();
                newRow[fieldName] = `${year} - ${year}`;
            } else if (attrType === "number") {
                newRow[fieldName] = 0;
            } else {
                newRow[fieldName] = "";
            }
        }

        setData([...data, newRow]);
    };

    const removeRow = (rowIdx) => {
        if (!data) return;
        const updatedData = data.filter((_, idx) => idx !== rowIdx);
        setData(updatedData);
    };

    if (!data || data.length === 0) return null;

    return (
        <div style={{ marginBottom: 16, padding: "12px", backgroundColor: "#f5f5f5", borderRadius: 4, border: "1px solid #e0e0e0" }}>
            <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 12, color: "#333" }}>Mock Data Table</strong>
                <p style={{ color: "#666", fontSize: 11, marginTop: 4, marginBottom: 8 }}>
                    Edit data directly or click cells to modify them.
                </p>
            </div>

            {/* Add Row Button */}
            <div style={{ marginBottom: 12 }}>
                <button
                    onClick={addRow}
                    style={{
                        padding: "6px 12px",
                        backgroundColor: "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 500,
                    }}
                >
                    + Add Row
                </button>
            </div>

            {/* Mock Data Table */}
            <div style={{
                overflowX: "auto",
                border: "1px solid #ddd",
                borderRadius: 4,
                backgroundColor: "#fafafa",
            }}>
                <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 11,
                }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "1px solid #ddd" }}>
                            <th style={{
                                padding: "8px 12px",
                                textAlign: "center",
                                fontWeight: 600,
                                color: "#666",
                                width: "40px",
                                borderRight: "1px solid #ddd",
                            }}>
                                #
                            </th>
                            {Object.entries(attributeKeys).map(([displayName, fieldName]) => (
                                <th
                                    key={fieldName}
                                    style={{
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        fontWeight: 600,
                                        color: "#666",
                                        borderRight: "1px solid #ddd",
                                    }}
                                >
                                    {fieldName}
                                </th>
                            ))}
                            <th style={{
                                padding: "8px 12px",
                                textAlign: "center",
                                fontWeight: 600,
                                color: "#666",
                                width: "40px",
                            }}>
                                Del
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <tr
                                key={rowIdx}
                                style={{
                                    borderBottom: "1px solid #ddd",
                                    backgroundColor: rowIdx % 2 === 0 ? "#fff" : "#f9f9f9",
                                }}
                            >
                                <td style={{
                                    padding: "8px 12px",
                                    textAlign: "center",
                                    color: "#999",
                                    borderRight: "1px solid #ddd",
                                    fontSize: 10,
                                }}>
                                    {rowIdx + 1}
                                </td>
                                {Object.entries(attributeKeys).map(([displayName, fieldName]) => {
                                    const section = sectionsMap[dataSource];
                                    const attributesType = section?.attributes_type || {};
                                    const dropdownOptions = section?.dropdownOptions || {};
                                    const currentValue = row[fieldName];
                                    const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.fieldName === fieldName;
                                    const attrType = attributesType[displayName];

                                    return (
                                        <td
                                            key={fieldName}
                                            style={{
                                                padding: "8px 12px",
                                                borderRight: "1px solid #ddd",
                                                color: "#333",
                                                cursor: "pointer",
                                                backgroundColor: isEditing ? "#fff9c4" : "inherit",
                                            }}
                                            onClick={() => !isEditing && startEditCell(rowIdx, fieldName, currentValue)}
                                        >
                                            {isEditing ? (
                                                <div style={{ display: "flex", gap: 4 }}>
                                                    {attrType === "dropdown" && dropdownOptions[displayName] ? (
                                                        <select
                                                            value={editingValue}
                                                            onChange={(e) => setEditingValue(e.target.value)}
                                                            onKeyPress={handleEditKeyPress}
                                                            onBlur={saveEdit}
                                                            autoFocus
                                                            style={{
                                                                flex: 1,
                                                                padding: "4px 6px",
                                                                border: "1px solid #2196F3",
                                                                borderRadius: 2,
                                                                fontSize: 11,
                                                            }}
                                                        >
                                                            {dropdownOptions[displayName].map((opt) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type={attrType === "number" ? "number" : "text"}
                                                            value={editingValue}
                                                            onChange={(e) => setEditingValue(e.target.value)}
                                                            onKeyPress={handleEditKeyPress}
                                                            onBlur={saveEdit}
                                                            autoFocus
                                                            style={{
                                                                flex: 1,
                                                                padding: "4px 6px",
                                                                border: "1px solid #2196F3",
                                                                borderRadius: 2,
                                                                fontSize: 11,
                                                            }}
                                                        />
                                                    )}
                                                    <button
                                                        onClick={saveEdit}
                                                        style={{
                                                            padding: "2px 6px",
                                                            backgroundColor: "#4caf50",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: 2,
                                                            cursor: "pointer",
                                                            fontSize: 10,
                                                        }}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        style={{
                                                            padding: "2px 6px",
                                                            backgroundColor: "#f44336",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: 2,
                                                            cursor: "pointer",
                                                            fontSize: 10,
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <span title={String(currentValue)} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                                                    {String(currentValue || "")}
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                                <td style={{
                                    padding: "8px 12px",
                                    textAlign: "center",
                                }}>
                                    <button
                                        onClick={() => removeRow(rowIdx)}
                                        style={{
                                            padding: "2px 6px",
                                            backgroundColor: "#f44336",
                                            color: "white",
                                            border: "none",
                                            borderRadius: 2,
                                            cursor: "pointer",
                                            fontSize: 10,
                                        }}
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MockDataTable;
