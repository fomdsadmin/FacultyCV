import React from "react";

const SQLQueryEditor = ({ query, onQueryChange, onExecute, loading, onKeyPress }) => {
    return (
        <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 500 }}>
                SQL Query
            </label>
            <textarea
                value={query || ""}
                onChange={onQueryChange}
                onKeyPress={onKeyPress}
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

            {/* Execute Button */}
            <div style={{ marginTop: 12 }}>
                <button
                    onClick={onExecute}
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
        </div>
    );
};

export default SQLQueryEditor;
