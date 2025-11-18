
import { formatTable } from "./FormatTable"
import { formatTableGroup } from "./FormatGroup";

export const formatTableItems = (items, templateDataStore) => {
    const formattedItems = [];
    items.forEach((item) => {
        if (item.type === "table") {
            formattedItems.push(formatTable(item, templateDataStore))
        } else {
            formattedItems.push(formatTableGroup(item, templateDataStore));
        }
    })

    return formattedItems;
}