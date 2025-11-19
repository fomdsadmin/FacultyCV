import React from "react";
import { useTemplateBuilder } from "../../TemplateBuilderContext";

const ColumnDataTypeConfig = ({ attributeKeys, dataSource, columnDataTypes, setColumnDataTypes }) => {
    const { sectionsMap } = useTemplateBuilder();
    const section = sectionsMap[dataSource];
    const attributesType = section?.attributes_type || {};

    // Filter columns that are not dropdown or date type
    const configurableColumns = Object.entries(attributeKeys).filter(([displayName]) => {
        const attrType = attributesType[displayName];
        return attrType !== "dropdown" && attrType !== "date";
    });

    if (configurableColumns.length === 0) {
        return null;
    }

    const handleDataTypeChange = (fieldName, newType) => {
        setColumnDataTypes({
            ...columnDataTypes,
            [fieldName]: newType
        });
    };

    return (
        <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
                Column Data Types:
            </label>
            <div className="space-y-2">
                {configurableColumns.map(([displayName, fieldName]) => {
                    const currentType = columnDataTypes[fieldName] || "string";
                    
                    return (
                        <div key={fieldName} className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200">
                            <span className="text-sm font-medium text-gray-700 min-w-40">
                                {displayName}:
                            </span>
                            <select
                                value={currentType}
                                onChange={(e) => handleDataTypeChange(fieldName, e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="string">Strings (Random phrases)</option>
                                <option value="number">Numbers (Random integers)</option>
                                <option value="csvlist">Comma-Separated List (Multiple values)</option>
                            </select>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ColumnDataTypeConfig;
