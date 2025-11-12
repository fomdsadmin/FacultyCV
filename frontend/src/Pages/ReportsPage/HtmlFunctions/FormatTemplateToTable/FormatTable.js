import { templateDataStore } from "./TemplateDataStore"
import { sortSectionData, filterDateRanges } from "./DateUtils";
import { executeAlaSQL } from "Pages/TemplatePages/TemplateBuilder/Table/sqlquerycomponent/alasqlUtils";
import { dataStyler } from "./DataStyling";

export const formatTable = (table) => {

    const dataSource = table.dataSettings.dataSource;
    const skipDateFilter = table.dataSettings.skipDateFilter;
    const sqlQuery = table.dataSettings.sqlSettings.query;
    const columnItems = table.tableSettings.columns;
    const header = table.tableSettings.header;
    const hideColumns = table.tableSettings.hideColumns;


    console.log("JJFILTER table", table)

    console.log("jjfilter columnItems", columnItems);

    let cvData = templateDataStore.getUserCvDataMap()[dataSource];

    // Handle undefined cvData
    if (!cvData || !Array.isArray(cvData)) {
        console.warn(`No data found for dataSource: ${dataSource}`);
        cvData = [];
    }

    cvData = sortSectionData(cvData, dataSource);

    if (!skipDateFilter) {
        cvData = filterDateRanges(cvData, dataSource);
    }

    let dataArray = cvData.map((data) => ({ ...data.data_details }));

    let queryResult = null;

    if (sqlQuery && sqlQuery.trim() !== "") {
        console.log("jjfilter dataArray before execute", dataArray);
        queryResult = executeAlaSQL(sqlQuery, dataArray);
        console.log("jjfilter dataArray", dataArray);
    }

    let rowsToUse = [];

    if (queryResult.success) {
        rowsToUse = queryResult.rows;
    } else {
        console.error("SQL Query failed", sqlQuery);
    }

    let columnsToUse = formatColumnItems(columnItems);

    if (includeRowNumber(columnItems)) {
        rowsToUse = rowsToUse.map((row, index) => ({
            ...row,
            row_number: index + 1
        }));
    }

    // Apply data styling to every cell in every row
    rowsToUse = rowsToUse.map((row) => {
        const styledRow = {};
        Object.keys(row).forEach((key) => {
            styledRow[key] = dataStyler(row[key]);
        });
        return styledRow;
    });

    const [footnotes, rowsToUseWithFootnoteNotation] = formatFootnotes(rowsToUse, columnItems);

    rowsToUse = rowsToUseWithFootnoteNotation;

    // Merge rows for attribute groups with merge=true
    rowsToUse = mergeRowAttributes(rowsToUse, columnItems);

    const formattedTable = {
        type: table.type,
        data: {
            columns: columnsToUse,
            rows: rowsToUse
        },
        header,
        hideColumns,
        sqlSettings: table.dataSettings.sqlSettings,
        footnotes: footnotes,
        sqlTable: queryResult
    }

    console.log("jjfilter formattedTable:", formattedTable);

    return formattedTable;
}

const formatColumnItems = (columnItems) => {
    if (!Array.isArray(columnItems)) return [];

    return columnItems.map((columnItem) => {
        if (columnItem.type === "attribute") {
            return formatAttribute(columnItem);
        } else if (columnItem.type === "attribute_group") {
            return formatAttributeGroup(columnItem);
        }
        return null;
    }).filter(Boolean);
}

const formatAttribute = (attribute) => {
    return {
        headerName: attribute.rename || attribute.originalName,
        field: attribute.key,
        children: undefined
    };
}

const formatAttributeGroup = (attributeGroup) => {

    if (!attributeGroup.merge) {
        return {
            headerName: attributeGroup.name,
            children: formatColumnItems(attributeGroup.children)
        };
    } else {
        return {
            headerName: attributeGroup.name,
            field: `merged_${attributeGroup.id}`,
            children: undefined
        };
    }
}

const formatFootnotes = (rowsToUse, columns) => {
    const footnotes = [];

    const extractFootnotes = (items) => {
        if (!Array.isArray(items)) return;

        items.forEach((item) => {
            // Extract footnote settings from current item
            if (item.footnoteSettings && item.footnoteSettings.footnoteSource && item.footnoteSettings.footnoteTarget) {
                footnotes.push({
                    source: item.footnoteSettings.footnoteSource,
                    target: item.footnoteSettings.footnoteTarget
                });
            }

            // Recursively extract from children
            if (Array.isArray(item.children)) {
                extractFootnotes(item.children);
            }
        });
    };

    extractFootnotes(columns);

    const formatedFootnotes = [];

    let notationCounter = 1;
    footnotes.forEach((footnote) => {
        rowsToUse.forEach((data, index) => {
            if (data[footnote.source] && data[footnote.target]) {
                rowsToUse[index][footnote.target] = `<sup style="background-color: yellow; border-radius: 2px; padding: 0 2px;">${notationCounter}</sup>${rowsToUse[index][footnote.target]}`;
                formatedFootnotes.push(`<sup style="background-color: yellow; border-radius: 2px; padding: 0 2px;">${notationCounter}</sup>${rowsToUse[index][footnote.source]}`)
                notationCounter++;
            }
        })
    })

    return [formatedFootnotes, rowsToUse];
}

const includeRowNumber = (columns) => {
    const hasRowNumber = (items) => {
        if (!Array.isArray(items)) return false;

        for (const item of items) {
            if (item.type === "attribute" && item.key === "row_number") {
                return true;
            }

            // Recursively check children for row attribute key
            if (item.children && item.children.length > 0) {
                if (hasRowNumber(item.children)) {
                    return true;
                }
            }
        }

        return false;
    };

    return hasRowNumber(columns);
}

const mergeRowAttributes = (rows, columns) => {
    // Collect all merge groups with their field keys
    const mergeGroups = [];

    const collectMergeGroups = (items) => {
        if (!Array.isArray(items)) return;

        items.forEach((item) => {
            if (item.type === "attribute_group" && item.merge) {
                // Get all attribute keys from children
                const childKeys = [];
                const collectKeys = (children) => {
                    if (!Array.isArray(children)) return;
                    children.forEach((child) => {
                        if (child.type === "attribute") {
                            childKeys.push(child.key);
                        } else if (child.type === "attribute_group" && child.children) {
                            collectKeys(child.children);
                        }
                    });
                };
                collectKeys(item.children);

                mergeGroups.push({
                    id: item.id,
                    fieldName: `merged_${item.id}`,
                    keys: childKeys
                });
            }

            // Recursively check children
            if (item.children && item.children.length > 0) {
                collectMergeGroups(item.children);
            }
        });
    };

    collectMergeGroups(columns);

    // Apply merges to each row
    if (mergeGroups.length === 0) return rows;

    return rows.map((row) => {
        const updatedRow = { ...row };

        mergeGroups.forEach((group) => {
            // Collect values from all keys in this merge group
            const values = group.keys
                .map((key) => row[key])
                .filter((val) => val !== undefined && val !== null && String(val).trim() !== "")
                .map((val) => String(val).trim());

            // Create merged value with ", " separator
            updatedRow[group.fieldName] = values.join(", ");
        });

        return updatedRow;
    });
}