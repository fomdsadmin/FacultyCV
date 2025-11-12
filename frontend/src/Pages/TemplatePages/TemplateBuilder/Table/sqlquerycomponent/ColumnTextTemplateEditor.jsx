import React, { useEffect, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

// Create a custom Block class to use div instead of p
const CustomBlock = Quill.import('blots/block');
class DivBlock extends CustomBlock {}
DivBlock.tagName = 'div';

// Register the custom div block
Quill.register({ 'formats/divblock': DivBlock }, true);

const ColumnTextTemplateEditor = ({
    template = "",
    onTemplateChange,
    availableColumns = [],
    previousColumns = []
}) => {
    const quillRef = useRef(null);
    const [invalidVariables, setInvalidVariables] = useState([]);

    // Detect invalid variables when columns change
    useEffect(() => {
        if (template && availableColumns.length > 0) {
            const variableRegex = /\$\{([^}]+)\}/g;
            const matches = [...template.matchAll(variableRegex)];
            const invalid = [];

            matches.forEach((match) => {
                const variableName = match[1];
                if (!availableColumns.includes(variableName)) {
                    invalid.push(variableName);
                }
            });

            setInvalidVariables(invalid);
        } else {
            setInvalidVariables([]);
        }
    }, [template, availableColumns]);

    const handleQuillChange = (content) => {
        onTemplateChange(content);
    };

    const insertVariable = (columnName) => {
        if (!quillRef.current) return;

        const editor = quillRef.current.getEditor();
        const cursorPosition = editor.getSelection()?.index || editor.getLength();

        // Insert variable at cursor position with ${} syntax
        const variableText = `\${${columnName}}`;
        editor.insertText(cursorPosition, variableText);

        // Move cursor after the inserted variable
        editor.setSelection(cursorPosition + variableText.length);
        editor.focus();
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
        "link",
        "divblock"
    ];

    return (
        <div className="mb-4 mt-4 p-3 bg-gray-100 rounded border border-gray-300">
            <div className="mb-3">
                <strong className="text-xs text-gray-800">Column Text Template</strong>
                <p className="text-gray-600 text-xs mt-1 mb-2">
                    Customize the text displayed for each row using SQL result columns
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
                            insertVariable(e.target.value);
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
                    value={template}
                    onChange={handleQuillChange}
                    modules={modules}
                    formats={formats}
                    placeholder="Enter your template text here..."
                    style={{
                        height: "200px",
                        fontSize: "12px"
                    }}
                />
            </div>

            {/* Help Text */}
            <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 border border-gray-200">
                <strong>Usage:</strong> Use <code>${"{"} columnName {"}"}</code> syntax to insert column values. Available columns: {availableColumns.join(", ") || "None"}
            </div>
        </div>
    );
};

export default ColumnTextTemplateEditor;
