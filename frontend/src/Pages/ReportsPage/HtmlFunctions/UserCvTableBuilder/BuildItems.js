export const buildItem = (item, showVisualNesting) => {
    let html = "";
    console.log("JJDEBUG buildItem called with item:", item);
    console.log("JJDEBUG item.type:", item?.type);
    if (item.type === 'table') {
        html += buildTable(item);
    } else {
        html += buildTableGroup(item, showVisualNesting);
    }
    console.log("JJDEBUG buildItem returning HTML:", html);
    return html;
}

const buildColumnTextTemplate = (table) => {
    const { data, dataSettings } = table;
    const { rows } = data || {};
    const { columnTextTemplate } = dataSettings.sqlSettings;

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

    return html;
}

// Flatten columns to get order of fields
function flattenColumns(cols) {
    return cols.flatMap((c) => (c.children ? flattenColumns(c.children) : c));
}

const buildSqlViewTemplate = (table) => {
    const { dataSettings, sqlTable } = table;

    const { sqlViewTemplate } = dataSettings.sqlSettings;
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

    return html;
}

// Helper function to convert index to letter index (0 -> a, 1 -> b, ..., 25 -> z, 26 -> 1a, 27 -> 1b, etc.)
const getLetterIndex = (index) => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    if (index < 26) {
        return letters[index];
    }
    const cycleNumber = Math.floor(index / 26);
    const letterIndex = index % 26;
    return `${cycleNumber}${letters[letterIndex]}`;
};

const buildRecordDetailTemplate = (table) => {

    let html = "";

    const { data, dataSettings } = table;

    const { rows } = data || {};
    const { header, tableRows } = dataSettings.sqlSettings.recordDetailTemplate;

    // Replace outer <...> tag with div
    const divWrappedHeader = wrapWithOuterTag(header, "div");

    // Extract all variables from header and table rows
    const headerRegex = /\$\{([^}]+)\}/g;
    const headerVariables = [];
    let match;
    while ((match = headerRegex.exec(divWrappedHeader)) !== null) {
        headerVariables.push(match[1]);
    }

    // Loop through each row of data
    if (Array.isArray(rows) && rows.length > 0) {
        rows.forEach((row, rowIndex) => {
            // 1. Build header for this row
            let headerHtmlForRow = divWrappedHeader;

            headerVariables.forEach((variable) => {
                let value = row[variable] ?? "";

                // Handle special variables
                if (variable === "rowIndex") {
                    value = String(rowIndex + 1); // 1-based index
                } else if (variable === "letterIndex") {
                    value = getLetterIndex(rowIndex);
                }

                headerHtmlForRow = headerHtmlForRow.replace(
                    new RegExp(`\\$\\{${variable}\\}`, "g"),
                    String(value)
                );
            });

            html += headerHtmlForRow;

            // 2. Build table for this row
            if (Array.isArray(tableRows) && tableRows.length > 0) {
                // Extract all variables from table cells
                const tableVariables = new Set();
                tableRows.forEach((tableRow) => {
                    if (Array.isArray(tableRow.cells)) {
                        tableRow.cells.forEach((cell) => {
                            const cellRegex = /\$\{([^}]+)\}/g;
                            let cellMatch;
                            while ((cellMatch = cellRegex.exec(cell.content)) !== null) {
                                tableVariables.add(cellMatch[1]);
                            }
                        });
                    }
                });

                // Build table body (each tableRow becomes a row in the table)
                let tableBodyHtml = "";
                tableRows.forEach((tableRow) => {
                    let rowHtml = "<tr>";
                    if (Array.isArray(tableRow.cells)) {
                        tableRow.cells.forEach((cell) => {
                            let cellContent = cell.content;

                            // Replace variables in cell content
                            Array.from(tableVariables).forEach((variable) => {
                                let value = row[variable] ?? "";

                                // Handle special variables
                                if (variable === "rowIndex") {
                                    value = String(rowIndex + 1);
                                } else if (variable === "letterIndex") {
                                    value = getLetterIndex(rowIndex);
                                }

                                cellContent = cellContent.replace(
                                    new RegExp(`\\$\\{${variable}\\}`, "g"),
                                    String(value)
                                );
                            });

                            rowHtml += `<td>${cellContent}</td>`;
                        });
                    }
                    rowHtml += "</tr>";
                    tableBodyHtml += rowHtml;
                });

                const tableHtml = `<div class="table-with-notes">
                    <table border="1" cellspacing="0" cellpadding="5">
                    <tbody>
                    ${tableBodyHtml}
                    </tbody>
                    </table>
                    </div>`;

                html += tableHtml;
            }

            // Add spacing between records
            if (rowIndex < rows.length - 1) {
                html += "<div style=\"margin-bottom: 20px;\"></div>";
            }
        });
    }

    return html
}

