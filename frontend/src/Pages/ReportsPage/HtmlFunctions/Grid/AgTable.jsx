const { AgGridReact } = require("ag-grid-react");

 const AgTable = ({ table }) => {
    const { rows, columns } = table;

    return (
        <div className="ag-theme-alpine" style={{ width: "100%", height: "100%" }}>
            <AgGridReact rowData={rows} columnDefs={columns} />
        </div>
    )
}

export default AgTable;