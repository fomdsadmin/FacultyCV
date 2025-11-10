export const buildItem = (item) => {
    let html = "";
    console.log("JJDEBUG buildItem called with item:", item);
    console.log("JJDEBUG item.type:", item?.type);
    if (item.type === 'table') {
        html += buildTable(item);
    } else {
        html += buildTableGroup(item);
    }
    console.log("JJDEBUG buildItem returning HTML:", html);
    return html;
}

const buildTable = (table) => {
    const { data, header, hideColumns } = table;
    const { columns, rows } = data || {};

    console.log("JJJFILTER TABLE", table);

    let html = "";

    // Add header (section title)
    if (header) {
        html += header;
    }

    // Don't filter columns - use all columns as-is
    const columnsToRender = Array.isArray(columns) ? columns : [];

    // Helper: calculate max depth of columns
    function getDepth(cols) {
        return cols.reduce((max, col) => {
            if (col.children) return Math.max(max, 1 + getDepth(col.children));
            return Math.max(max, 1);
        }, 0);
    }

    const depth = getDepth(columnsToRender);

    // Build header rows
    const headerRows = Array.from({ length: depth }, () => []);

    function processColumn(col, level) {
        const hasChildren = !!col.children && col.children.length > 0;
        if (hasChildren) {
            const colspan = countLeafColumns(col);
            headerRows[level].push({ name: col.headerName, colspan, rowspan: 1 });
            col.children.forEach((child) => processColumn(child, level + 1));
        } else {
            headerRows[level].push({ name: col.headerName, colspan: 1, rowspan: depth - level });
        }
    }

    function countLeafColumns(col) {
        if (!col.children) return 1;
        return col.children.reduce((sum, c) => sum + countLeafColumns(c), 0);
    }

    columnsToRender.forEach((col) => processColumn(col, 0));

    // Keep all header rows - don't filter any out
    const visibleHeaderRows = headerRows;

    // Generate header HTML
    const headerHtml = visibleHeaderRows
        .map(
            (row) =>
                "<tr>" +
                row
                    .map(
                        (cell) =>
                            `<th${cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ""}${cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ""
                            }>${cell.name}</th>`
                    )
                    .join("") +
                "</tr>"
        )
        .join("\n");

    // Flatten columns to get order of fields
    function flattenColumns(cols) {
        return cols.flatMap((c) => (c.children ? flattenColumns(c.children) : c));
    }

    const flatColumns = flattenColumns(columnsToRender);

    console.log("JJDEBUG flatColumns:", flatColumns);
    console.log("JJDEBUG columnsToRender:", columnsToRender);

    // Build body HTML
    let bodyHtml = "";
    const noRows = !Array.isArray(rows) || rows.length === 0;
    const noLeafColumns = !Array.isArray(flatColumns) || flatColumns.length === 0;

    if (!noRows && !noLeafColumns) {
        bodyHtml = rows
            .map(
                (row) =>
                    "<tr>" +
                    flatColumns
                        .map((c) => {
                            const fieldValue = row[c.field] ?? "";
                            return `<td>${String(fieldValue).trim()}</td>`;
                        })
                        .join("") +
                    "</tr>"
            )
            .join("\n");
    }

    // Build the final table HTML
    const tableHtml = `<div class="table-with-notes">
        <table border="1" cellspacing="0" cellpadding="5">
        <thead>
        ${headerHtml}
        </thead>
        <tbody>
        ${bodyHtml}
        </tbody>
        </table>
        </div>`;

    html += tableHtml;

    console.log("JJJFILTER table built", { columns: columnsToRender.length, rows: rows?.length || 0 });
    console.log("JJJFILTER final HTML output:", html);

    return html;
}

const buildTableGroup = (tableGroup) => {
    let html = "";

    if (tableGroup.header) {
        html += tableGroup.header;
    }

    tableGroup.items.forEach((item) => {
        if (item.type === 'table') {
            html += buildTable(item);
        } else {
            html += buildTableGroup(item);
        }
    });

    console.log("JJDEBUG buildTableGroup returned HTML:", html);
    return html;
}