const buildTable = (table) => {

    const { header, footnotes, dataSettings, data, tableSettings } = table;

    const { columnTextTemplate, sqlViewTemplate, recordDetailTemplate } = dataSettings.sqlSettings;

    let html = "";

    // Check if table has no data
    const hasNoData = !data?.rows || data.rows.length === 0;

    if (hasNoData && !tableSettings?.noDataDisplaySettings?.showEmptyTable) {
        return "";
    }

    // Add header (section title) - only if it has actual text content (strip HTML tags first)
    if (header) {
        const plainText = header.replace(/<[^>]*>/g, '').trim();
        if (plainText) {
            html += buildHeader(tableSettings);
        }
    }

    if (hasNoData && tableSettings?.noDataDisplaySettings?.showEmptyTable) {
        html += `<div class="table-with-notes">
            <table border="1" cellspacing="0" cellpadding="5">
                <tbody>
                    <tr>
                        <td style="color: #888; text-align: center; font-style: italic;">No data!</td>
                    </tr>
                </tbody>
            </table>
        </div>`;
        return html;
    }

    if (columnTextTemplate?.selected) {
        html += buildColumnTextTemplate(table);
    } else if (sqlViewTemplate?.selected) {
        html += buildSqlViewTemplate(table);
    } else if (recordDetailTemplate?.selected) {
        html += buildRecordDetailTemplate(table);
    } else {
        html += buildColRowTable(table);
    }

    // Add footnotes if they exist
    if (Array.isArray(footnotes) && footnotes.length > 0) {
        html += "<div class=\"table-footnotes\" style=\"margin-top: 10px;\">" + footnotes.join("<br>") + "</div>";
    }


    return html;
}

// Helper function to get all empty tables from a tableGroup (breadth-first)
const getAllEmptyTables = (tableGroup) => {
    const emptyTables = [];
    const queue = [tableGroup];

    while (queue.length > 0) {
        const current = queue.shift();

        if (!current || !Array.isArray(current.items)) continue;

        // Process all items at this level (breadth)
        current.items.forEach((item) => {
            if (item.type === 'table') {
                const hasNoData = !item.data?.rows || item.data.rows.length === 0;
                if (hasNoData) {
                    const tableNameToDisplay = item.tableSettings?.noDataDisplaySettings?.tableNameToDisplay || item?.name || "";
                    if (item.tableSettings?.noDataDisplaySettings?.display) {
                        emptyTables.push(tableNameToDisplay);
                    }
                }
            } else {
                // Add nested groups to queue for later processing
                queue.push(item);
            }
        });
    }

    return emptyTables;
};

// Helper function to check if tableGroup contains at least 1 row of data total
const hasAnyData = (tableGroup) => {
    const queue = [tableGroup];

    while (queue.length > 0) {
        const current = queue.shift();

        if (!current || !Array.isArray(current.items)) continue;

        for (const item of current.items) {
            if (!item) continue;

            if (item.type === 'table') {
                if (item.data?.rows && item.data.rows.length > 0) {
                    return true;
                }
            } else {
                // Add nested groups to queue for later processing
                queue.push(item);
            }
        }
    }

    return false;
};

