import React from "react";

const QueryResultsTable = ({ results, loading }) => {
    if (!results) return null;

    return (
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
    );
};

export default QueryResultsTable;
