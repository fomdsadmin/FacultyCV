import React from "react";
import DataSourceDropdown from "./DataSourceDropdown";
import { useTemplateBuilder } from "../TemplateBuilderContext";

const Table = ({ table, setTable }) => {
  // table is the table object from items state
  // setTable(id, updates) to update the table
  // Example: setTable(table.id, { name: "New Name" })

  const { sectionsMap } = useTemplateBuilder();

  console.log(sectionsMap);

  const setDataSettings = (settings) => {
    setTable(table.id, { dataSettings: { ...table.dataSettings, ...settings } });
  };

  return (
    <>
      <div style={{ color: "#666", fontSize: 12 }}>
        <div style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 14, color: "#333" }}>Table: {table?.name}</strong>
        </div>
        <DataSourceDropdown
          dataSource={table?.dataSettings?.dataSource}
          setDataSettings={setDataSettings}
        />
      </div>
    </>
  );
};

export default Table;