const buildTableGroup = (tableGroup, showVisualNesting, level = 0, rootGroupColorIndex = null) => {
    let html = "";
    const { groupSettings } = tableGroup;

    // Determine root group color index
    let colorIndex = rootGroupColorIndex;
    if (level === 0) {
        // If this is a root group, assign a new color index
        if (typeof buildTableGroup._rootGroupCounter === 'undefined') {
            buildTableGroup._rootGroupCounter = 0;
        }
        colorIndex = buildTableGroup._rootGroupCounter++;
    }

    if (!hasAnyData(tableGroup) && !groupSettings?.noDataDisplaySettings?.display) {
        return "";
    }

    if (groupSettings.header) {
        html += buildHeader(groupSettings);
    }

    // Minimal nesting lines (shows a line for level 0 as well)
    const indentPerLevel = 9; // spacing for each level

    function getColorByIndex(index) {
        const hue = (index * 137.508) % 360;
        return `hsl(${hue}, 65%, 55%)`;
    }

    // Draw a vertical line for every group (level >= 0) if visual nesting is enabled
    const lineHtml =
        showVisualNesting
            ? `<div style="
            position:absolute;
            left:${level * indentPerLevel}px;
            top:0;
            bottom:0;
            width:3px;
            background:${getColorByIndex(colorIndex)};
            border-radius:12px;
        "></div>`
            : "";

    // Build children HTML
    let innerHtml = "";
    tableGroup.items.forEach((item) => {
        if (item.type === 'table') {
            innerHtml += buildTable(item);
        } else {
            innerHtml += buildTableGroup(item, showVisualNesting, level + 1, colorIndex);
        }
    });

    // Container wrapper (line + child items + empty tables)
    let groupInner = innerHtml;

    // If empty-table listing is enabled, append inside the group
    if (groupSettings?.noDataDisplaySettings?.listEmptyTables) {
        const emptyTableNames = getAllEmptyTables(tableGroup);
        if (emptyTableNames.length > 0) {
            const emptyHtml = `
            <div style="
                margin-top: 1em;
                margin-bottom: 1em;
                font-family: Arial, sans-serif;
                font-size: 0.95em;
            ">
                <strong>Tables with no data:</strong>
                ${emptyTableNames
                    .map(
                        (name, i) => `
                        <span style="
                            background-color: ${i % 2 === 0 ? "#f2f2f2" : "#dcdcdc"};
                            padding: 2px 6px;
                            border-radius: 4px;
                            margin-right: 4px;
                            display: inline-block;
                        ">
                            ${name}${i < emptyTableNames.length - 1 ? "," : ""}
                        </span>
                    `
                    )
                    .join("")}
            </div>
        `;

            groupInner += emptyHtml;
        }
    }

    // Final wrapper output
    if (showVisualNesting) {
        html += `
    <div style="
        position:relative;
        padding-left:${(level + 1) * indentPerLevel}px;
        min-height:24px;
    ">
        ${lineHtml}
        ${groupInner}
    </div>
`;
    } else {
        html += groupInner
    }

    return html;
}

// Reset root group counter before rendering (call this before top-level build)
buildTableGroup._rootGroupCounter = 0;

const buildHeader = (headerInfo) => {
    const { headerWrapperTag, header } = headerInfo;
    if (!headerWrapperTag) {
        return wrapWithOuterTag(header, "div")
    }
    return wrapWithOuterTag(header, headerWrapperTag);
}

function wrapWithOuterTag(str, tag = "div") {
    // 1. Match the first opening tag
    const match = str.match(/^<([a-zA-Z0-9-_]+)([^>]*)>/);
    if (!match) {
        // No outer tag → just wrap
        return `<${tag}>${str}</${tag}>`;
    }

    const outerTag = match[1];

    // 2. If outer tag is p, div, or span → replace it
    if (["p", "div", "span"].includes(outerTag)) {
        // Build closing tag regex for the outer tag
        const closingTagRegex = new RegExp(`</${outerTag}>$`);

        // Replace first opening and last closing tag
        return str
            .replace(/^<([a-zA-Z0-9-_]+)([^>]*)>/, `<${tag}>`)
            .replace(closingTagRegex, `</${tag}>`);
    }

    // 3. Otherwise → wrap the entire string
    return `<${tag}>${str}</${tag}>`;
}
