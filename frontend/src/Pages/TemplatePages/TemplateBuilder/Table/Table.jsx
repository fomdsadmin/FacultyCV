import React from "react";
import DataSourceDropdown from "./DataSourceDropdown";
import ColumnBuilder from "./ColumnBuilder/ColumnBuilder";
import FilterComponent from "./FilterComponent";

const Table = ({ table, setTable }) => {
  const setDataSettings = (settings) => {
    setTable(table.id, { dataSettings: { ...table.dataSettings, ...settings } });
  };

  const setFilterSettings = (updatedFilterSettings) => {
    setTable(table.id, { dataSettings: { ...table.dataSettings, filterSettings: updatedFilterSettings } });
  };

  const dataSource = table?.dataSettings?.dataSource;

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
            <FilterComponent
              dataSource={dataSource}
              filterSettings={table?.dataSettings?.filterSettings}
              setFilterSettings={setFilterSettings}
            />
            <ColumnBuilder
              dataSource={dataSource}
              tableSettings={table?.tableSettings || {}}
              setTable={(updateFn) => setTable(table.id, updateFn(table))}
            />
          </>
        )}
      </div>
    </>
  );
};

export default Table;
