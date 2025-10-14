// removeEmptyColumns: prune any leaf columns whose field is empty across all rows.
// Keeps parent groups only if they have surviving children.
function removeEmptyColumns(cols, rows) {
    if (!Array.isArray(cols)) return [];
    return cols
        .map(col => {
            if (col.children && col.children.length) {
                const children = removeEmptyColumns(col.children, rows);
                if (children.length === 0) return null;
                return { ...col, children };
            }

            // leaf column without a field -> keep
            if (!col.field) return col;

            const hasValue = rows ? rows.some(r => {
                const v = r?.[col.field];
                return v !== undefined && v !== null && String(v).trim() !== "";
            }) : false;

            return hasValue ? col : null;
        })
        .filter(Boolean);
}

export function buildCvs(cvs) {
    const cvList = Array.isArray(cvs) ? cvs : [cvs];

    const bodyContent = cvList.map(cv => buildCv(cv)).join('\n<hr style="page-break-after:always;border:none;margin:24px 0;" />\n');

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>All CVs</title>
  <style>
    @page { size: A4; margin: 1cm; }
    html,body { height: 100%; }
    body {
      font-family: sans-serif;
      width: 100%;      /* A4 width */
      margin: 0;
      padding: 0;
    }
    .cv-root { margin-bottom: 16px; }
    .cv-meta { font-size: 12px; color: #222; margin-bottom: 10px; line-height: 1.3; }
    .group h2 { margin: 12px 0 6px; padding-bottom: 4px; font-weight:700; }
    table {
      border-collapse: collapse;
      margin-bottom: 20px;
      width: 100%;
      table-layout: auto;
    }
    th, td {
      border: 1px solid black;
      padding: 1px;
      text-align: left;
      white-space: normal;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    th { background: #f2f2f2; font-weight: 700; }
    .notes-section { margin-top: 8px; font-size: 12px; }
    .notes-section h4 { margin: 6px 0; font-size: 13px; }
    .date-div {
        display: inline-block;
        white-space: nowrap;
    }
    .link-wrap {
        min-width: 0;
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-all;
        display: block;
    }

   /* stop browsers from repeating the thead as a page header when printing/PDF */
   thead {
     /* default for printing is table-header-group (repeats) — override to stop repeating */
     display: table-row-group;
   }

   /* allow rows to break across pages (avoid forcing 'avoid' which can cause content to be skipped) */
   tr {
     page-break-inside: avoid;
     break-inside: avoid;
   }

   /* ensure tbody behaves normally for page breaks */
   tbody {
     display: table-row-group;
   }

  /* print-specific safety: don't hide content and allow tables to break */
  @media print {
    table { page-break-inside: auto; break-inside: auto; }
   /* reinforce no-split for rows when printing */
   tr { page-break-inside: avoid; break-inside: avoid; }
    thead { display: table-row-group; } /* keep headers in DOM but not repeated */
    tfoot { display: table-row-group; }
    .group, .table-with-notes, .notes-section { -webkit-print-color-adjust: exact; break-inside: auto; page-break-inside: auto; }
    /* Avoid accidental display:none from other print rules */
    * { visibility: visible !important; }
  }
  /* ensure consistent spacing between tables */
  .table-with-notes {
    display: block;          /* wrapper is a block */
    margin: 12px 0 20px;     /* space around each table wrapper */
    padding-top: 6px;        /* small gap above table if needed */
    box-sizing: border-box;
  }
    .table-with-notes.no-padding  {
        display: block;          /* wrapper is a block */
        margin: 0;     /* space around each table wrapper */
        padding-top: 6px;        /* small gap above table if needed */
        box-sizing: border-box;
  }
  /* avoid depending on table margin-collapse — let wrapper control spacing */
  .table-with-notes > table {
    margin: 0;
    width: 100%;
    border-collapse: collapse;
  }
  /* if two wrappers are adjacent, enforce a clear gap */
  .table-with-notes + .table-with-notes {
    margin-top: 20px;
  }
  /* extra space for notes area */
  .table-with-notes .notes-section { margin-top: 12px; }
  /* no padding/margin for tables with noPadding flag */
  .table-with-notes.no-padding {
    margin: 0;
    padding: 0;
  }
  .table-with-notes.no-padding > table {
    margin: 0;
  }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;

    return fullHtml;
}

function buildUserInfoTable(cv) {
    const {
        current_date,
        date_range_text,
        first_name,
        joined_date,
        last_name,
        middle_name,
        primary_department,
        primary_faculty,
        rank,
        rankSinceDate,
        sort_order
    } = cv;

    // meta as a two-column table (label / value)
    let html = `<table class="cv-meta" style="color:#222;margin-bottom:10px;line-height:1.3;border-collapse:collapse;width:100%;font-size:16px">`;

    const addRow = (label, value) => {
        html += `<tr>`;
        html += `<th>${label}</th>`;
        html += `<td>${value}</td>`;
        html += `</tr>`;
    };

    const fullName = [first_name, middle_name, last_name].filter(Boolean).join(' ');

    if (fullName) addRow('Name:', fullName);
    if (rank) addRow('Rank:', rank);
    if (primary_department) addRow('Department:', primary_department);
    if (primary_faculty) addRow('Faculty:', primary_faculty);
    if (date_range_text) addRow('Date Range:', date_range_text);
    if (current_date) addRow('Generated:', current_date);
    if (joined_date) addRow('Joined:', joined_date);
    if (rankSinceDate) addRow('Rank Since:', rankSinceDate);
    if (sort_order !== undefined) addRow('Sort Order:', sort_order);

    html += `</table>`;
    html += `</div>`; // .cv-root

    return html;
}

function buildHeader(cv) {
    const {
        start_year,
        end_year,
        template_title,
        sort_order
    } = cv;
    console.log(cv);
    let html = '';
    html += '<div style="background-color: white; color: black; padding: 20px; text-align: center;">';
    html += '<div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 5px;">University of British Columbia</div>';
    html += `<div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 10px;">${template_title}</div>`;
    html += `<div style="font-size: 1rem; font-weight: 700;">(${start_year} - ${end_year}, ${sort_order})</div>`;
    html += '</div>';
    return html;
}

function buildDeclarationReport(cv) {
    const { latest_declaration } = cv;
    
    if (!latest_declaration) {
        return '';
    }

    // Use the same DECLARATION_LABELS from Declarations.jsx
    const DECLARATION_LABELS = {
        coi: {
            YES: "Yes, my Conflict of Interest and Conflict of Commitment declarations are up to date.",
            NO: "No, my Conflict of Interest and Conflict of Commitment declarations are NOT up to date.",
        },
        fomMerit: {
            YES: "Yes, I do wish to be awarded merit by the Dean for my academic activities performed during",
            NO: "No, I do NOT wish to be awarded merit by the Dean for my academic activities performed during",
        },
        psa: {
            YES: "Yes, I do wish to be considered for PSA.",
            NO: "No, I do NOT wish to be considered for PSA.",
        },
        promotion: {
            YES: "Yes, I do wish to be considered for promotion.",
            NO: "No, I do NOT wish to be considered for promotion.",
        },
    };

    let html = '';
    html += `
        <div class="group">
            <h2>
                <span style="display:inline-block; border-bottom: 3px solid #000;">Declaration</span>
            </h2>
        </div>
    `;

    const currentYear = new Date().getFullYear();
    const isCurrent = latest_declaration.year === currentYear;
    const isNext = latest_declaration.year === currentYear + 1;
    
    html += `
        <div style="margin-bottom: 20px; line-height: 1.5;">
            <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">
                ${latest_declaration.year}
                ${isCurrent ? '<span style="margin-left: 10px; padding: 4px 8px; font-size: 14px; background-color: #dbeafe; color: #1e40af; border-radius: 4px; font-weight: 600;">Current</span>' : ''}
                ${isNext ? '<span style="margin-left: 10px; padding: 4px 8px; font-size: 14px; background-color: #d1fae5; color: #047857; border-radius: 4px; font-weight: 600;">Next</span>' : ''}
            </div>

            <div style="margin-bottom: 16px;">
                <div style="font-weight: 700; margin-bottom: 4px;"><strong>Conflict of Interest and Commitment:</strong></div>
                <div style="margin-bottom: 4px;">
                    ${DECLARATION_LABELS.coi[latest_declaration.coi] || latest_declaration.coi}
                </div>
                ${latest_declaration.coiSubmissionDate ? `
                    <div style="margin-bottom: 4px;">
                        <strong>Submission Date:</strong> ${latest_declaration.coiSubmissionDate}
                    </div>
                ` : ''}
            </div>

            <div style="margin-bottom: 16px;">
                <div style="font-weight: 700; margin-bottom: 4px;"><strong>FOM Merit & PSA:</strong></div>
                <div style="margin-bottom: 4px;">
                    ${DECLARATION_LABELS.fomMerit[latest_declaration.fomMerit]} January 1, ${latest_declaration.year} - December 31, ${latest_declaration.year}
                </div>
                <div style="margin-bottom: 4px;">
                    ${DECLARATION_LABELS.psa[latest_declaration.psa]}
                </div>
                ${latest_declaration.psaSubmissionDate ? `
                    <div style="margin-top: 8px;">
                        <strong>Submission Date:</strong> ${latest_declaration.psaSubmissionDate}
                    </div>
                ` : ''}
            </div>

            <div style="margin-bottom: 16px;">
                <div style="font-weight: 700; margin-bottom: 4px;"><strong>FOM Promotion Review:</strong></div>
                <div style="margin-bottom: 4px;">
                    ${DECLARATION_LABELS.promotion[latest_declaration.promotion] || latest_declaration.promotion}
                </div>
                ${latest_declaration.promotionEffectiveDate ? `
                    <div style="margin-top: 4px;">
                        <strong>Effective Date:</strong> July 1, ${latest_declaration.promotionEffectiveDate}
                    </div>
                ` : ''}
                ${latest_declaration.promotionPathways ? `
                    <div style="margin-top: 8px;">
                        <strong>Research Stream Pathways:</strong><br>
                        ${latest_declaration.promotionPathways.split(',').map(pathway => 
                            pathway.trim()
                        ).join('<br>')}
                    </div>
                ` : ''}
                ${latest_declaration.supportAnticipated ? `
                    <div style="margin-top: 8px;">
                        <strong>Support Anticipated:</strong> ${latest_declaration.supportAnticipated}
                    </div>
                ` : ''}
                ${latest_declaration.promotionSubmissionDate ? `
                    <div style="margin-top: 8px;">
                        <strong>Submission Date:</strong> ${latest_declaration.promotionSubmissionDate}
                    </div>
                ` : ''}
            </div>

            ${latest_declaration.honorific ? `
                <div style="margin-bottom: 16px;">
                    <div style="font-weight: 700; margin-bottom: 4px;"><strong>Honorific Impact Report:</strong></div>
                    <div>
                        ${latest_declaration.honorific}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    return html;
}

function buildCv(cv) {
    const {
        groups
    } = cv;

    // Top block: template title (large, bold) then key details in a table
    let html = '';

    html += buildHeader(cv);
    html += buildUserInfoTable(cv);

    // Groups (under the header)
    if (Array.isArray(groups) && groups.length) {
        groups.forEach(group => {
            html += buildGroup(group);
        });
    }

    // Add declaration at the end
    html += buildDeclarationReport(cv);

    return html;
}

function buildGroup(group) {
    const { title, tables } = group;
    let html = '';

    html += `
        <div class="group">
            <h2>
                <span style="display:inline-block; border-bottom: 3px solid #000;">${title}</span>
            </h2>
    `;

    if (tables.flatMap((t) => t.rows).length === 0) {
        html += "No data entries"
    }

    tables.forEach(table => {
        html += buildTable(table);
    });

    html += '</div>';
    return html;
}

function buildTable(table) {
    const { columns, rows, justHeader, noPadding } = table;

    let filteredColumns;
    if (!justHeader) {
        // prune empty columns first
        filteredColumns = removeEmptyColumns(columns, rows);

        // if no columns remain or no rows, treat table as empty and don't render it
        if (!filteredColumns || filteredColumns.length === 0 || !rows || rows.length === 0) {
            return '';
        }
    }

    // Helper: calculate max depth of columns
    function getDepth(cols) {
        return cols.reduce((max, col) => {
            if (col.children) return Math.max(max, 1 + getDepth(col.children));
            return Math.max(max, 1);
        }, 0);
    }

    const depth = getDepth(filteredColumns || columns);

    // Build header rows
    const headerRows = Array.from({ length: depth }, () => []);

    function processColumn(col, level) {
        const hasChildren = !!col.children && col.children.length > 0;
        if (hasChildren) {
            const colspan = countLeafColumns(col);
            headerRows[level].push({ name: col.headerName, colspan, rowspan: 1 });
            col.children.forEach(child => processColumn(child, level + 1));
        } else {
            headerRows[level].push({ name: col.headerName, colspan: 1, rowspan: depth - level });
        }
    }

    function countLeafColumns(col) {
        if (!col.children) return 1;
        return col.children.reduce((sum, c) => sum + countLeafColumns(c), 0);
    }

    (filteredColumns || columns).forEach(col => processColumn(col, 0));

    // remove any header rows that contain only empty names (e.g. ["", ""])
    const visibleHeaderRows = headerRows.filter(row =>
        row.some(cell => String(cell?.name ?? '').trim() !== '')
    );

    // Generate header HTML from filtered rows
    const headerHtml = visibleHeaderRows
        .map(row =>
            '<tr>' +
            row.map(cell => `<th${cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ''}${cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ''}>${cell.name}</th>`).join('') +
            '</tr>'
        ).join('\n');

    // Flatten columns to get order of fields
    function flattenColumns(cols) {
        return cols.flatMap(c => (c.children ? flattenColumns(c.children) : c));
    }

    const flatColumns = flattenColumns(filteredColumns || columns);

    const bodyHtml = rows
        .map(row => '<tr>' + flatColumns.map(c => `<td>${dataStyler(row[c.field] ?? '')}</td>`).join('') + '</tr>')
        .join('\n');

    // Return full table HTML
    const wrapperClass = noPadding ? 'table-with-notes no-padding' : 'table-with-notes';
    const notesHtml = buildNotes(table.note_sections);
    return `<div class="${wrapperClass}">
            <table border="1" cellspacing="0" cellpadding="5">
            <thead>
            ${headerHtml}
            </thead>
            <tbody>
            ${bodyHtml}
            </tbody>
            </table>
            ${notesHtml}
            </div>`;
}

function genericDataStyler(data) {

    const wordArray = String(data).trim().split(/\s+/);

    const formattedArray = wordArray.map((word) => {
        if (isUrl(word)) {
            return linkWrapper(word);
        }

        if (isDOI(word)) {
            return doiWrapper(word);
        }

        return word;
    })

    const formattedData = formattedArray.join(" ");

    return formattedData;

}

function doiWrapper(doi) {
    const cleanedDoi = String(doi).trim().replace(/[,.]$/, '');

    const link = `https://doi.org/${cleanedDoi}`;

    // Check the original string for a trailing comma and append it if found.
    if (String(doi).endsWith(',')) {
        return `<a href="${link}">${doi}</a>`;
    }

    return `<a href="${link}">${doi}</a>`;
}

function isDOI(str) {
    const cleanedStr = String(str).trim().replace(/,$/, '');
    const doiRegex = /^10.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/;

    return doiRegex.test(cleanedStr);
}

function dataStyler(data) {

    if (isDateData(data)) {
        return dateDataStyler(data);
    }

    return genericDataStyler(data);
}

function dateDataStyler(data) {
    function isNumber(word) {
        return /^\d+$/.test(word);
    }

    function monthAbbreviator(word) {
        const month = String(word).replace(/[^a-z]/g, '').toLowerCase();

        const monthMap = {
            "january": "Jan",
            "february": "Feb",
            "march": "Mar",
            "april": "Apr",
            "may": "May",
            "june": "Jun",
            "july": "Jul",
            "august": "Aug",
            "september": "Sep",
            "october": "Oct",
            "november": "Nov",
            "december": "Dec"
        };

        return monthMap[month];
    }

    const cleanedData = String(data).trim().toLowerCase();
    const wordArray = cleanedData.split(/\s+/);

    const formattedWordArray = wordArray.map(word => {
        if (word === "-") {
            return "-<br/>"; // break on dash
        } else if (isNumber(word)) {
            return word;
        } else {
            return monthAbbreviator(word) ?? word;
        }
    });

    return `<div class="date-div">${formattedWordArray.join(" ")}</div>`; // normal spaces only
}



function isDateData(data) {

    function isMonthsAndNumbers(str) {
        // Split on spaces or commas
        const parts = str.split(/[\s,]+/).filter(Boolean);

        return parts.every(part =>
            allowedMonths.includes(part.toLowerCase()) || /^\d+$/.test(part)
        );
    }

    let cleanedData = String(data).replace(/[^a-zA-Z0-9 ]/g, "").toLowerCase();
    const allowedMonths = [
        "january", "jan",
        "february", "feb",
        "march", "mar",
        "april", "apr",
        "may",
        "june", "jun",
        "july", "jul",
        "august", "aug",
        "september", "sep", "sept",
        "october", "oct",
        "november", "nov",
        "december", "dec"
    ];

    return isMonthsAndNumbers(cleanedData);
}

function isUrl(string) {
    const urlPattern = /https?:\/\/[^\s]+/i;
    return urlPattern.test(string);
}

function linkWrapper(link) {
    return `<div class="link-wrap"><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></div>`;
}

function buildNotes(noteSections) {
    if (!noteSections || noteSections.length === 0) {
        return '';
    }

    let html = '';
    noteSections.forEach((noteSection) => {
        if (!noteSection?.notes || noteSection.notes.length === 0) {
            return;
        }

        const { notes, title } = noteSection;

        html += `
            <div class="notes-section" style="margin-bottom:16px;">
                <h4 style="
                    font-size: 19px; 
                    margin: 0 0 12px; 
                    font-weight: 600; 
                    text-decoration: underline;
                    color: #333;
                ">${title}</h4>
        `;

        notes.forEach((note) => {
            const { key, value } = note;
            html += `
                <div style="margin-bottom:8px;">
                    <div style="
                        font-size: 18px;
                        font-weight: 700;
                        color: black ;
                    ">${key}:</div>
                    <div style="
                        font-size: 16px;
                        background-color: #f0f0f0;
                        padding: 6px 8px;
                        border-radius: 4px;
                        margin-top: 2px;
                        color: #333;
                        line-height:1.4;
                    ">${value}</div>
                </div>
            `;
        });

        html += `</div>`;
    });

    return html;
}
