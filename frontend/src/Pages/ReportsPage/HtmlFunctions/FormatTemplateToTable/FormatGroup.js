import { formatTableItems } from "./FormatItems"

export const formatTableGroup = (tableGroup) => {
    return {
        items: formatTableItems(tableGroup.children),
        header: tableGroup.groupSettings.header,
        type: tableGroup.type
    }
}