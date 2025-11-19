import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FiTrash2 } from "react-icons/fi";

const RecordDetailTemplate = ({
    recordDetailTemplate = {},
    setRecordDetailTemplate,
    availableColumns = [],
}) => {
    const quillRef = useRef(null);
    const [invalidVariables, setInvalidVariables] = useState([]);
    const [invalidTableVariables, setInvalidTableVariables] = useState([]);
    const cellRefs = useRef({});

    const headerContent = recordDetailTemplate?.header || "";
    const tableRows = useMemo(() => recordDetailTemplate?.tableRows || [], [recordDetailTemplate?.tableRows]);

    // Detect invalid variables in header
    useEffect(() => {
        if (headerContent && availableColumns.length > 0) {
            const variableRegex = /\$\{([^}]+)\}/g;
            const matches = [...headerContent.matchAll(variableRegex)];
            const invalid = [];

            matches.forEach((match) => {
                const variableName = match[1];
                if (!availableColumns.includes(variableName) && !["rowIndex", "letterIndex"].includes(variableName)) {
                    invalid.push(variableName);
                }
            });

            setInvalidVariables(invalid);
        } else {
            setInvalidVariables([]);
        }
    }, [headerContent, availableColumns]);

    // Detect invalid variables in table cells
    useEffect(() => {
        if (tableRows.length > 0 && availableColumns.length > 0) {
            const variableRegex = /\$\{([^}]+)\}/g;
            const invalid = new Set();

            tableRows.forEach(row => {
                row.cells.forEach(cell => {
                    const matches = [...cell.content.matchAll(variableRegex)];
                    matches.forEach(match => {
                        const variableName = match[1];
                        if (!availableColumns.includes(variableName) && !["rowIndex", "letterIndex"].includes(variableName)) {
                            invalid.add(variableName);
                        }
                    });
                });
            });

            setInvalidTableVariables(Array.from(invalid));
        } else {
            setInvalidTableVariables([]);
        }
    }, [tableRows, availableColumns]);

    const handleHeaderChange = (content) => {
        setRecordDetailTemplate({
            ...recordDetailTemplate,
            header: content
        });
    };

    const insertHeaderVariable = (columnName) => {
        if (!quillRef.current) return;

        const editor = quillRef.current.getEditor();
        const cursorPosition = editor.getSelection()?.index || editor.getLength();

        const variableText = `\${${columnName}}`;
        editor.insertText(cursorPosition, variableText);
        editor.setSelection(cursorPosition + variableText.length);
        editor.focus();
    };

    const handleAddTableRow = () => {
        const newRow = {
            id: crypto.randomUUID(),
            cells: [
                { id: crypto.randomUUID(), content: "" },
                { id: crypto.randomUUID(), content: "" }
            ]
        };

        setRecordDetailTemplate({
            ...recordDetailTemplate,
            tableRows: [...tableRows, newRow]
        });
    };

    const handleRemoveTableRow = (rowId) => {
        setRecordDetailTemplate({
            ...recordDetailTemplate,
            tableRows: tableRows.filter(row => row.id !== rowId)
        });
    };

    const handleAddTableColumn = () => {
        const updatedRows = tableRows.map(row => ({
            ...row,
            cells: [...row.cells, { id: crypto.randomUUID(), content: "" }]
        }));

        setRecordDetailTemplate({
            ...recordDetailTemplate,
            tableRows: updatedRows
        });
    };

    const handleRemoveTableColumn = (columnIndex) => {
        const updatedRows = tableRows.map(row => ({
            ...row,
            cells: row.cells.filter((_, index) => index !== columnIndex)
        }));

        setRecordDetailTemplate({
            ...recordDetailTemplate,
            tableRows: updatedRows
        });
    };

    const handleCellChange = (rowId, cellId, newContent) => {
        const updatedRows = tableRows.map(row => {
            if (row.id === rowId) {
                return {
                    ...row,
                    cells: row.cells.map(cell =>
                        cell.id === cellId ? { ...cell, content: newContent } : cell
                    )
                };
            }
            return row;
        });

        setRecordDetailTemplate({
            ...recordDetailTemplate,
            tableRows: updatedRows
        });
    };

    const modules = React.useMemo(() => ({
        toolbar: {
            container: [
                ["bold", "italic", "underline"],
                [{ "header": [1, 2, 3] }],
                [{ "list": "ordered" }, { "list": "bullet" }],
                ["link"],
                ["clean"]
            ]
        }
    }), []);

    const formats = [
        "bold", "italic", "underline",
        "header",
        "list",
        "link"
    ];

    return (
        <div className="mb-4 mt-4 p-3 bg-gray-100 rounded border border-gray-300">
            <div className="mb-4">
                <strong className="text-xs text-gray-800">Record Detail Template</strong>
                <p className="text-gray-600 text-xs mt-1 mb-2">
                    Customize how individual records are displayed with a header section and attribute table
                </p>
            </div>

            {/* Header Section */}
            <div className="mb-4 p-3 bg-white rounded border border-gray-300">
                <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-800 mb-2">Header Section</h4>
                    <p className="text-gray-600 text-xs mb-2">
                        Customizable text that appears above the attribute table. Use placeholders like ${"{"} columnName {"}"}.
                    </p>
                </div>

                {/* Variable Insertion Dropdown */}
                <div className="mb-3">
                    <label className="text-xs text-gray-600 block mb-1.5 font-medium">
                        Insert Column Variable
                    </label>
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                insertHeaderVariable(e.target.value);
                                e.target.value = "";
                            }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Select a column to insert --</option>
                        {availableColumns.map((column) => (
                            <option key={column} value={column}>
                                {column}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Invalid Variables Warning */}
                {invalidVariables.length > 0 && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                        <strong>Invalid column references:</strong> {invalidVariables.join(", ")}
                    </div>
                )}

                {/* Rich Text Editor */}
                <div className="bg-white rounded border border-gray-300 overflow-hidden mb-3">
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={headerContent}
                        onChange={handleHeaderChange}
                        modules={modules}
                        formats={formats}
                        placeholder="Enter header text here..."
                        style={{
                            height: "150px",
                            fontSize: "12px"
                        }}
                    />
                </div>
            </div>

            {/* Attribute Table Section */}
            <div className="mb-4 p-3 bg-white rounded border border-gray-300">
                <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-800 mb-2">Attribute Table</h4>
                    <p className="text-gray-600 text-xs mb-3">
                        Create a customizable table with rows and columns. Use text, variables ${"{"} columnName {"}"}, or mix both.
                    </p>
                </div>

                {/* Invalid Variables Warning for Table */}
                {invalidTableVariables.length > 0 && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                        <strong>Invalid column references in table:</strong> {invalidTableVariables.join(", ")}
                    </div>
                )}

                {/* Add Row and Column Buttons */}
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={handleAddTableRow}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                    >
                        + Add Row
                    </button>
                    <button
                        onClick={handleAddTableColumn}
                        disabled={tableRows.length === 0}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                        + Add Column
                    </button>
                </div>

                {/* Table Preview and Editor */}
                {tableRows.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                            <tbody>
                                {tableRows.map((row, rowIndex) => (
                                    <tr key={row.id}>
                                        {row.cells.map((cell, cellIndex) => (
                                            <td
                                                key={cell.id}
                                                className="border border-gray-300 p-2 bg-gray-50 relative"
                                                style={{ position: 'relative' }}
                                            >
                                                <div
                                                    ref={(el) => {
                                                        if (el) {
                                                            cellRefs.current[cell.id] = el;
                                                            // Only update content if it changed externally
                                                            if (el.innerHTML !== cell.content) {
                                                                el.innerHTML = cell.content;
                                                            }
                                                        }
                                                    }}
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    className="outline-none min-h-8 p-1 text-xs whitespace-pre-wrap break-words pr-6"
                                                    onInput={(e) => {
                                                        handleCellChange(row.id, cell.id, e.currentTarget.innerHTML);
                                                    }}
                                                />
                                                {/* Remove column button - only show for first row */}
                                                {rowIndex === 0 && (
                                                    <button
                                                        onClick={() => handleRemoveTableColumn(cellIndex)}
                                                        className="absolute top-1 right-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition z-10"
                                                        title="Remove column"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </td>
                                        ))}
                                        {/* Remove row button */}
                                        <td className="border border-gray-300 p-2 bg-gray-50">
                                            <button
                                                onClick={() => handleRemoveTableRow(row.id)}
                                                className="flex items-center justify-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                                title="Delete row"
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-4 bg-gray-50 rounded text-xs text-gray-600 text-center">
                        No rows yet. Click "Add Row" to create the first row.
                    </div>
                )}
            </div>

            {/* Help Text */}
            <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 border border-gray-200">
                <strong>Tips:</strong>
                <ul className="list-disc list-inside mt-1">
                    <li>Use ${"{"} columnName {"}"} to insert column values</li>
                    <li>Use ${"{"} rowIndex {"}"} for the current row number (0-based)</li>
                    <li>Use ${"{"} letterIndex {"}"} for the current row letter (A, B, C, ...)</li>
                    <li>Mix text and variables freely in each cell</li>
                    <li>Available columns: {availableColumns.join(", ") || "None"}</li>
                </ul>
            </div>
        </div>
    );
};

export default RecordDetailTemplate;
