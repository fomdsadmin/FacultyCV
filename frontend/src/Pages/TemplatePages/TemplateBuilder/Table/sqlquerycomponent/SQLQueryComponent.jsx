import React, { useState, useEffect } from "react";
import MockDataManager from "./MockDataManager";
import SQLQueryManager from "./SQLQueryManager";
import CustomTableTemplate from "./CustomTableTemplate";
import ExecuteQueriesButton from "./ExecuteQueriesButton";
import { initializeAlaSQL } from "./alasqlUtils";
import { generateMockData } from "./mockDataUtils";
import { useTemplateBuilder } from "../../TemplateBuilderContext";

// Initialize AlaSQL custom functions
initializeAlaSQL();
const SQLQueryComponent = ({ sqlSettings, setSqlSettings }) => {
    const { sectionsMap } = useTemplateBuilder();
    const [mockDataMap, setMockDataMap] = useState({});

    // Generate initial mock data for all tables
    useEffect(() => {
        const dataSources = sqlSettings?.dataSources || [];

        if (dataSources.length === 0) {
            setMockDataMap({});
            return;
        }

        const newMockDataMap = {};

        dataSources.forEach(({ dataSource, tableName }) => {
            const section = sectionsMap?.[dataSource];
            if (!section) return;

            const attributeKeys = section.attributeKeys || {};

            // Generate mock data for this table
            const mockData = generateMockData(section, attributeKeys, null, {});
            newMockDataMap[tableName] = mockData;
        });

        setMockDataMap(newMockDataMap);
    }, [sqlSettings?.dataSources, sectionsMap]);

    return (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="mb-3">
                <strong className="text-sm text-gray-800">SQL Query</strong>
                <p className="text-gray-600 text-xs mt-2 mb-3 font-medium">
                    View and customize the SQL query generated from filters and aggregations
                </p>
            </div>

            <div className="p-3 bg-white rounded-md">
                {/* Mock Data Manager - Handles all data sources */}
                <MockDataManager
                    mockDataMap={mockDataMap}
                    setMockDataMap={setMockDataMap}
                    dataSources={sqlSettings?.dataSources}
                />

                {/* SQL Query Manager - Additional Queries */}
                <SQLQueryManager
                    sqlSettings={sqlSettings}
                    setSqlSettings={setSqlSettings}
                />

                {/* Execute Queries Button */}
                <ExecuteQueriesButton
                    sqlSettings={sqlSettings}
                    mockDataMap={mockDataMap}
                />

                {/* Column Text Template Editor - Always Display */}
                <CustomTableTemplate
                    sqlSettings={sqlSettings}
                    setSqlSettings={setSqlSettings}
                    availableColumns={[]}
                />
            </div>
        </div>
    );
};

export default SQLQueryComponent;
