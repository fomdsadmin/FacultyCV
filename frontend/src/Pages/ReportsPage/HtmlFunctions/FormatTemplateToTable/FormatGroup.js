import { formatTableItems } from "./FormatItems"

export const formatTableGroup = (tableGroup) => {
    return {
        items: formatTableItems(tableGroup.children),
        groupSettings: tableGroup.groupSettings,
        type: tableGroup.type
    }
}