import React, { useMemo } from "react";
import { useTemplateBuilder } from "../TemplateBuilderContext";
import DataSourceDropdown from "./DataSourceDropdown";
import ColumnBuilder from "./ColumnBuilder/ColumnBuilder";
import FilterComponent from "./FilterComponent";
import SQLQueryComponent from "./sqlquerycomponent/SQLQueryComponent";
import HeaderEditor from "./HeaderEditor";

const Table = ({ table, setTable }) => {
  const { sectionsMap } = useTemplateBuilder();

  const setDataSettings = (settings) => {
    setTable(table.id, { dataSettings: { ...table.dataSettings, ...settings } });
  };

  const setFilterSettings = (updatedFilterSettings) => {
    setTable(table.id, { dataSettings: { ...table.dataSettings, filterSettings: updatedFilterSettings } });
  };

  const setSqlSettings = (updatedSqlSettings) => {
    setTable(table.id, { dataSettings: { ...table.dataSettings, sqlSettings: updatedSqlSettings } });
  };

  const setTableSettings = (updates) => {
    setTable(table.id, { tableSettings: { ...table.tableSettings, ...updates } });
  };

  const handleSkipDateFilterChange = (e) => {
    setTable(table.id, { dataSettings: { ...table.dataSettings, skipDateFilter: e.target.checked } });
  };

  const handleHeaderChange = (value) => {
    setTableSettings({ header: value });
  };

  const handleNameChange = (e) => {
    setTable(table.id, { name: e.target.value });
  };

  const dataSource = table?.dataSettings?.dataSource;
  const attributeKeys = useMemo(() => sectionsMap?.[dataSource]?.attributeKeys || {}, [sectionsMap, dataSource]);

  return (
    <>
      <div style={{ color: "#666", fontSize: 12 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4, fontWeight: 500 }}>
            Table Name
          </label>
          <input
            type="text"
            value={table?.name || ""}
            onChange={handleNameChange}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: 14,
              boxSizing: "border-box",
              fontWeight: 600,
              color: "#333"
            }}
          />
        </div>
        <DataSourceDropdown
          dataSource={dataSource}
          setDataSettings={setDataSettings}
        />

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={table?.dataSettings?.skipDateFilter || false}
              onChange={handleSkipDateFilterChange}
              style={{ cursor: "pointer" }}
            />
            <span style={{ fontSize: 12, color: "#666" }}>
              Skip Date Filter (data will not be filtered by date ranges)
            </span>
          </label>
        </div>

        {dataSource && (
          <>
            <HeaderEditor
              header={table?.tableSettings?.header || ""}
              onHeaderChange={handleHeaderChange}
            />
            <ColumnBuilder
              dataSource={dataSource}
              tableSettings={table?.tableSettings || {}}
              setTable={(updateFn) => setTable(table.id, updateFn(table))}
            />
            <FilterComponent
              dataSource={dataSource}
              filterSettings={table?.dataSettings?.filterSettings}
              setFilterSettings={setFilterSettings}
            />
            <SQLQueryComponent
              dataSource={dataSource}
              sqlSettings={table?.dataSettings?.sqlSettings}
              setSqlSettings={setSqlSettings}
              filterSettings={table?.dataSettings?.filterSettings}
              attributeKeys={attributeKeys}
            />
          </>
        )}
      </div>
    </>
  );
};

export default Table;
