import { formatTableItems } from "./FormatItems"

export const formatTableGroup = (tableGroup, templateDataStore) => {
    return {
        items: formatTableItems(tableGroup.children, templateDataStore),
        groupSettings: tableGroup.groupSettings,
        type: tableGroup.type
    }
}