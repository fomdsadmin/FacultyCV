import React, { useState, useEffect } from "react";
import { useTemplateBuilder } from "../../TemplateBuilderContext";
import MockDataTable from "./MockDataTable";
import SQLQueryEditor from "./SQLQueryEditor";
import QueryResultsTable from "./QueryResultsTable";
import ColumnTextTemplateEditor from "./ColumnTextTemplateEditor";
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
            const mockTableData = generateMockData(section, attributeKeys);

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
    }, [dataSource, sectionsMap, attributeKeys]);

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

    // Update column text template
    const handleColumnTextTemplateChange = (html) => {
        setSqlSettings({
            ...sqlSettings,
            columnTextTemplate: html,
        });
    };

    return (
        <div style={{ marginTop: 16, padding: "12px", backgroundColor: "#f9f9f9", borderRadius: 6 }}>
            <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 13, color: "#333" }}>SQL Query</strong>
                <p style={{ color: "#666", fontSize: 12, marginTop: 8, marginBottom: 12, fontWeight: 500 }}>
                    View and customize the SQL query generated from filters and aggregations
                </p>
            </div>

            <div style={{ padding: "12px", backgroundColor: "white", borderRadius: 4 }}>
                {/* Mock Data Editor */}
                {data && (
                    <MockDataTable
                        data={data}
                        setData={handleDataChange}
                        attributeKeys={attributeKeys}
                        dataSource={dataSource}
                    />
                )}

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

                {/* Column Text Template Editor - Always Display */}
                <ColumnTextTemplateEditor
                    template={sqlSettings?.columnTextTemplate || ""}
                    onTemplateChange={handleColumnTextTemplateChange}
                    availableColumns={results?.columns || []}
                    previousColumns={[]}
                />

                {/* Info Message */}
                {!results && !error && data && (
                    <InfoMessage
                        message={`Loaded ${data.length} record(s). Click "Execute Query" to run the query.`}
                        type="success"
                    />
                )}
            </div>
        </div>
    );
};

export default SQLQueryComponent;
