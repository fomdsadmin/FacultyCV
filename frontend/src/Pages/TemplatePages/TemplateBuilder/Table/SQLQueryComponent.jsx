import React, { useState, useEffect } from "react";
import * as alasql from "alasql";
import { useTemplateBuilder } from "../TemplateBuilderContext";

alasql.fn.DATE_IS_COMPLETE = function (value) {
    if (!value) return false;
    return String(value).includes('-');
};

alasql.from.EXPAND_DELIMITER_LIST = function(dbtype, opts, cb, idx, query) {
    const column = opts.column;      // column to split
    const delimiter = opts.delimiter; // delimiter
    const table = opts.table || [];   // input table

    const expanded = [];

    console.log("jjfilter column: ", column)
    console.log("jjfilter delimiter: ", delimiter)
    console.log("jjfilter table: ", table)
    console.log("jjfilter opts: ", opts)

    table.forEach(row => {
        const value = row[column];
        if (!value) {
            expanded.push(row);
        } else {
            const items = String(value).split(delimiter).map(str => str.trim());
            console.log("jjfilter value: ", value)
            console.log("jjfilter value after split: ", items)
            items.forEach(item => {
                const newRow = { ...row };
                newRow[column] = item;
                expanded.push(newRow);
            });
        }
    });

    if (cb) return cb(expanded, idx, query);
    return expanded;
};





