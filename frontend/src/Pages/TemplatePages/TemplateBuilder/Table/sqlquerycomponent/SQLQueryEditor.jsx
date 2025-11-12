import React from "react";

const SQLQueryEditor = ({ query, onQueryChange, onExecute, loading, onKeyPress }) => {
    return (
        <div className="mb-3">
            <label className="text-xs text-gray-600 block mb-1 font-medium">
                SQL Query <span style={{ color: "red", fontWeight: "bold" }}>(Warning: Renaming columns here will cause data to be mapped incorrectly. Only rename columns if you are using a custom table template)</span>
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
                    className={`px-4 py-2 text-white border-0 rounded text-xs font-medium cursor-pointer transition-colors ${
                        loading
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
