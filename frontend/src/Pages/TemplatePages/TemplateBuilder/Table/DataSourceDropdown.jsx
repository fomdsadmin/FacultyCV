import React from "react";
import { useTemplateBuilder } from "../TemplateBuilderContext";

const DataSourceDropdown = ({ dataSource, setDataSettings }) => {
  const { sectionsMap } = useTemplateBuilder();
  const dataSources = Object.keys(sectionsMap);

  const handleChange = (e) => {
    const selectedSource = e.target.value;
    setDataSettings({ dataSource: selectedSource });
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#333" }}>
        Data Source
      </label>
      <select
        value={dataSource || ""}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "2px solid #ddd",
          borderRadius: 6,
          fontSize: 14,
          backgroundColor: "#fff",
          cursor: "pointer",
          color: dataSource ? "#333" : "#999",
          fontWeight: 500,
          transition: "all 0.2s ease",
        }}
      >
        <option value="">-- Select a Data Source --</option>
        {dataSources.map((source) => (
          <option key={source} value={source}>
            {source}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DataSourceDropdown;