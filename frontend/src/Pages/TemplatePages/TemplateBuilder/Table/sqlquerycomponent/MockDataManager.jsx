import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import MockDataEditor from "./MockDataEditor";

const MockDataManager = ({ mockDataMap, setMockDataMap, dataSources = [] }) => {
    const [selectedTableName, setSelectedTableName] = useState(null);
    const hasInitializedRef = useRef(false);

    // Use stringified version of dataSources to track changes without full object comparison
    const dataSourcesKey = useMemo(() => JSON.stringify(dataSources), [dataSources]);

    // Initialize selectedTableName when dataSources changes
    // Using dataSourcesKey (stringified) as the dependency to detect structural changes
    // Using ref to prevent infinite loops while still reading current dataSources
    useEffect(() => {
        if (dataSources.length > 0 && !hasInitializedRef.current) {
            setSelectedTableName(dataSources[0].tableName);
            hasInitializedRef.current = true;
        } else if (dataSources.length === 0) {
            setSelectedTableName(null);
            hasInitializedRef.current = false;
        }
    }, [dataSourcesKey, dataSources]);

    // Create a mapping of tableName to dataSource for quick lookup
    const tableToDataSourceMap = useMemo(() => {
        const map = {};
        dataSources.forEach(({ dataSource, tableName }) => {
            map[tableName] = dataSource;
        });
        return map;
    }, [dataSources]);

    // Get the current selected dataSource
    const currentDataSource = tableToDataSourceMap[selectedTableName] || null;

    // Create setter function for the current editor
    const getSetterForMockDataEditor = useCallback((tableName) => {
        return (data) => {
            setMockDataMap(prev => ({
                ...prev,
                [tableName]: data,
            }));
        };
    }, [setMockDataMap]);

    if (dataSources.length === 0) {
        return (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-700">
                    No data sources configured. Add data sources to preview mock data.
                </p>
            </div>
        );
    }

    return (
        <div className="mb-4 p-3 bg-white rounded border border-gray-300">
            <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-800 mb-2">Mock Data Manager</h4>
                <p className="text-gray-600 text-xs mb-3">
                    Select a table to edit mock data for each data source
                </p>
            </div>

            {/* Table Selection Dropdown */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                    Select Table to Edit
                </label>
                <select
                    value={selectedTableName || ""}
                    onChange={(e) => setSelectedTableName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {dataSources.map(({ tableName, dataSource }) => (
                        <option key={tableName} value={tableName}>
                            {tableName} (from {dataSource})
                        </option>
                    ))}
                </select>
            </div>

            {/* Mock Data Editor for Selected Table */}
            {selectedTableName && currentDataSource && (
                <MockDataEditor
                    dataSource={currentDataSource}
                    tableName={selectedTableName}
                    mockData={mockDataMap[selectedTableName] || []}
                    setMockData={getSetterForMockDataEditor(selectedTableName)}
                />
            )}
        </div>
    );
};

export default MockDataManager;
