import React, { useMemo, useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { buildCv } from "../FormatedData";
import { buildCvs } from "../TableBuilder";
import { formatUserTables } from "../FormatTemplateToTable/FormatTemplateToTable";
import { buildUserCvs } from "../UserCvTableBuilder/UserCvTableBuilder";

/**
 * Demo AgGrid with column grouping.
 * No external CSS file — uses Tailwind classes and inline styles for borders.
 */
const AgGrid = ({ userInfoInput, templateWithEndStartDate, previewRef }) => {
    const containerRef = useRef(null);

    // clone node and inline computed styles so the serialized HTML keeps styling
    const cloneWithInlineStyles = (node) => {
        if (!node) return null;
        const clone = node.cloneNode(false);

        if (node.nodeType === Node.ELEMENT_NODE) {
            const cs = window.getComputedStyle(node);
            let styleText = "";
            for (let i = 0; i < cs.length; i++) {
                const prop = cs[i];
                styleText += `${prop}:${cs.getPropertyValue(prop)};`;
            }
            if (styleText) clone.setAttribute("style", styleText);
        } else if (node.nodeType === Node.TEXT_NODE) {
            clone.textContent = node.textContent;
        }

        for (let child = node.firstChild; child; child = child.nextSibling) {
            const childClone = cloneWithInlineStyles(child);
            if (childClone) clone.appendChild(childClone);
        }
        return clone;
    };

    const logContainerHtmlWithStyles = async () => {
        if (!containerRef.current) return;
        const cloned = cloneWithInlineStyles(containerRef.current);
        const html = cloned.outerHTML;
        console.log("container HTML with inlined styles:", html);
        // (optional) copy to clipboard for easy pasting
        try { await navigator.clipboard.writeText(html); } catch (_) { }
    };

    const [cvs, setCvs] = useState(null);
    const [htmlOutput, setHtmlOutput] = useState("");

    useEffect(() => {
        const helper = async () => {
            const cvs = await buildCv(userInfoInput, templateWithEndStartDate);
            console.log("JJFILTER FORMAT USER TABLES", await formatUserTables(userInfoInput, templateWithEndStartDate));
            setCvs(cvs);

            // 2️⃣ Combine them into one HTML document
            if (cvs) {
                const fullHtml = buildCvs(cvs);
                // console.log("JJJFILTER fullhtml: ", fullHtml);
            }

            const html = buildUserCvs(await formatUserTables(userInfoInput, templateWithEndStartDate));
            console.log("JJJFILTER fullhtml: ", html);
        }

        if (userInfoInput && templateWithEndStartDate) {
            helper();
        }
    }, [userInfoInput, templateWithEndStartDate])

    // derive flat list of tables (cheap) and avoid mapping inside render every time
    const tableList = useMemo(() => {
        if (!cvs) return [];
        const out = [];
        cvs.forEach((cv) => {
            cv.groups.forEach((group) => {
                group.tables.forEach((table) => {
                    out.push({
                        table,
                        title: table.title || group.title || "Table",
                    });
                });
            });
        });
        return out;
    }, [cvs]);

    const columnDefs =
        () => {
            const baseHeaderClass = "border-r border-gray-200"; // Tailwind applied to header cells
            const baseCellStyle = { borderRight: "1px solid rgba(0,0,0,0.08)" }; // inline for body cells



            return [
                {
                    headerName: "Person",
                    children: [
                        {
                            headerName: "ID",
                            field: "id",
                            minWidth: 50,
                            resizable: true,
                            headerClass: baseHeaderClass,
                            cellStyle: baseCellStyle
                        },
                        {
                            headerName: "Name",
                            field: "name",
                            resizable: true,
                            wrapText: true,
                            autoHeight: true,
                            headerClass: baseHeaderClass,
                            cellStyle: { ...baseCellStyle, whiteSpace: "normal" },
                        },
                    ],
                },
                {
                    headerName: "Details",
                    children: [
                        {
                            headerName: "Role",
                            field: "role",
                            resizable: true,
                            wrapText: true,
                            autoHeight: true,
                            headerClass: baseHeaderClass,
                            cellStyle: { ...baseCellStyle, whiteSpace: "normal" },
                        },
                        {
                            headerName: "Title",
                            field: "title",
                            resizable: true,
                            wrapText: true,
                            autoHeight: true,
                            headerClass: baseHeaderClass,
                            cellStyle: { ...baseCellStyle, whiteSpace: "normal" },
                        },
                        {
                            headerName: "Period",
                            field: "period",
                            resizable: true,
                            wrapText: true,
                            autoHeight: true,
                            headerClass: baseHeaderClass,
                            cellStyle: { ...baseCellStyle, whiteSpace: "normal" },
                        },
                        {
                            headerName: "Note",
                            field: "note",
                            resizable: true,
                            wrapText: true,
                            autoHeight: true,
                            headerClass: baseHeaderClass,
                            cellStyle: { ...baseCellStyle, whiteSpace: "normal" },
                        },
                    ],
                },
            ];
        }

    const rowData =
        [
            {
                id: 1,
                name: "Alice Smith",
                role: "Professor of Computer Science and Applied AI",
                title: "Artificial Intelligence Research and Long Title Example That Wraps",
                period: "2018 - Present",
                note: "Lead investigator working on multiple long projects that should wrap across several lines to demonstrate auto row height.",
            },
            {
                id: 2,
                name: "Bob Jones",
                role: "Lecturer",
                title: "Course Development",
                period: "2016 - 2020",
                note: "Course lead",
            },
            {
                id: 3,
                name: "Cara Zhang",
                role: "Postdoc",
                title: "Quantum Lab",
                period: "2020 - Present",
                note: "Research fellow with extra details to show line wrap.",
            },
        ]


    return (
        // ReportsPage must give this container a height (e.g. 90vh). Use 100% to fill it.
        <div style={{ width: "0%", height: "0%" }}>
            <div ref={previewRef || containerRef} className="ag-theme-alpine" style={{ width: "0%", height: "0%" }}>
                <div dangerouslySetInnerHTML={{ __html: htmlOutput }} />
            </div>
        </div>
    );
};

export default AgGrid;