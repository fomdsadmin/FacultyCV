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

const buildColumnTextTemplate = (table) => {
    const { data, sqlSettings } = table;
    const { rows } = data || {};
    const { columnTextTemplate } = sqlSettings;

    const columnTextTemplateHtml = columnTextTemplate.html;

    let html = "";


    // Extract variables from template string (e.g., ${variableName})
    const regex = /\$\{([^}]+)\}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(columnTextTemplateHtml)) !== null) {
        variables.push(match[1]);
    }

    rows.forEach((row, index) => {
        let htmlRowToShow = columnTextTemplateHtml;

        variables.forEach((variable) => {
            htmlRowToShow = htmlRowToShow.replace(
                new RegExp(`\\$\\{${variable}\\}`, "g"),
                row[variable] ?? ""
            );
        });

        html += htmlRowToShow;
        if (index < rows.length - 1) {
            html += "<br>";
        }
    });

    console.log("JJFILTER potential div", html)
    return html;
}

// Flatten columns to get order of fields
function flattenColumns(cols) {
    return cols.flatMap((c) => (c.children ? flattenColumns(c.children) : c));
}

const buildSqlViewTemplate = (table) => {
    const { sqlSettings, sqlTable } = table;

    const { sqlViewTemplate } = sqlSettings;
    const { showHeaders, grayFirstColumn } = sqlViewTemplate || {};

    if (!sqlTable || !sqlTable.success) {
        return "";
    }

    const { columns, rows } = sqlTable;

    let html = "";

    // Build header HTML
    let headerHtml = "";
    if (showHeaders && Array.isArray(columns) && columns.length > 0) {
        headerHtml = "<tr>" +
            columns
                .map((col) => `<th style="background-color: #f0f0f0;">${col}</th>`)
                .join("") +
            "</tr>";
    }

    // Build body HTML
    let bodyHtml = "";
    if (Array.isArray(rows) && rows.length > 0 && Array.isArray(columns) && columns.length > 0) {
        bodyHtml = rows
            .map((row) =>
                "<tr>" +
                columns
                    .map((col, index) => {
                        const fieldValue = row[col] ?? "";
                        const isFirstColumn = index === 0 && grayFirstColumn;
                        const bgColor = isFirstColumn ? 'background-color: #e8e8e8;' : '';
                        return `<td style="${bgColor}">${String(fieldValue).trim()}</td>`;
                    })
                    .join("") +
                "</tr>"
            )
            .join("\n");
    }

    // Build the final table HTML
    const tableHtml = `<div class="table-with-notes">
        <table border="1" cellspacing="0" cellpadding="5">
        ${showHeaders ? `<thead>
        ${headerHtml}
        </thead>` : ""}
        <tbody>
        ${bodyHtml}
        </tbody>
        </table>
        </div>`;

    html += tableHtml;

    return html;
}

const buildColRowTable = (table) => {
    const { data, hideColumns } = table;
    const { columns, rows } = data || {};

    let html = "";

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
                            `<th style="background-color: #f0f0f0;"${cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ""}${cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ""
                            }>${cell.name}</th>`
                    )
                    .join("") +
                "</tr>"
        )
        .join("\n");

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
    // If hideColumns is true, omit the <thead> but still render the rows
    const tableHtml = `<div class="table-with-notes">
        <table border="1" cellspacing="0" cellpadding="5">
        ${hideColumns ? "" : `<thead>
        ${headerHtml}
        </thead>`}
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

const buildTable = (table) => {

    console.log("JJFILTER table", table)

    const { sqlSettings, header, footnotes } = table;

    const { columnTextTemplate, sqlViewTemplate } = sqlSettings;

    let html = "";

    // Add header (section title) - only if it has actual text content (strip HTML tags first)
    if (header) {
        const plainText = header.replace(/<[^>]*>/g, '').trim();
        if (plainText) {
            html += header;
        }
    }
    console.log("JJFILTER ", table)
    if (columnTextTemplate.selected) {
        html += buildColumnTextTemplate(table);
    } else if (sqlViewTemplate.selected) {
        html += buildSqlViewTemplate(table);
    } else {
        html += buildColRowTable(table);
    }

    // Add footnotes if they exist
    if (Array.isArray(footnotes) && footnotes.length > 0) {
        html += "<div class=\"table-footnotes\" style=\"margin-top: 10px;\">" + footnotes.join("<br>") + "</div>";
    }


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