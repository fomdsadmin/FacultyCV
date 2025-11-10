
import { formatTable } from "./FormatTable"
import { formatTableGroup } from "./FormatGroup";

export const formatTableItems = (items) => {
    const formattedItems = [];
    items.forEach((item) => {
        if (item.type === "table") {
            formattedItems.push(formatTable(item))
        } else {
            formattedItems.push(formatTableGroup(item));
        }
    })

    return formattedItems;
}