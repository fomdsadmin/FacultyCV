import { sortSectionData, filterDateRanges, appendMissingEndDateWithCurrent } from "./DateUtils";
import { executeAlaSQLQueries } from "Pages/TemplatePages/TemplateBuilder/Table/sqlquerycomponent/alasqlUtils";
import { dataStyler } from "./DataStyling";

const getCleanedDataSourceDataArray = (dataSource, templateDataStore, table) => {

    const skipDateFilter = table.dataSettings.skipDateFilter;
    const fillMissingEndDateWithCurrent = table.dataSettings.fillMissingEndDateWithCurrent;

    let cvData = templateDataStore.getUserCvDataMap()[dataSource];

    // Handle undefined cvData
    if (!cvData || !Array.isArray(cvData)) {
        console.warn(`No data found for dataSource: ${dataSource}`);
        cvData = [];
    }

    cvData = sortSectionData(cvData, dataSource, templateDataStore);

    if (fillMissingEndDateWithCurrent) {
        cvData = appendMissingEndDateWithCurrent(cvData, dataSource, templateDataStore)
    }

    if (!skipDateFilter) {
        cvData = filterDateRanges(cvData, dataSource, templateDataStore);
    }

    const dataArray = cvData.map((data) => ({ ...data.data_details }));

    return dataArray;
}

export const formatTable = (table, templateDataStore) => {

    const dataSources = table.dataSettings.sqlSettings.dataSources;
    const columnItems = table.tableSettings.columns;
    const header = table.tableSettings.header;
    const hideColumns = table.tableSettings.hideColumns;

    let cleanedCvDataMap = {};

    dataSources.forEach((obj) => {
        const { dataSource, tableName } = obj;
        cleanedCvDataMap[tableName] = getCleanedDataSourceDataArray(dataSource, templateDataStore, table);
    });

    let queryResult = null;

    if (table.dataSettings.sqlSettings && table.dataSettings.sqlSettings.queries && table.dataSettings.sqlSettings.queries.length > 0) {
        queryResult = executeAlaSQLQueries(table.dataSettings.sqlSettings, cleanedCvDataMap);
    }

    let rowsToUse = [];

    if (queryResult && queryResult.success && queryResult.finalResult) {
        rowsToUse = queryResult.finalResult;
    } else if (queryResult && queryResult.errors && queryResult.errors.length > 0) {
        console.error("SQL Query execution failed:", queryResult.errors);
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
        name: table.name,
        type: table.type,
        data: {
            columns: columnsToUse,
            rows: rowsToUse
        },
        header,
        hideColumns,
        tableSettings: table.tableSettings,
        dataSettings: table.dataSettings,
        footnotes: footnotes,
        sqlTable: queryResult
    }

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
        field: attribute.keyRename || attribute.key,
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
                            childKeys.push(child.keyRename || child.key);
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
            const values = group.keys
                .map((key) => row[key])
                .filter((val) => {
                    if (val === undefined || val === null) return false;

                    // Convert to string and trim whitespace
                    let text = String(val).trim();

                    // Remove HTML tags
                    text = text.replace(/<[^>]*>/g, "");

                    // Remove &nbsp; and other HTML spaces
                    text = text.replace(/&nbsp;/g, "").trim();

                    // Normalize lower-case value
                    const cleaned = text.toLowerCase();

                    // Remove fake empties
                    if (cleaned === "" || cleaned === "null" || cleaned === "undefined") {
                        return false;
                    }

                    return true;
                })
                .map((val) => {
                    // Return cleaned trimmed string for output
                    return String(val).trim();
                });

            updatedRow[group.fieldName] = values.join(", ");
        });

        return updatedRow;
    });
}