import React, { useState, useEffect } from "react";
import { useTemplateBuilder } from "../../TemplateBuilderContext";
import MockDataTable from "./MockDataTable";
import SQLQueryEditor from "./SQLQueryEditor";
import QueryResultsTable from "./QueryResultsTable";
import CustomTableTemplate from "./CustomTableTemplate";
import ColumnDataTypeConfig from "./ColumnDataTypeConfig";
import AdditionalTablesManager from "./AdditionalTablesManager";
import { ErrorMessage, InfoMessage } from "./MessageComponents";
import { initializeAlaSQL, executeAlaSQL } from "./alasqlUtils";
import { generateMockData } from "./mockDataUtils";

// Initialize AlaSQL custom functions
initializeAlaSQL();

const SQLQueryComponent = ({ dataSource, sqlSettings, setSqlSettings, filterSettings, attributeKeys = {} }) => {
    const { sectionsMap } = useTemplateBuilder();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [mockDataRowCount, setMockDataRowCount] = useState(null); // null = auto-generate
    const [columnDataTypes, setColumnDataTypes] = useState({}); // Track data types per column

    // Load mock data on mount or when dataSource changes
    useEffect(() => {
        try {
            setLoading(true);
            setError(null);

            if (!dataSource || !sectionsMap) {
                setData(null);
                return;
            }

            // Get section from sectionsMap
            const section = sectionsMap[dataSource];
            if (!section) {
                setError(`Section "${dataSource}" not found`);
                setData(null);
                return;
            }

            // Generate mock data based on section attributes using attributeKeys
            const mockTableData = generateMockData(section, attributeKeys, undefined, mockDataRowCount, columnDataTypes);

            if (mockTableData.length > 0) {
                setData(mockTableData);
                setError(null);
                console.log(`Generated ${mockTableData.length} mock rows for datasource: ${dataSource}`);
            } else {
                setError("Could not generate mock data for this section");
                setData(null);
            }
        } catch (err) {
            setError(`Error generating mock data: ${err.message}`);
            console.error("Error generating mock data:", err);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [dataSource, sectionsMap, attributeKeys, mockDataRowCount, columnDataTypes]);

    // Execute SQL query
    const executeQuery = () => {
        if (!sqlSettings?.query || !sqlSettings.query.trim()) {
            setError("No query to execute");
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
            console.log("data querying:", data)
            const result = executeAlaSQL(sqlSettings.query, data);

            if (result.success) {
                setResults({
                    columns: result.columns,
                    rows: result.rows
                });
            } else {
                setError(`Query error: ${result.error}`);
                setResults(null);
            }
        } catch (err) {
            setError(`Query error: ${err.message}`);
            console.error("Query error:", err);
            setResults(null);
        } finally {
            setLoading(false);
        }
    };

    // Handle keyboard shortcuts in query editor
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
            executeQuery();
        }
    };

    // Update query in settings
    const handleCustomQueryChange = (e) => {
        const newQuery = e.target.value;
        setSqlSettings({
            ...sqlSettings,
            query: newQuery,
        });
    };

    // Clear results when data changes
    const handleDataChange = (newData) => {
        setData(newData);
        setResults(null);
    };

    return (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="mb-3">
                <strong className="text-sm text-gray-800">SQL Query</strong>
                <p className="text-gray-600 text-xs mt-2 mb-3 font-medium">
                    View and customize the SQL query generated from filters and aggregations
                </p>
            </div>

            <div className="p-3 bg-white rounded-md">
                {/* Mock Data Row Count Control */}
                {data && (
                    <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mock Data Rows:
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={mockDataRowCount || ""}
                                onChange={(e) => {
                                    const val = e.target.value === "" ? null : Math.max(1, parseInt(e.target.value, 10));
                                    setMockDataRowCount(val);
                                }}
                                placeholder="Auto-generate"
                                className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-600">
                                {mockDataRowCount === null ? "(Auto-generate based on data)" : `${mockDataRowCount} row${mockDataRowCount === 1 ? "" : "s"}`}
                            </span>
                            {mockDataRowCount !== null && (
                                <button
                                    onClick={() => setMockDataRowCount(null)}
                                    className="px-3 py-1.5 bg-gray-400 text-white rounded text-xs font-medium hover:bg-gray-500 transition-colors"
                                >
                                    Reset to Auto
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Column Data Type Configuration */}
                {data && (
                    <ColumnDataTypeConfig
                        attributeKeys={attributeKeys}
                        dataSource={dataSource}
                        columnDataTypes={columnDataTypes}
                        setColumnDataTypes={setColumnDataTypes}
                    />
                )}

                {/* Mock Data Editor */}
                {data && (
                    <MockDataTable
                        data={data}
                        setData={handleDataChange}
                        attributeKeys={attributeKeys}
                        dataSource={dataSource}
                    />
                )}

                {/* Additional Tables Manager */}
                <AdditionalTablesManager
                    additionalDataSources={sqlSettings?.additionalDataSources || []}
                    setAdditionalDataSources={(newTables) => {
                        setSqlSettings({
                            ...sqlSettings,
                            additionalDataSources: newTables
                        });
                    }}
                />

                {/* SQL Query Editor */}
                <SQLQueryEditor
                    query={sqlSettings?.query}
                    onQueryChange={handleCustomQueryChange}
                    onExecute={executeQuery}
                    loading={loading}
                    onKeyPress={handleKeyPress}
                />

                {/* Error Message */}
                <ErrorMessage error={error} />

                {/* Results Table */}
                <QueryResultsTable results={results} loading={loading} />

                {/* Info Message */}
                {!results && !error && data && (
                    <InfoMessage
                        message={`Loaded ${data.length} record(s). Click "Execute Query" to run the query.`}
                        type="success"
                    />
                )}

                {/* Column Text Template Editor - Always Display */}
                <CustomTableTemplate
                    sqlSettings={sqlSettings}
                    setSqlSettings={setSqlSettings}
                    availableColumns={results?.columns || []}
                />
            </div>
        </div>
    );
};

export default SQLQueryComponent;
