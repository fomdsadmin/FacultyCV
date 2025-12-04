import React, { useState } from "react";
import { useTemplateBuilder } from "../../TemplateBuilderContext";
import MockDataTable from "./MockDataTable";
import ColumnDataTypeConfig from "./ColumnDataTypeConfig";
import { generateMockData } from "./mockDataUtils";

const MockDataEditor = ({ mockData, setMockData, dataSource, tableName }) => {
    const { sectionsMap } = useTemplateBuilder();
    const [columnDataTypes, setColumnDataTypes] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get section and attributeKeys for the provided dataSource
    const section = sectionsMap?.[dataSource];
    const attributeKeys = section?.attributeKeys;

    const handleRegenerateMockData = () => {
        try {
            setLoading(true);
            setError(null);

            if (!section || !attributeKeys || Object.keys(attributeKeys).length === 0) {
                setError(`No data available for dataSource "${dataSource}"`);
                return;
            }

            // Generate mock data
            const generatedMockData = generateMockData(
                section,
                attributeKeys,
                null,
                columnDataTypes
            );

            setMockData(generatedMockData);
            setError(null);
        } catch (err) {
            setError(`Error generating mock data: ${err.message}`);
            console.error("Error generating mock data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleColumnDataTypesChange = (newColumnDataTypes) => {
        setColumnDataTypes(newColumnDataTypes);
    };

    const handleDataChange = (newData) => {
        setMockData(newData);
    };

    if (!mockData || mockData.length === 0) {
        return (
            <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-xs text-yellow-700">
                    No data available for table "{tableName}". 
                    <button
                        onClick={handleRegenerateMockData}
                        className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors"
                    >
                        Generate Data
                    </button>
                </p>
            </div>
        );
    }

    return (
        <div className="mb-4 p-3 bg-white rounded border border-gray-300">
            <div className="mb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="text-xs font-semibold text-gray-800 mb-2">Mock Data Editor</h4>
                        <p className="text-gray-600 text-xs mb-3">
                            DataSource: <strong>{dataSource}</strong> | Table: <strong>{tableName}</strong>
                        </p>
                    </div>
                    <button
                        onClick={handleRegenerateMockData}
                        disabled={loading}
                        className="px-3 py-1.5 bg-purple-500 text-white rounded text-xs font-medium hover:bg-purple-600 transition-colors disabled:bg-gray-400"
                    >
                        {loading ? "Regenerating..." : "Regenerate Data"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 mb-3">
                    {error}
                </div>
            )}

            <>
                {/* Column Data Type Configuration */}
                <ColumnDataTypeConfig
                    attributeKeys={attributeKeys}
                    dataSource={dataSource}
                    columnDataTypes={columnDataTypes}
                    setColumnDataTypes={handleColumnDataTypesChange}
                />

                {/* Mock Data Editor */}
                <MockDataTable
                    data={mockData}
                    setData={handleDataChange}
                    attributeKeys={attributeKeys}
                    dataSource={dataSource}
                />
            </>
        </div>
    );
};

export default MockDataEditor;
