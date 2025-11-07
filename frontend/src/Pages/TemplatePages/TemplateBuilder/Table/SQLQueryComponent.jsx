import React, { useState, useEffect } from "react";
import alasql from "alasql";
import { getUserCVData } from "graphql/graphqlHelpers";

const SQLQueryComponent = ({ dataSource }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    // Load data from datasource on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Mock section ID - will be determined later
                const mockSectionId = "f26d9944-42e9-4feb-aca4-24aa3330b5ba";
                const userId = "92";
                
                // Fetch CV data for the datasource
                const cvData = await getUserCVData(userId, [mockSectionId]);
                
                if (cvData && cvData.length > 0) {
                    // Parse the data_details JSON string
                    const parsedData = cvData.map(item => ({
                        ...item,
                        data_details: typeof item.data_details === 'string' 
                            ? JSON.parse(item.data_details) 
                            : item.data_details
                    }));
                    setData(parsedData);
                    setError(null);
                } else {
                    setError("No data found for this datasource");
                }
            } catch (err) {
                setError(`Error loading data: ${err.message}`);
                console.error("Error loading CV data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (dataSource) {
            loadData();
        }
    }, [dataSource]);

    const executeQuery = async () => {
        if (!query.trim()) {
            setError("Please enter a SQL query");
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
            // The ? placeholder is replaced with the data array
            const res = alasql(query, [data]);

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

    return (
        <div style={{ marginTop: 16, padding: "12px", backgroundColor: "#f9f9f9", borderRadius: 6 }}>
            <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 13, color: "#333" }}>SQL Query</strong>
                <p style={{ color: "#666", fontSize: 12, marginTop: 8, marginBottom: 12, fontWeight: 500 }}>
                    Execute SQL queries on the datasource using AlaSQL
                </p>
            </div>

            <div style={{ padding: "12px", backgroundColor: "white", borderRadius: 4 }}>
                {/* Query Input */}
                <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 500 }}>
                        SQL Query (Ctrl+Enter to execute)
                    </label>
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="SELECT * FROM ? LIMIT 10"
                        style={{
                            width: "100%",
                            minHeight: "120px",
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
                        Loaded {data.length} record(s). Write a query and click "Execute Query" or press Ctrl+Enter.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SQLQueryComponent;
