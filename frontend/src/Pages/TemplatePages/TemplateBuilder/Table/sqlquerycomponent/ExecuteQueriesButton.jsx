import React, { useState } from "react";
import { executeAlaSQLQueries } from "./alasqlUtils";

const ExecuteQueriesButton = ({ sqlSettings, mockDataMap, setAvailableColumns }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const handleExecuteQueries = () => {
        setLoading(true);
        setResult(null);

        try {
            const executionResult = executeAlaSQLQueries(sqlSettings, mockDataMap);
            setResult(executionResult);

            // Extract column names from the final result and update available columns
            if (executionResult.success && executionResult.finalResult && executionResult.finalResult.length > 0) {
                const columnNames = Object.keys(executionResult.finalResult[0]);
                setAvailableColumns(columnNames);
            }
        } catch (err) {
            setResult({
                success: false,
                error: err.message,
                errors: [err.message],
                executedQueries: []
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-4 p-3 bg-white rounded border border-gray-300">
            <div className="mb-3 flex justify-between items-center">
                <div>
                    <h4 className="text-xs font-semibold text-gray-800 mb-1">Execute Queries</h4>
                    <p className="text-gray-600 text-xs">
                        Run all queries against mock data and temporary tables
                    </p>
                </div>
                <button
                    onClick={handleExecuteQueries}
                    disabled={loading || !sqlSettings?.queries?.length}
                    className="px-4 py-2 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors disabled:bg-gray-400"
                >
                    {loading ? "Executing..." : "Execute Queries"}
                </button>
            </div>

            {result && (
                <div className={`p-3 rounded border ${result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`text-xs font-semibold ${result.success ? "text-green-800" : "text-red-800"}`}>
                                {result.success ? "✓ Queries Executed Successfully" : "✗ Execution Failed"}
                            </p>
                            {result.error && (
                                <p className={`text-xs mt-1 ${result.success ? "text-green-700" : "text-red-700"}`}>
                                    {result.error}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                        >
                            {showDetails ? "Hide" : "Show"} Details
                        </button>
                    </div>

                    {/* Display Final Result Table */}
                    {result.finalResult && result.finalResult.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-800 mb-2">Query Result ({result.finalResult.length} rows):</p>
                            <div className="overflow-x-auto border border-gray-300 rounded bg-white">
                                <table className="w-full border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-gray-300">
                                            {result.finalResult.length > 0 &&
                                                Object.keys(result.finalResult[0]).map((col) => (
                                                    <th
                                                        key={col}
                                                        className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 last:border-r-0"
                                                    >
                                                        {col}
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.finalResult.slice(0, 50).map((row, idx) => (
                                            <tr
                                                key={idx}
                                                className={`border-b border-gray-300 ${
                                                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                                }`}
                                            >
                                                {Object.keys(result.finalResult[0]).map((col) => (
                                                    <td
                                                        key={col}
                                                        className="px-3 py-2 text-gray-700 border-r border-gray-300 last:border-r-0 max-w-xs truncate"
                                                    >
                                                        {String(row[col] !== null && row[col] !== undefined ? row[col] : "")}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {result.finalResult.length > 50 && (
                                <p className="text-xs text-gray-600 mt-2">
                                    Showing 50 of {result.finalResult.length} rows
                                </p>
                            )}
                        </div>
                    )}

                    {showDetails && (
                        <div className="mt-3 space-y-2">
                            {/* Executed Queries */}
                            {result.executedQueries.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-800 mb-2">Executed Queries:</p>
                                    <div className="space-y-1 bg-white p-2 rounded border border-gray-200 max-h-48 overflow-y-auto">
                                        {result.executedQueries.map((queryInfo, idx) => (
                                            <div key={idx} className="text-xs text-gray-700 pb-2 border-b border-gray-100 last:border-b-0">
                                                <p className="font-semibold">
                                                    {queryInfo.type} {queryInfo.success ? "✓" : "✗"}
                                                </p>
                                                {queryInfo.query && (
                                                    <p className="text-gray-600 font-mono text-xs break-words">
                                                        {queryInfo.query.substring(0, 100)}
                                                        {queryInfo.query.length > 100 ? "..." : ""}
                                                    </p>
                                                )}
                                                {queryInfo.dataSource && (
                                                    <p className="text-gray-600">
                                                        From: {queryInfo.dataSource} ({queryInfo.rowsLoaded} rows)
                                                    </p>
                                                )}
                                                {queryInfo.note && (
                                                    <p className="text-gray-600">Note: {queryInfo.note}</p>
                                                )}
                                                {queryInfo.error && (
                                                    <p className="text-red-600">Error: {queryInfo.error}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Errors */}
                            {result.errors.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-red-800 mb-2">Errors:</p>
                                    <div className="space-y-1 bg-red-100 p-2 rounded border border-red-200 max-h-24 overflow-y-auto">
                                        {result.errors.map((error, idx) => (
                                            <p key={idx} className="text-xs text-red-700">
                                                • {error}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {!sqlSettings?.queries?.length && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                    No queries configured. Add queries to execute.
                </div>
            )}
        </div>
    );
};

export default ExecuteQueriesButton;
