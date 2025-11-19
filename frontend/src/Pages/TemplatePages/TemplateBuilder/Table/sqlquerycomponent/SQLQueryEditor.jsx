import React, { useState } from "react";
import { customAlaSQLFunctionsMeta } from "./alasqlUtils";

const SQLQueryEditor = ({ query, onQueryChange, onExecute, loading, onKeyPress }) => {
    const [showFunctions, setShowFunctions] = useState(false);

    return (
        <div className="mb-3">
            {/* Custom AlaSQL Functions Expandable List */}
            <div className="mb-2">
                <button
                    type="button"
                    onClick={() => setShowFunctions((prev) => !prev)}
                    className="text-xs px-2 py-1 border border-blue-400 rounded bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200 hover:bg-blue-200 font-medium mb-1"
                    style={{ cursor: "pointer" }}
                >
                    {showFunctions ? "Hide" : "Show"} Custom SQL Functions
                </button>
                {showFunctions && (
                    <div className="p-3 border border-blue-200 rounded bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 text-xs mt-1">
                        <strong className="block mb-2 text-sm text-blue-700">Custom SQL Functions:</strong>
                        <ul style={{ marginTop: 6, paddingLeft: 0 }}>
                            {customAlaSQLFunctionsMeta.map((func, idx) => {
                                const instructionParts = func.instructions.split('→');
                                let signature = instructionParts[0].trim();
                                const description = instructionParts[1]?.trim() || '';

                                // Detect FROM functions by checking if signature starts with params in curly braces
                                const isFromFunc = signature.match(/^[A-Z_]+\(\{.*\}\)$/);

                                if (isFromFunc) {
                                    // Extract function name and parameters
                                    const match = signature.match(/^([A-Z_]+)\(\{(.*)\}\)$/);
                                    if (match) {
                                        const funcName = match[1];
                                        const paramsStr = match[2];
                                        // Convert {table, column, delimiter} to {table: "...", column: "...", delimiter: "..."}
                                        const params = paramsStr
                                            .split(',')
                                            .map(p => p.trim())
                                            .filter(p => p)
                                            .map(p => `${p}: "..."`)
                                            .join(', ');

                                        signature = `${funcName}("alasql", {${params}})`;
                                    }
                                }

                                return (
                                    <li key={func.funcName + idx} style={{ marginBottom: 16, listStyle: 'none' }}>
                                        <div style={{ background: '#f6f8fa', borderRadius: 6, padding: '8px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                            <span style={{ fontWeight: 700, color: '#2d3748', fontSize: '13px' }}>{func.funcName}</span>
                                            <pre style={{ margin: '6px 0 8px', background: '#eef2f7', borderRadius: 4, padding: '6px', fontSize: '12px', color: '#3b4252', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{signature}</pre>
                                            {description && <span style={{ color: '#555', fontSize: '12px' }}>{description}</span>}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            <label className="text-xs text-gray-600 block mb-1 font-medium">
                SQL Query <span style={{ color: "red", fontWeight: "bold" }}>(Warning: Renaming columns here may cause data to be mapped incorrectly. All data are mapped to the column names of the resulting SQL query. Same goes for adding additional tables.)</span>
            </label>
            <textarea
                value={query || ""}
                onChange={onQueryChange}
                onKeyPress={onKeyPress}
                placeholder="SELECT * FROM ? WHERE condition"
                className="w-full min-h-24 p-3 border border-gray-300 rounded text-xs font-mono box-border resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Execute Button */}
            <div className="mt-3">
                <button
                    onClick={onExecute}
                    disabled={loading}
                    className={`px-4 py-2 text-white border-0 rounded text-xs font-medium cursor-pointer transition-colors ${loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600"
                        }`}
                >
                    {loading ? "Executing..." : "Execute Query"}
                </button>
            </div>
        </div>
    );
};

export default SQLQueryEditor;
