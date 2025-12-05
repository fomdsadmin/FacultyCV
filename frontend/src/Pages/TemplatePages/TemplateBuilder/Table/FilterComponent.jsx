import React, { useState, useMemo } from "react";
import { useTemplateBuilder } from "../TemplateBuilderContext";
import { useNotification } from "Contexts/NotificationContext";

const FilterComponent = ({ dataSources, filterSettings, setFilterSettings }) => {
  const { sectionsMap } = useTemplateBuilder();
  const { setNotification } = useNotification();
  const [activeTab, setActiveTab] = useState("include");
  const [selectedDataSource, setSelectedDataSource] = useState("");
  const [operator, setOperator] = useState({ include: "and", exclude: "and" });
  const [rules, setRules] = useState({
    include: { and: [], or: [] },
    exclude: { and: [], or: [] }
  });

  // Get available data sources
  const availableDataSources = useMemo(() => {
    return dataSources && Array.isArray(dataSources)
      ? dataSources.map(ds => ds.dataSource)
      : [];
  }, [dataSources]);

  // Initialize selected data source
  useMemo(() => {
    if (!selectedDataSource && availableDataSources.length > 0) {
      setSelectedDataSource(availableDataSources[0]);
    }
  }, [availableDataSources, selectedDataSource]);

  // Get all attributes and their types for the selected datasource
  const attributesType = useMemo(() => {
    return selectedDataSource && sectionsMap ? sectionsMap[selectedDataSource]?.attributes_type || {} : {};
  }, [selectedDataSource, sectionsMap]);

  const dropdownOptions = useMemo(() => {
    return selectedDataSource && sectionsMap ? sectionsMap[selectedDataSource]?.dropdownOptions || {} : {};
  }, [selectedDataSource, sectionsMap]);

  const allAttributeNames = useMemo(() => {
    return Object.keys(attributesType);
  }, [attributesType]);

  const handleAddRule = (tab) => {
    const op = operator[tab];
    setRules((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [op]: [...(prev[tab]?.[op] || []), { attribute: "", equals: "" }],
      },
    }));
  };

  const handleRemoveRule = (tab, index) => {
    const op = operator[tab];
    setRules((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [op]: (prev[tab]?.[op] || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleRuleChange = (tab, index, field, value) => {
    const op = operator[tab];
    setRules((prev) => {
      const updatedRules = [...(prev[tab]?.[op] || [])];
      updatedRules[index] = { ...updatedRules[index], [field]: value };
      return {
        ...prev,
        [tab]: {
          ...prev[tab],
          [op]: updatedRules,
        },
      };
    });
  };

  const generateSQL = () => {
    const includeOp = operator.include;
    const excludeOp = operator.exclude;
    const includeRules = rules.include?.[includeOp] || [];
    const excludeRules = rules.exclude?.[excludeOp] || [];
    const attributeKeys = selectedDataSource && sectionsMap ? sectionsMap[selectedDataSource]?.attributeKeys || {} : {};

    let whereClause = "";

    if (includeRules.length > 0) {
      const conditions = includeRules
        .filter((r) => r.attribute && r.equals)
        .map((r) => {
          const fieldName = attributeKeys[r.attribute] || r.attribute;
          return `[${fieldName}] = '${r.equals}'`;
        })
        .join(` ${includeOp.toUpperCase()} `);
      if (conditions) whereClause += conditions;
    }

    if (excludeRules.length > 0) {
      const conditions = excludeRules
        .filter((r) => r.attribute && r.equals)
        .map((r) => {
          const fieldName = attributeKeys[r.attribute] || r.attribute;
          return `[${fieldName}] != '${r.equals}'`;
        })
        .join(` ${excludeOp.toUpperCase()} `);
      if (conditions) {
        whereClause += whereClause ? ` AND (${conditions})` : conditions;
      }
    }

    if (!whereClause) return "";
    
    return `SELECT * FROM ? WHERE ${whereClause}`;
  };

  const renderRules = (tab) => {
    const op = operator[tab];
    const tabRules = rules[tab]?.[op] || [];

    return (
      <div className="py-3 space-y-3">
        {/* Operator Selector */}
        <div className="mb-3">
          <label className="text-xs text-gray-600 block mb-1.5 font-medium">
            Operator
          </label>
          <select
            value={op}
            onChange={(e) => setOperator({ ...operator, [tab]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="and">AND (all conditions must match)</option>
            <option value="or">OR (any condition can match)</option>
          </select>
        </div>

        {/* Rules List */}
        {tabRules.length === 0 ? (
          <p className="text-gray-500 text-xs my-2">No rules yet</p>
        ) : (
          tabRules.map((rule, index) => (
            <div key={index} className="flex gap-2 p-2 bg-gray-50 rounded border border-gray-300">
              <div className="flex-1">
                <select
                  value={rule.attribute || ""}
                  onChange={(e) =>
                    handleRuleChange(tab, index, "attribute", e.target.value)
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select attribute...</option>
                  {allAttributeNames.map((attrName) => (
                    <option key={attrName} value={attrName}>
                      {attrName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                {rule.attribute && attributesType[rule.attribute] === "dropdown" && dropdownOptions[rule.attribute] ? (
                  <select
                    value={rule.equals || ""}
                    onChange={(e) =>
                      handleRuleChange(tab, index, "equals", e.target.value)
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select value...</option>
                    {dropdownOptions[rule.attribute].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : rule.attribute ? (
                  <input
                    type="text"
                    value={rule.equals || ""}
                    onChange={(e) =>
                      handleRuleChange(tab, index, "equals", e.target.value)
                    }
                    placeholder="Enter value"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <select
                    disabled
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-gray-100 text-gray-500"
                  >
                    <option>Select attribute first</option>
                  </select>
                )}
              </div>

              <button
                onClick={() => handleRemoveRule(tab, index)}
                className="px-3 py-1.5 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          ))
        )}

        <button
          onClick={() => handleAddRule(tab)}
          className="px-3 py-1.5 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors"
        >
          + Add Rule
        </button>
      </div>
    );
  };

  if (availableDataSources.length === 0 || allAttributeNames.length === 0) {
    return (
      <div className="text-gray-500 text-xs py-2">
        No attributes available for filtering
      </div>
    );
  }

  const generatedSQL = generateSQL();

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-300">
      <div className="mb-4">
        <strong className="text-sm text-gray-800">Filter SQL Generator</strong>
        <p className="text-xs text-gray-600 mt-1">
          Build filter rules to generate SQL WHERE clause (copy and paste into your query)
        </p>
      </div>

      {/* Data Source Selector */}
      {availableDataSources.length > 0 && (
        <div className="mb-4 p-3 bg-white rounded border border-gray-300">
          <label className="text-xs text-gray-600 block mb-1.5 font-medium">
            Data Source
          </label>
          <select
            value={selectedDataSource}
            onChange={(e) => setSelectedDataSource(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableDataSources.map((ds) => (
              <option key={ds} value={ds}>
                {ds}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2 mb-3 border-b border-gray-300">
        <button
          onClick={() => setActiveTab("include")}
          className={`px-4 py-2 rounded-t text-xs font-medium transition-colors ${
            activeTab === "include"
              ? "bg-blue-500 text-white"
              : "bg-transparent text-gray-600 hover:text-gray-800"
          }`}
        >
          Include (AND)
        </button>
        <button
          onClick={() => setActiveTab("exclude")}
          className={`px-4 py-2 rounded-t text-xs font-medium transition-colors ${
            activeTab === "exclude"
              ? "bg-orange-500 text-white"
              : "bg-transparent text-gray-600 hover:text-gray-800"
          }`}
        >
          Exclude (OR)
        </button>
      </div>

      <div className="p-3 bg-white rounded-b-lg">
        {renderRules(activeTab)}
      </div>

      {/* Generated SQL Output */}
      {generatedSQL && (
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <strong className="text-xs text-blue-700">Generated WHERE Clause:</strong>
          <div className="mt-2 p-2 bg-white border border-gray-300 rounded text-xs font-mono text-gray-800 break-all">
            {generatedSQL}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(generatedSQL);
              setNotification({ message: "SQL copied to clipboard!", type: "success" });
            }}
            className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterComponent;
