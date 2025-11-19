import { useEffect } from "react";
import { formatUserTables } from "../FormatTemplateToTable/FormatTemplateToTable";
import { buildUserCvs } from "../UserCvTableBuilder/UserCvTableBuilder";

/**
 * Demo AgGrid with column grouping.
 * No external CSS file — uses Tailwind classes and inline styles for borders.
 */
const AgGrid = ({ userInfoInput, templateWithEndStartDate, previewRef }) => {
    useEffect(() => {
        const helper = async () => {
            const html = await buildUserCvs(await formatUserTables(userInfoInput, templateWithEndStartDate));
            console.log("JJJFILTER fullhtml: ", html);
        }

        if (userInfoInput && templateWithEndStartDate) {
            helper();
        }
    }, [userInfoInput, templateWithEndStartDate])

    return (
        // ReportsPage must give this container a height (e.g. 90vh). Use 100% to fill it.
        <div style={{ width: "0%", height: "0%" }}>
        </div>
    );
};

export default AgGrid;