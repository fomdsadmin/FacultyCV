import { templateDataStore } from "./TemplateDataStore"
import { sortSectionData, filterDateRanges } from "./DateUtils";
import { executeAlaSQL } from "Pages/TemplatePages/TemplateBuilder/Table/sqlquerycomponent/alasqlUtils";

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
    cvData = sortSectionData(cvData, dataSource);

    if (!skipDateFilter) {
        cvData = filterDateRanges(cvData, dataSource);
    }

    let dataArray = cvData.map((data) => ({ ...data.data_details }));

    let queryResult = null;

    if (sqlQuery && sqlQuery.trim() !== "") {
        console.log("jjfilter dataArray before execute", dataArray);
        queryResult = executeAlaSQL(sqlQuery, dataArray);
        dataArray = queryResult.rows;
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

    const footnotesToUse = formatFootnotes(columnItems, dataArray);

    // Merge rows for attribute groups with merge=true
    // Only merge if there are actual merge groups in the template
    if (hasMergeGroups(columnItems)) {
        rowsToUse = mergeRowAttributes(rowsToUse, columnItems);
    }

    const formattedTable = {
        type: table.type,
        data: {
            columns: columnsToUse,
            rows: rowsToUse
        },
        header,
        hideColumns,
        footnotes: footnotesToUse
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

const formatFootnotes = (columns, dataArray) => {
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

    const footnotesData = [];

    footnotes.forEach((footnote) => {
        dataArray.forEach((data, index) => {
            if (data[footnote.source]) {
                footnotesData.push({
                    source: footnote.source,
                    target: footnote.target,
                    rowAssociatedWith: index
                })
            }
        })
    })

    return footnotesData;
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

const hasMergeGroups = (items) => {
    if (!Array.isArray(items)) return false;

    for (const item of items) {
        if (item.type === "attribute_group" && item.merge) {
            return true;
        }

        if (item.children && item.children.length > 0) {
            if (hasMergeGroups(item.children)) {
                return true;
            }
        }
    }

    return false;
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

            // Optionally remove original keys to clean up
            group.keys.forEach((key) => delete updatedRow[key]);
        });

        return updatedRow;
    });
}