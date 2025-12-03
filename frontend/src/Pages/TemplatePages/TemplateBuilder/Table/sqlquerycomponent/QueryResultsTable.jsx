import React from "react";

const QueryResultsTable = ({ results, loading }) => {
    if (!results) return null;

    if (!Array.isArray(results?.rows) || results.rows.length === 0) {
        return (
            <div className="p-4 my-4 bg-red-100 text-red-700 border border-red-700 rounded-lg text-center font-bold">
                Query does not return a table
            </div>
        );
    }

    return (
        <div className="mt-3">
            <div className="mb-2">
                <strong className="text-xs text-gray-800">
                    Results ({results.rows.length} rows)
                </strong>
            </div>
            <div className="overflow-x-auto rounded bg-gray-50">
                <table className="w-full border-collapse text-xs border border-gray-300">
                    <thead>
                        <tr className="bg-blue-50 border-b border-gray-300">
                            {results.columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`px-3 py-2 text-left font-semibold text-blue-700 ${idx < results.columns.length - 1 ? "border-r border-gray-300" : ""
                                        }`}
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
                                    className="px-3 py-2 text-center text-gray-500"
                                >
                                    No results
                                </td>
                            </tr>
                        ) : (
                            results.rows.map((row, rowIdx) => (
                                <tr
                                    key={rowIdx}
                                    className={`border-b border-gray-300 ${rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        }`}
                                >
                                    {results.columns.map((col, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className={`px-3 py-2 text-gray-800 ${colIdx < results.columns.length - 1 ? "border-r border-gray-300" : ""
                                                }`}
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
    );
};

export default QueryResultsTable;
