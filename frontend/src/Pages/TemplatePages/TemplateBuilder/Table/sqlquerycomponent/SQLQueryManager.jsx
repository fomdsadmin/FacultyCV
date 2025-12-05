import React, { useState } from "react";
import { FiTrash2, FiEdit2, FiPlus } from "react-icons/fi";
import { customAlaSQLFunctionsMeta } from "./alasqlUtils";

const SQLQueryManager = ({ sqlSettings = {}, setSqlSettings }) => {
    const [editingQueryId, setEditingQueryId] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newQueryContent, setNewQueryContent] = useState("");
    const [newQueryNote, setNewQueryNote] = useState("");
    const [error, setError] = useState("");
    const [showFunctions, setShowFunctions] = useState(false);

    const queries = sqlSettings?.queries || [];

    const handleAddQuery = () => {
        // Validation
        if (!newQueryContent.trim()) {
            setError("Please enter a query");
            return;
        }

        // Add new query
        const newQuery = {
            id: Date.now().toString(),
            query: newQueryContent.trim(),
            note: newQueryNote.trim()
        };

        const updatedQueries = [...queries, newQuery];

        setSqlSettings({
            ...sqlSettings,
            queries: updatedQueries
        });

        // Reset form
        setNewQueryContent("");
        setNewQueryNote("");
        setError("");
        setShowAddForm(false);
    };

    const handleUpdateQuery = (queryId, field, value) => {
        const updatedQueries = queries.map((q, idx) => {
            if (q.id === queryId || (q.id === undefined && idx === parseInt(queryId))) {
                return { ...q, [field]: value };
            }
            return q;
        });

        setSqlSettings({
            ...sqlSettings,
            queries: updatedQueries
        });
    };

    const handleDeleteQuery = (queryId) => {
        const updatedQueries = queries.filter((q, idx) => {
            return q.id !== queryId && (q.id !== undefined || idx !== parseInt(queryId));
        });

        setSqlSettings({
            ...sqlSettings,
            queries: updatedQueries
        });

        if (editingQueryId === queryId) {
            setEditingQueryId(null);
        }
    };


    return (
        <div className="mb-4 p-3 bg-white rounded border border-gray-300">
            <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-800 mb-2">SQL Queries</h4>
                <p className="text-gray-600 text-xs mb-3">
                    Add custom SQL queries to run against your data
                </p>
            </div>

            {/* Custom Functions Reference */}
            <div className="mb-3">
                <button
                    type="button"
                    onClick={() => setShowFunctions((prev) => !prev)}
                    className="text-xs px-2 py-1 border border-blue-400 rounded bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200 hover:bg-blue-200 font-medium"
                    style={{ cursor: "pointer" }}
                >
                    {showFunctions ? "Hide" : "Show"} Custom SQL Functions
                </button>
                {showFunctions && (
                    <div className="p-3 border border-blue-200 rounded bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 text-xs mt-2">
                        <strong className="block mb-2 text-sm text-blue-700">Custom SQL Functions:</strong>
                        <ul style={{ marginTop: 6, paddingLeft: 0 }}>
                            {customAlaSQLFunctionsMeta.map((func, idx) => {
                                const instructionParts = func.instructions.split('→');
                                let signature = instructionParts[0].trim();
                                const description = instructionParts[1]?.trim() || '';

                                const isFromFunc = signature.match(/^[A-Z_]+\(\{.*\}\)$/);

                                if (isFromFunc) {
                                    const match = signature.match(/^([A-Z_]+)\(\{(.*)\}\)$/);
                                    if (match) {
                                        const funcName = match[1];
                                        const paramsStr = match[2];
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
                                    <li key={func.funcName + idx} style={{ marginBottom: 12, listStyle: 'none' }}>
                                        <div style={{ background: '#f6f8fa', borderRadius: 6, padding: '8px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                            <span style={{ fontWeight: 700, color: '#2d3748', fontSize: '13px' }}>{func.funcName}</span>
                                            <pre style={{ margin: '6px 0 8px', background: '#eef2f7', borderRadius: 4, padding: '6px', fontSize: '11px', color: '#3b4252', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{signature}</pre>
                                            {description && <span style={{ color: '#555', fontSize: '11px' }}>{description}</span>}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            {/* List of Queries */}
            {queries.length > 0 && (
                <div className="mb-4">
                    <div className="space-y-2">
                        {queries.map((query, idx) => {
                            const queryId = query.id !== undefined ? query.id : idx.toString();
                            return (
                                <div
                                    key={queryId}
                                    className="p-3 border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                                    onClick={(e) => {
                                        if (editingQueryId === queryId && e.target.closest('textarea, input') === null) {
                                            setEditingQueryId(null);
                                        }
                                    }}
                                >
                                    {editingQueryId === queryId ? (
                                        <div className="space-y-2">
                                            {/* Edit Mode */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Query Content
                                                </label>
                                                <textarea
                                                    value={query.query}
                                                    onChange={(e) =>
                                                        handleUpdateQuery(queryId, "query", e.target.value)
                                                    }
                                                    autoFocus
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical min-h-20"
                                                    placeholder="Enter SQL query..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Note (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={query.note || ""}
                                                    onChange={(e) =>
                                                        handleUpdateQuery(queryId, "note", e.target.value)
                                                    }
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="e.g., Description of this query"
                                                />
                                            </div>

                                            <button
                                                onClick={() => setEditingQueryId(null)}
                                                className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            {/* View Mode */}
                                            <div className="flex gap-1 mb-2">
                                                <button
                                                    onClick={() => setEditingQueryId(queryId)}
                                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                                    title="Edit query"
                                                >
                                                    <FiEdit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuery(queryId)}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                    title="Delete query"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                            {query.note &&
                                                <p className="text-xs text-gray-600 mb-2">{query.note}</p>
                                            }

                                            <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                                                <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-words">
                                                    {query.query}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Query Form */}
            <div className="mb-3">
                {!showAddForm ? (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full px-3 py-2 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <FiPlus size={14} />
                        Add Query
                    </button>
                ) : (
                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Query Content *
                            </label>
                            <textarea
                                value={newQueryContent}
                                onChange={(e) => {
                                    setNewQueryContent(e.target.value);
                                    setError("");
                                }}
                                placeholder="SELECT * FROM main WHERE condition"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-vertical min-h-20"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Note (Optional)
                            </label>
                            <input
                                type="text"
                                value={newQueryNote}
                                onChange={(e) => setNewQueryNote(e.target.value)}
                                placeholder="e.g., Description of this query"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {error && (
                            <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleAddQuery}
                                className="flex-1 px-3 py-2 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors"
                            >
                                Add Query
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewQueryContent("");
                                    setNewQueryNote("");
                                    setError("");
                                }}
                                className="flex-1 px-3 py-2 bg-gray-400 text-white rounded text-xs font-medium hover:bg-gray-500 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Message */}
            {queries.length === 0 && !showAddForm && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    No additional queries yet. Click "Add Query" to create one.
                </div>
            )}
        </div>
    );
};

export default SQLQueryManager;
