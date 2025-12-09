import React, { useEffect, useState } from "react";

const PLACEHOLDER_TEXT = "Enter HTML template with variables like: <div><h3>[DOLLAR]{column_name}[/DOLLAR]</h3></div>".replace(/\[DOLLAR\]/g, "$").replace(/\[\/DOLLAR\]/g, "");

const HtmlTemplateEditor = ({
    htmlTemplate = "",
    setHtmlTemplate,
    availableColumns = [],
}) => {
    const [invalidVariables, setInvalidVariables] = useState([]);

    // Detect invalid variables when columns or template change
    useEffect(() => {
        if (htmlTemplate && availableColumns.length > 0) {
            const variableRegex = /\$\{([^}]+)\}/g;
            const matches = [...htmlTemplate.matchAll(variableRegex)];
            const invalid = [];

            matches.forEach((match) => {
                const variableName = match[1];
                if (!availableColumns.includes(variableName) && !["rowIndex", "letterIndex"].includes(variableName)) {
                    invalid.push(variableName);
                }
            });

            // Remove duplicates
            setInvalidVariables([...new Set(invalid)]);
        } else {
            setInvalidVariables([]);
        }
    }, [htmlTemplate, availableColumns]);

    const insertVariable = (columnName) => {
        const textarea = document.getElementById("html-template-textarea");
        if (!textarea) return;

        const cursorPosition = textarea.selectionStart;
        const beforeCursor = htmlTemplate.substring(0, cursorPosition);
        const afterCursor = htmlTemplate.substring(cursorPosition);
        const variableText = `\${${columnName}}`;

        const newTemplate = beforeCursor + variableText + afterCursor;
        setHtmlTemplate(newTemplate);

        // Move cursor after the inserted variable
        setTimeout(() => {
            textarea.selectionStart = cursorPosition + variableText.length;
            textarea.selectionEnd = cursorPosition + variableText.length;
            textarea.focus();
        }, 0);
    };

    return (
        <div className="mb-4 mt-4 p-3 bg-gray-100 rounded border border-gray-300">
            <div className="mb-3">
                <strong className="text-xs text-gray-800">HTML Template</strong>
                <p className="text-gray-600 text-xs mt-1 mb-2">
                    Write custom HTML that will be repeated for each row. Use column variables to display data from each row.
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

            {/* HTML Code Editor */}
            <div className="bg-white rounded border border-gray-300 overflow-hidden mb-3">
                <textarea
                    id="html-template-textarea"
                    value={htmlTemplate}
                    onChange={(e) => setHtmlTemplate(e.target.value)}
                    placeholder={PLACEHOLDER_TEXT}
                    className="w-full p-3 font-mono text-xs border-0 resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                        minHeight: "250px",
                        fontFamily: "monospace",
                        lineHeight: "1.5"
                    }}
                />
            </div>

            {/* Help Text */}
            <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 border border-gray-200">
                <strong>Usage:</strong> Write HTML code that will be repeated for each row. Use <code>${"{"} columnName {"}"}</code> to insert column values.
                <br />
                <strong>Example:</strong> <code>&lt;div class='card'&gt;&lt;h3&gt;${"{Name}"}&lt;/h3&gt;&lt;p&gt;${"{Description}"}&lt;/p&gt;&lt;/div&gt;</code>
                <br />
                <strong>Available columns:</strong> {availableColumns.length > 0 ? availableColumns.join(", ") : "None"}
            </div>
        </div>
    );
};

export default HtmlTemplateEditor;
