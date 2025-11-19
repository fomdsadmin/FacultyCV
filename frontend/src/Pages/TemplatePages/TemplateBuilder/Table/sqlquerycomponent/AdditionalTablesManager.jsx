import React, { useState } from "react";
import { useTemplateBuilder } from "../../TemplateBuilderContext";
import { FiTrash2 } from "react-icons/fi";

const AdditionalTablesManager = ({ additionalDataSources = [], setAdditionalDataSources }) => {
    const { sectionsMap } = useTemplateBuilder();
    const dataSources = sectionsMap ? Object.keys(sectionsMap) : [];
    const [selectedDataSource, setSelectedDataSource] = useState("");
    const [tableName, setTableName] = useState("");
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    const filteredSources = dataSources.filter((source) =>
        source.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddTable = () => {
        // Validation
        if (!selectedDataSource.trim()) {
            setError("Please select a data source");
            return;
        }

        if (!tableName.trim()) {
            setError("Please enter a table name");
            return;
        }

        // Check for duplicate table names
        if (additionalDataSources.some((table) => table.tableName === tableName)) {
            setError("Table name already exists");
            return;
        }

        // Add new table
        setAdditionalDataSources([
            ...additionalDataSources,
            {
                dataSource: selectedDataSource,
                tableName: tableName
            }
        ]);

        // Reset form
        setSelectedDataSource("");
        setTableName("");
        setError("");
        setSearchTerm("");
        setShowSearch(false);
    };

    const handleRemoveTable = (tableName) => {
        setAdditionalDataSources(
            additionalDataSources.filter((table) => table.tableName !== tableName)
        );
    };

    return (
        <div className="mb-4 p-3 bg-white rounded border border-gray-300">
            <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-800 mb-2">Additional Tables</h4>
                <p className="text-gray-600 text-xs mb-3">
                    Add additional data sources to join with your main query. Reference them in your SQL query using the table name you specify.
                </p>
            </div>

            {/* Add Table Form */}
            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                        Select Data Source
                    </label>

                    {!showSearch ? (
                        <button
                            onClick={() => setShowSearch(true)}
                            className="w-full px-3 py-2 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors"
                        >
                            Choose Data Source
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search data sources..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 px-3 py-2 border-2 border-blue-500 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    setShowSearch(false);
                                    setSearchTerm("");
                                }}
                                className="px-3 py-2 bg-gray-400 text-white rounded text-xs font-medium hover:bg-gray-500 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {showSearch && filteredSources.length > 0 && (
                        <div className="mt-2 border border-gray-300 rounded bg-white max-h-40 overflow-y-auto">
                            {filteredSources.map((source) => (
                                <div
                                    key={source}
                                    onClick={() => {
                                        setSelectedDataSource(source);
                                        setSearchTerm("");
                                        setShowSearch(false);
                                    }}
                                    className="px-3 py-2 text-xs text-gray-800 hover:bg-blue-100 cursor-pointer transition-colors"
                                >
                                    {source}
                                </div>
                            ))}
                        </div>
                    )}

                    {showSearch && filteredSources.length === 0 && (
                        <div className="mt-2 px-3 py-2 text-xs text-gray-500 text-center">
                            No data sources found
                        </div>
                    )}

                    {selectedDataSource && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                            Selected: <strong>{selectedDataSource}</strong>
                        </div>
                    )}
                </div>

                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                        Table Name (for SQL queries)
                    </label>
                    <input
                        type="text"
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                        placeholder="e.g., grants, awards, publications"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {error && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleAddTable}
                    className="w-full px-3 py-2 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors"
                >
                    + Add Table
                </button>
            </div>

            {/* Additional Tables List */}
            {additionalDataSources.length > 0 ? (
                <div className="space-y-2">
                    {additionalDataSources.map((table, index) => (
                        <div
                            key={`${table.tableName}-${index}`}
                            className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded"
                        >
                            <div className="text-xs">
                                <div className="font-medium text-gray-800">
                                    {table.tableName}
                                </div>
                                <div className="text-gray-600">
                                    → {table.dataSource}
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveTable(table.tableName)}
                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center justify-center"
                                title="Remove table"
                            >
                                <FiTrash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-3 bg-gray-50 rounded text-xs text-gray-600 text-center">
                    No additional tables added yet
                </div>
            )}
        </div>
    );
};

export default AdditionalTablesManager;
