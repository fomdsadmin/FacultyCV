import { buildDeclarationReport } from "./BuildDeclarationReport";
import { buildItem } from "./BuildItems";
import { UserCvStore } from "./UserCvStore";

export function buildUserCvs(cvs) {
  const cvList = Array.isArray(cvs) ? cvs : [cvs];

  const bodyContent = cvList
    .map((cv) => buildUserCv(cv))
    .join('\n<hr style="page-break-after:always;border:none;margin:24px 0;" />\n');

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

   /* Author formatting classes for publications */
   .author-trainee {
     text-decoration: underline;
   }
   .author-doctoral-supervisor {
     font-style: italic;
   }
   .author-postdoctoral-supervisor {
     font-weight: bold;
     font-style: italic;
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

function buildUserCv(cv) {
  const { items } = cv;

  const userCvStore = new UserCvStore(cv);

  // Top block: template title (large, bold) then key details in a table
  let html = "";

  html += '<div class="cv-root">';
  html += buildHeader(cv);
  html += buildUserInfoTable(cv);

  // Groups (under the header)
  if (Array.isArray(items) && items.length) {
    items.forEach((item) => {
      html += buildItem(item, cv.show_visual_nesting);
    });
  }

  if (cv.show_declaration) {
    // Add declaration at the end
    html += buildDeclarationReport(userCvStore);
  }

  html += '</div>'; // close cv-root

  return html;
}

function buildHeader(cv) {
  const { start_year, end_year, template_title, sort_order } = cv;


  const fomLogoUrl =
    "https://med-fom-mednet.sites.olt.ubc.ca/files/2022/10/Faculty-of-Medicine-Unit-Signature-940x157.jpeg";

  let html = "";
  html += '<div style="background-color: white; color: black; padding: 20px; text-align: center;">';

  if (cv.show_fom_logo) {
    html += `<div style="flex:0 0 auto;"><img src="${fomLogoUrl}" alt="UBC Faculty of Medicine - Faculty of Medicine Logo" style="height:96px; display:block;" /></div>`;
  }

  //html += '<div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 5px;">University of British Columbia</div>';
  html += `<div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 10px;">${template_title}</div>`;
  html += `<div style="font-size: 1rem; font-weight: 700;">(${start_year} - ${end_year}, ${sort_order})</div>`;
  html += "</div>";
  return html;
}

export function buildUserInfoTable(cv) {
  // meta as a two-column table (label / value)
  let html = `<table class="cv-meta" 
  style="
    color:#222;
    margin-bottom:10px;
    line-height:1.3;
    width:100%;
    font-size:16px;
    border-collapse:collapse;
  ">
  <style>
    .cv-meta tr {
      display: flex;
      width: 100%;
    }
    .cv-meta th,
    .cv-meta td {
      flex: 1;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
      box-sizing: border-box;
      border: 1px solid #ccc; /* optional: for clarity */
    }
  </style>
`;

  const addRow = (lablesValuesArray) => {
    html += `<tr>`;
    html += lablesValuesArray
      .map((lablesValues, index) => {
        if (index % 2 === 0) {
          return `<th>${lablesValues}</th>`;
        } else {
          return `<td>${lablesValues}</td>`;
        }
      })
      .join("");
    html += `</tr>`;
  };

  const fullName = [cv?.first_name, cv?.last_name].filter(Boolean).join(" ");

  addRow(["Name:", fullName]);
  addRow(["Rank:", cv?.primary_unit?.[0]?.rank || "", "Since:", cv?.primary_unit?.[0]?.additional_info?.start || ""]);
  addRow(["Timeline for next promotion review:", ""]);
  addRow(["Department:", cv?.primary_unit?.[0]?.unit || ""]);
  addRow(["Joint Department:", ""]);
  addRow(["Centre Affiliation:", cv.institution]);
  addRow(["Distributed Site:", cv?.hospital_affiliations?.[0]?.authority || ""]);
  addRow(["Assigned Mentor:", ""]);
  addRow(["Submission Date:", new Date().toLocaleDateString("en-CA")]);

  html += `</table>`;

  return html;
}