const SQLQueryComponent = ({ dataSource, sqlSettings, setSqlSettings, filterSettings, attributeKeys = {} }) => {
    const { sectionsMap } = useTemplateBuilder();
    const [customQuery, setCustomQuery] = useState(sqlSettings?.customQuery || "");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [editingCell, setEditingCell] = useState(null); // { rowIdx, fieldName }
    const [editingValue, setEditingValue] = useState("");

    // Mock data generator
    const generateMockData = (section, keys) => {
        if (!section) return [];

        const attributesType = section.attributes_type || {};
        const dropdownOptions = section.dropdownOptions || {};

        const mockAdjectives = ["Advanced", "Basic", "Intermediate", "Expert", "Beginner"];
        const mockNouns = ["Seminar", "Workshop", "Conference", "Course", "Training", "Lecture", "Discussion", "Presentation"];

        const generateRandomString = () => {
            const adj = mockAdjectives[Math.floor(Math.random() * mockAdjectives.length)];
            const noun = mockNouns[Math.floor(Math.random() * mockNouns.length)];
            return `${adj} ${noun}`;
        };

        const generateRandomDate = () => {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            const startYear = Math.floor(Math.random() * (2020 - 2000 + 1)) + 2000;
            const endYear = Math.floor(Math.random() * (2025 - startYear + 1)) + startYear;
            const startMonth = months[Math.floor(Math.random() * months.length)];
            const endMonth = months[Math.floor(Math.random() * months.length)];

            const formats = [
                // Single year
                () => `${startYear}`,
                // Year - Year
                () => `${startYear} - ${endYear}`,
                // Month Year - Month Year
                () => `${startMonth} ${startYear} - ${endMonth} ${endYear}`,
                // Current
                () => `Current`,
                // Current - Current
                () => `Current - Current`,
                // Year - Current
                () => `${startYear} - Current`,
            ];

            const randomFormat = formats[Math.floor(Math.random() * formats.length)];
            return randomFormat();
        };

        const generateRandomNumber = () => Math.floor(Math.random() * 1000);

        // Find all dropdown attributes and their options
        const dropdownAttributes = Object.entries(keys).filter(([displayName]) =>
            attributesType[displayName] === "dropdown" && dropdownOptions[displayName]
        );

        // Determine how many rows we need based on dropdown options
        let mockRows = [];

        if (dropdownAttributes.length > 0) {
            // Create a set to track all combinations of dropdown values we need to represent
            // For each dropdown attribute, we need to ensure all its options appear

            // Start by creating one row for each option of the first dropdown
            const [firstDropdownName] = dropdownAttributes[0];
            const firstDropdownOptions = dropdownOptions[firstDropdownName];

            firstDropdownOptions.forEach(option => {
                // For each option of the first dropdown, generate 1-3 rows
                const rowsPerOption = Math.floor(Math.random() * 3) + 1;

                for (let i = 0; i < rowsPerOption; i++) {
                    const row = {};

                    // Fill in all attributes for this row
                    for (const [displayName, fieldName] of Object.entries(keys)) {
                        const attrType = attributesType[displayName];

                        if (attrType === "dropdown" && dropdownOptions[displayName]) {
                            if (displayName === firstDropdownName) {
                                // Use the current option for the first dropdown
                                row[fieldName] = option;
                            } else {
                                // For other dropdowns, pick a random option
                                const opts = dropdownOptions[displayName];
                                row[fieldName] = opts[Math.floor(Math.random() * opts.length)];
                            }
                        } else if (attrType === "date") {
                            row[fieldName] = generateRandomDate();
                        } else if (attrType === "text") {
                            row[fieldName] = generateRandomString();
                        } else if (attrType === "number") {
                            row[fieldName] = generateRandomNumber();
                        } else {
                            row[fieldName] = generateRandomString();
                        }
                    }

                    mockRows.push(row);
                }
            });

            // Now ensure all options from other dropdown attributes are also represented
            for (let d = 1; d < dropdownAttributes.length; d++) {
                const [dropdownName] = dropdownAttributes[d];
                const dropdownOpts = dropdownOptions[dropdownName];

                dropdownOpts.forEach(option => {
                    // Generate 1-3 rows for each option of this dropdown
                    const rowsPerOption = Math.floor(Math.random() * 3) + 1;

                    for (let i = 0; i < rowsPerOption; i++) {
                        const row = {};

                        // Fill in all attributes for this row
                        for (const [displayName, fieldName] of Object.entries(keys)) {
                            const attrType = attributesType[displayName];

                            if (attrType === "dropdown" && dropdownOptions[displayName]) {
                                if (displayName === dropdownName) {
                                    // Use the current option for this dropdown
                                    row[fieldName] = option;
                                } else {
                                    // For other dropdowns, pick a random option
                                    const opts = dropdownOptions[displayName];
                                    row[fieldName] = opts[Math.floor(Math.random() * opts.length)];
                                }
                            } else if (attrType === "date") {
                                row[fieldName] = generateRandomDate();
                            } else if (attrType === "text") {
                                row[fieldName] = generateRandomString();
                            } else if (attrType === "number") {
                                row[fieldName] = generateRandomNumber();
                            } else {
                                row[fieldName] = generateRandomString();
                            }
                        }

                        mockRows.push(row);
                    }
                });
            }
        } else {
            // If no dropdown attributes, generate 3-5 rows as before
            const rowCount = Math.floor(Math.random() * 3) + 3;

            for (let i = 0; i < rowCount; i++) {
                const row = {};

                for (const [displayName, fieldName] of Object.entries(keys)) {
                    const attrType = attributesType[displayName];

                    if (attrType === "dropdown" && dropdownOptions[displayName]) {
                        const options = dropdownOptions[displayName];
                        row[fieldName] = options[Math.floor(Math.random() * options.length)];
                    } else if (attrType === "date") {
                        row[fieldName] = generateRandomDate();
                    } else if (attrType === "text") {
                        row[fieldName] = generateRandomString();
                    } else if (attrType === "number") {
                        row[fieldName] = generateRandomNumber();
                    } else {
                        row[fieldName] = generateRandomString();
                    }
                }

                mockRows.push(row);
            }
        }

        return mockRows;
    };

    // ...existing code...
    useEffect(() => {
        try {
            setLoading(true);
            setError(null);

            if (!dataSource || !sectionsMap) {
                setData(null);
                return;
            }

            // Get section from sectionsMap
            const section = sectionsMap[dataSource];
            if (!section) {
                setError(`Section "${dataSource}" not found`);
                setData(null);
                return;
            }

            // Generate mock data based on section attributes using attributeKeys
            const mockTableData = generateMockData(section, attributeKeys);

            if (mockTableData.length > 0) {
                setData(mockTableData);
                setError(null);
                console.log(`Generated ${mockTableData.length} mock rows for datasource: ${dataSource}`);
            } else {
                setError("Could not generate mock data for this section");
                setData(null);
            }
        } catch (err) {
            setError(`Error generating mock data: ${err.message}`);
            console.error("Error generating mock data:", err);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [dataSource, sectionsMap, attributeKeys]);

    const executeQuery = async () => {
        if (!customQuery || !customQuery.trim()) {
            setError("No query to execute");
            return;
        }

        if (!data || data.length === 0) {
            setError("No data available to query");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Execute AlaSQL query
            console.log("data quereying:", data)
            const res = alasql(customQuery, [data]);

            setResults({
                columns: res.length > 0 ? Object.keys(res[0]) : [],
                rows: res
            });
        } catch (err) {
            setError(`Query error: ${err.message}`);
            console.error("AlaSQL query error:", err);
            setResults(null);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
            executeQuery();
        }
    };

    const handleCustomQueryChange = (e) => {
        setCustomQuery(e.target.value);
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
        setResults(null); // Clear results when data changes
    };

    const removeRow = (rowIdx) => {
        if (!data) return;
        const updatedData = data.filter((_, idx) => idx !== rowIdx);
        setData(updatedData);
        setResults(null); // Clear results when data changes
    };

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
        setResults(null); // Clear results when data changes
    };

    const handleEditKeyPress = (e) => {
        if (e.key === "Enter") {
            saveEdit();
        } else if (e.key === "Escape") {
            cancelEdit();
        }
    };

    return (
        <div style={{ marginTop: 16, padding: "12px", backgroundColor: "#f9f9f9", borderRadius: 6 }}>
            <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 13, color: "#333" }}>SQL Query</strong>
                <p style={{ color: "#666", fontSize: 12, marginTop: 8, marginBottom: 12, fontWeight: 500 }}>
                    View and customize the SQL query generated from filters and aggregations
                </p>
            </div>

            <div style={{ padding: "12px", backgroundColor: "white", borderRadius: 4 }}>
                {/* Custom Query Override */}
                {/* Mock Data Editor */}
                {data && (
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
                )}

                <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 500 }}>
                        SQL Query
                    </label>
                    <textarea
                        value={customQuery}
                        onChange={handleCustomQueryChange}
                        onKeyPress={handleKeyPress}
                        placeholder="SELECT * FROM ? WHERE condition"
                        style={{
                            width: "100%",
                            minHeight: "100px",
                            padding: "8px 12px",
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            fontSize: 12,
                            fontFamily: "monospace",
                            boxSizing: "border-box",
                            resize: "vertical",
                        }}
                    />
                </div>

                {/* Execute Button */}
                <div style={{ marginBottom: 12 }}>
                    <button
                        onClick={executeQuery}
                        disabled={loading}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: loading ? "#ccc" : "#2196F3",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: loading ? "not-allowed" : "pointer",
                            fontSize: 12,
                            fontWeight: 500,
                        }}
                    >
                        {loading ? "Executing..." : "Execute Query"}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        marginBottom: 12,
                        padding: "8px 12px",
                        backgroundColor: "#ffebee",
                        border: "1px solid #ef5350",
                        borderRadius: 4,
                        color: "#c62828",
                        fontSize: 12,
                    }}>
                        {error}
                    </div>
                )}

                {/* Results */}
                {results && (
                    <div style={{ marginTop: 12 }}>
                        <div style={{ marginBottom: 8 }}>
                            <strong style={{ fontSize: 12, color: "#333" }}>
                                Results ({results.rows.length} rows)
                            </strong>
                        </div>
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
                                    <tr style={{ backgroundColor: "#e3f2fd", borderBottom: "1px solid #ddd" }}>
                                        {results.columns.map((col, idx) => (
                                            <th
                                                key={idx}
                                                style={{
                                                    padding: "8px 12px",
                                                    textAlign: "left",
                                                    fontWeight: 600,
                                                    color: "#1976d2",
                                                    borderRight: idx < results.columns.length - 1 ? "1px solid #ddd" : "none",
                                                }}
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.rows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={results.columns.length}
                                                style={{
                                                    padding: "8px 12px",
                                                    textAlign: "center",
                                                    color: "#999",
                                                }}
                                            >
                                                No results
                                            </td>
                                        </tr>
                                    ) : (
                                        results.rows.map((row, rowIdx) => (
                                            <tr
                                                key={rowIdx}
                                                style={{
                                                    borderBottom: "1px solid #ddd",
                                                    backgroundColor: rowIdx % 2 === 0 ? "#fff" : "#f9f9f9",
                                                }}
                                            >
                                                {results.columns.map((col, colIdx) => (
                                                    <td
                                                        key={colIdx}
                                                        style={{
                                                            padding: "8px 12px",
                                                            borderRight: colIdx < results.columns.length - 1 ? "1px solid #ddd" : "none",
                                                            color: "#333",
                                                        }}
                                                    >
                                                        {typeof row[col] === "object"
                                                            ? JSON.stringify(row[col])
                                                            : String(row[col])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Info Message */}
                {!results && !error && data && (
                    <div style={{
                        marginTop: 12,
                        padding: "8px 12px",
                        backgroundColor: "#e8f5e9",
                        border: "1px solid #4caf50",
                        borderRadius: 4,
                        color: "#2e7d32",
                        fontSize: 12,
                    }}>
                        Loaded {data.length} record(s). Click "Execute Query" to run the query.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SQLQueryComponent;
