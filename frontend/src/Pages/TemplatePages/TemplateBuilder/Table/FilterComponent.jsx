import React, { useState } from "react";
import { useTemplateBuilder } from "../TemplateBuilderContext";

const FilterComponent = ({ dataSource, filterSettings, setFilterSettings }) => {
  const { sectionsMap } = useTemplateBuilder();
  const [activeTab, setActiveTab] = useState("include");

  // Get all attributes and their types for this datasource
  const attributesType = sectionsMap?.[dataSource]?.attributes_type || {};
  const dropdownOptions = sectionsMap?.[dataSource]?.dropdownOptions || {};
  const allAttributeNames = Object.keys(attributesType);
  const handleAddRule = (tab) => {
    const ruleKey = tab === "include" ? "and" : "or";
    const currentRules = filterSettings?.[tab]?.[ruleKey] || [];
    
    setFilterSettings({
      ...filterSettings,
      [tab]: {
        ...(filterSettings[tab] || {}),
        [ruleKey]: [
          ...currentRules,
          { attribute: "", equals: "" },
        ],
      },
    });
  };

  const handleRemoveRule = (tab, index) => {
    const ruleKey = tab === "include" ? "and" : "or";
    const currentRules = filterSettings?.[tab]?.[ruleKey] || [];
    
    setFilterSettings({
      ...filterSettings,
      [tab]: {
        ...(filterSettings[tab] || {}),
        [ruleKey]: currentRules.filter((_, i) => i !== index),
      },
    });
  };

  const handleRuleChange = (tab, index, field, value) => {
    const ruleKey = tab === "include" ? "and" : "or";
    const currentRules = filterSettings?.[tab]?.[ruleKey] || [];
    const updatedRules = [...currentRules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };

    setFilterSettings({
      ...filterSettings,
      [tab]: {
        ...(filterSettings[tab] || {}),
        [ruleKey]: updatedRules,
      },
    });
  };

  const renderRules = (tab) => {
    const ruleKey = tab === "include" ? "and" : "or";
    const rules = filterSettings?.[tab]?.[ruleKey] || [];

    return (
      <div style={{ padding: "12px 0" }}>
        {rules.length === 0 ? (
          <p style={{ color: "#999", fontSize: 12, margin: "8px 0" }}>
            No {tab} rules yet
          </p>
        ) : (
          rules.map((rule, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
                padding: "8px",
                backgroundColor: "#f9f9f9",
                borderRadius: 4,
                border: "1px solid #e0e0e0",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: "#666",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Attribute
                </label>
                <select
                  value={rule.attribute || ""}
                  onChange={(e) =>
                    handleRuleChange(tab, index, "attribute", e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    border: "1px solid #ddd",
                    borderRadius: 3,
                    fontSize: 12,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select attribute...</option>
                  {allAttributeNames.map((attrName) => (
                    <option key={attrName} value={attrName}>
                      {attrName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: "#666",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Value
                </label>
                {rule.attribute && attributesType[rule.attribute] === "dropdown" && dropdownOptions[rule.attribute] ? (
                  <select
                    value={rule.equals || ""}
                    onChange={(e) =>
                      handleRuleChange(tab, index, "equals", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      border: "1px solid #ddd",
                      borderRadius: 3,
                      fontSize: 12,
                      boxSizing: "border-box",
                    }}
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
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      border: "1px solid #ddd",
                      borderRadius: 3,
                      fontSize: 12,
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <select
                    disabled
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      border: "1px solid #ddd",
                      borderRadius: 3,
                      fontSize: 12,
                      boxSizing: "border-box",
                      backgroundColor: "#f5f5f5",
                      color: "#999",
                    }}
                  >
                    <option>Select attribute first</option>
                  </select>
                )}
              </div>

              <button
                onClick={() => handleRemoveRule(tab, index)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#ff5252",
                  color: "white",
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  alignSelf: "flex-end",
                  marginBottom: 4,
                }}
              >
                Remove
              </button>
            </div>
          ))
        )}
        <button
          onClick={() => handleAddRule(tab)}
          style={{
            padding: "6px 12px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: 3,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            marginTop: 8,
          }}
        >
          + Add {tab === "include" ? "Include" : "Exclude"} Rule
        </button>
      </div>
    );
  };

  if (allAttributeNames.length === 0) {
    return (
      <div style={{ color: "#999", fontSize: 12, padding: "8px 0" }}>
        No attributes available for filtering
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16, padding: "12px", backgroundColor: "#f9f9f9", borderRadius: 6 }}>
      <div style={{ marginBottom: 16 }}>
        <strong style={{ fontSize: 13, color: "#333" }}>Filter Rules</strong>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <button
          onClick={() => setActiveTab("include")}
          style={{
            padding: "8px 16px",
            backgroundColor: activeTab === "include" ? "#2196F3" : "transparent",
            color: activeTab === "include" ? "white" : "#666",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Include (AND)
        </button>
        <button
          onClick={() => setActiveTab("filterOut")}
          style={{
            padding: "8px 16px",
            backgroundColor: activeTab === "filterOut" ? "#FF9800" : "transparent",
            color: activeTab === "filterOut" ? "white" : "#666",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Exclude (OR)
        </button>
      </div>

      <div style={{ padding: "12px", backgroundColor: "white", borderRadius: "0 4px 4px 4px" }}>
        {renderRules(activeTab)}
      </div>
    </div>
  );
};

export default FilterComponent;
