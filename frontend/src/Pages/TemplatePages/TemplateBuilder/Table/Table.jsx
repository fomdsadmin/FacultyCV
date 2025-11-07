import React, { useMemo } from "react";
import { useTemplateBuilder } from "../TemplateBuilderContext";
import DataSourceDropdown from "./DataSourceDropdown";
import ColumnBuilder from "./ColumnBuilder/ColumnBuilder";
import FilterComponent from "./FilterComponent";
import SQLQueryComponent from "./SQLQueryComponent";
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

  const handleHeaderChange = (value) => {
    setTableSettings({ header: value });
  };

  const dataSource = table?.dataSettings?.dataSource;
  const attributeKeys = useMemo(() => sectionsMap?.[dataSource]?.attributeKeys || {}, [sectionsMap, dataSource]);

  return (
    <>
      <div style={{ color: "#666", fontSize: 12 }}>
        <div style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 14, color: "#333" }}>Table: {table?.name}</strong>
        </div>
        <DataSourceDropdown
          dataSource={dataSource}
          setDataSettings={setDataSettings}
        />

        {dataSource && (
          <>
            <ColumnBuilder
              dataSource={dataSource}
              tableSettings={table?.tableSettings || {}}
              setTable={(updateFn) => setTable(table.id, updateFn(table))}
            />
            <HeaderEditor
              header={table?.tableSettings?.header || ""}
              onHeaderChange={handleHeaderChange}
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
