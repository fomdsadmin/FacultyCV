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
        <div className="mb-4 p-3 bg-gray-100 rounded border border-gray-300">
            <div className="mb-3">
                <strong className="text-xs text-gray-800">Mock Data Table</strong>
                <p className="text-gray-600 text-xs mt-1 mb-2">
                    Edit data directly or click cells to modify them.
                </p>
            </div>

            {/* Add Row Button */}
            <div className="mb-3">
                <button
                    onClick={addRow}
                    className="px-3 py-1.5 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors"
                >
                    + Add Row
                </button>
            </div>

            {/* Mock Data Table */}
            <div className="overflow-x-auto border border-gray-300 rounded bg-gray-50">
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-gray-200 border-b border-gray-300">
                            {Object.entries(attributeKeys).map(([displayName, fieldName]) => (
                                <th
                                    key={fieldName}
                                    className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300"
                                >
                                    {fieldName}
                                </th>
                            ))}
                            <th className="px-3 py-2 text-center font-semibold text-gray-700 w-10">
                                Del
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <tr
                                key={rowIdx}
                                className={`border-b border-gray-300 ${
                                    rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }`}
                            >
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
                                            className={`px-3 py-2 border-r border-gray-300 text-gray-800 cursor-pointer ${
                                                isEditing ? "bg-yellow-100" : ""
                                            }`}
                                            onClick={() => !isEditing && startEditCell(rowIdx, fieldName, currentValue)}
                                        >
                                            {isEditing ? (
                                                <div className="flex gap-1">
                                                    {attrType === "dropdown" && dropdownOptions[displayName] ? (
                                                        <select
                                                            value={editingValue}
                                                            onChange={(e) => setEditingValue(e.target.value)}
                                                            onKeyPress={handleEditKeyPress}
                                                            onBlur={saveEdit}
                                                            autoFocus
                                                            className="flex-1 px-1.5 py-1 border border-blue-500 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
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
                                                            className="flex-1 px-1.5 py-1 border border-blue-500 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                                                        />
                                                    )}
                                                    <button
                                                        onClick={saveEdit}
                                                        className="px-1.5 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="px-1.5 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <span title={String(currentValue)} className="block overflow-hidden text-ellipsis whitespace-nowrap max-w-xs">
                                                    {String(currentValue || "")}
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="px-3 py-2 text-center">
                                    <button
                                        onClick={() => removeRow(rowIdx)}
                                        className="px-1.5 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
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
