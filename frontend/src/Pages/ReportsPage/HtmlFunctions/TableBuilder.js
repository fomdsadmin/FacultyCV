// removeEmptyColumns: prune any leaf columns whose field is empty across all rows.
// Keeps parent groups only if they have surviving children.
function removeEmptyColumns(cols, rows) {
    if (!Array.isArray(cols)) return [];
    if (!Array.isArray(rows)) rows = [];
    return cols
        .map((col) => {
            if (col.children && col.children.length) {
                const children = removeEmptyColumns(col.children, rows);
                if (children.length === 0) return null;
                return { ...col, children };
            }

            // leaf column without a field -> keep
            if (!col.field) return col;

            const hasValue = rows
                ? rows.some((r) => {
                    const v = r?.[col.field];
                    return v !== undefined && v !== null && String(v).trim() !== "";
                })
                : false;

            return hasValue ? col : null;
        })
        .filter(Boolean);
}

export function buildCvs(cvs) {
    const cvList = Array.isArray(cvs) ? cvs : [cvs];

    const bodyContent = cvList
        .map((cv) => buildCv(cv))
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

function buildUserInfoTable(cv) {
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
    html += `</div>`; // .cv-root

    return html;
}

function buildHeader(cv) {
    const { start_year, end_year, template_title, sort_order } = cv;
    console.log(cv);

    const includeFomLogo = String(template_title || "")
        .toLowerCase()
        .includes("fom");
    const fomLogoUrl =
        "https://med-fom-mednet.sites.olt.ubc.ca/files/2022/10/Faculty-of-Medicine-Unit-Signature-940x157.jpeg";

    let html = "";
    html += '<div style="background-color: white; color: black; padding: 20px; text-align: center;">';

    if (includeFomLogo) {
        html += `<div style="flex:0 0 auto;"><img src="${fomLogoUrl}" alt="UBC Faculty of Medicine - Faculty of Medicine Logo" style="height:96px; display:block;" /></div>`;
    }

    //html += '<div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 5px;">University of British Columbia</div>';
    html += `<div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 10px;">${template_title.replace(
        "FoM",
        ""
    )}</div>`;
    html += `<div style="font-size: 1rem; font-weight: 700;">(${start_year} - ${end_year}, ${sort_order})</div>`;
    html += "</div>";
    return html;
}

function buildConflictOfInterestPage(latest_declaration, userInfo) {
    const { first_name, last_name } = userInfo || {};
    const fullName = [first_name, last_name].filter(Boolean).join(" ");
    const coiValue = latest_declaration && latest_declaration.coi ? latest_declaration.coi : null;
    const submissionDate = latest_declaration?.coiSubmissionDate || "";

    // Return a styled fragment (no DOCTYPE/head) that mirrors the provided template.
    return `
      <div style="page-break-before: always;"></div>

      <!-- Removed grey outer background; use clean white page background -->
      <div style="background:#fff;padding:0;">
        <div style="max-width:64rem;margin:0 auto;background:#fff;padding:32px;">

          <!-- Header with Logo -->
          <div style="display:flex;align-items:center;gap:32px;margin-bottom:48px;">
            <img src="https://www.med.ubc.ca/files/2017/05/logo.jpg" alt="UBC Faculty of Medicine - Faculty of Medicine Logo" style="height:96px;display:block;" />
          </div>

          <!-- Title -->
          <h1 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:48px;">
            Conflict of Interest and Commitment Declaration
          </h1>

          <!-- Name Field -->
          <div style="margin-bottom:32px;">
            <label style="font-size:24px;font-weight:700;display:block;margin-bottom:8px;">Name:</label>
            <div style="border-bottom:2px solid #d1d5db;margin-top:8px;padding-bottom:4px;font-size:18px;font-weight:600;">
              ${fullName || ""}
            </div>
          </div>

          <!-- Policy Information -->
          <div style="margin-bottom:32px;font-size:18px;line-height:1.6;">
            <p>
              In accordance with
              <a href="#" style="color:#2563eb;text-decoration:underline;font-weight:600;">UBC Policy SC3</a>,
              you must maintain up-to-date Conflict of Interest and Conflict of Commitment declarations.
              For more information regarding Conflict of Interest and Commitment, please refer to the
              <a href="#" style="color:#2563eb;text-decoration:underline;font-weight:600;">Office of the University Counsel</a>
              and the
              <a href="#" style="color:#2563eb;text-decoration:underline;font-weight:600;">UBC Office of Research Services</a>.
            </p>
          </div>

          <!-- Declaration Box -->
          <div style="border:2px solid #1f2937;padding:32px;margin-bottom:48px;">
            <p style="font-size:18px;font-weight:700;margin-bottom:24px;">
              Please indicate whether your Conflict of Interest and Conflict of Commitment declarations are up to date.
            </p>

            <div style="display:flex;flex-direction:column;gap:16px;">

              <!-- Option a) Yes -->
              <div style="display:flex;align-items:flex-start;gap:12px;cursor:default;">
                <input type="checkbox" ${coiValue === "YES" ? "checked" : ""
        } aria-label="coi-yes" disabled style="width:16px;height:16px;margin-top:2px;flex-shrink:0;">
                <span style="font-size:18px;">
                  <strong>a) Yes,</strong> my Conflict of Interest and Conflict of Commitment declarations are up to date.
                </span>
              </div>

              <!-- Option b) No -->
              <div style="display:flex;align-items:flex-start;gap:12px;cursor:default;">
                <input type="checkbox" ${coiValue === "NO" ? "checked" : ""
        } aria-label="coi-no" disabled style="width:16px;height:16px;margin-top:2px;flex-shrink:0;">
                <span style="font-size:18px;">
                  <strong>b) No,</strong> my Conflict of Interest and Conflict of Commitment declarations are not up to date.
                </span>
              </div>

            </div>
          </div>

          <!-- Date of Submission -->
          <div>
            <label style="font-size:24px;font-weight:700;display:block;margin-bottom:8px;">Date of Submission:</label>
            <div style="border-bottom:2px solid #d1d5db;margin-top:8px;padding-bottom:4px;width:16rem;font-size:18px;font-weight:600;">
              ${submissionDate}
            </div>
          </div>

        </div>
      </div>
      <div style="page-break-after: always;"></div>
    `;
}

function buildFomMeritAndPsa(latest_declaration, userInfo) {
    const { first_name, last_name } = userInfo || {};
    const fullName = [first_name, last_name].filter(Boolean).join(" ");
    const year = latest_declaration?.year || new Date().getFullYear();
    const fomOptOut = latest_declaration?.fomMerit === "NO";
    const psaOptOut = latest_declaration?.psa === "NO";
    const fomSubmissionDate = latest_declaration?.fomMeritSubmissionDate || "";
    const psaSubmissionDate = latest_declaration?.psaSubmissionDate || "";

    return `
      <div style="background:#fff;padding:32px 24px;">
        <div style="max-width:56rem;margin:0 auto;">

          <!-- Title -->
          <h1 style="font-size:36px;font-weight:700;text-align:center;margin:0 0 32px 0;">FOM Merit &amp; PSA</h1>

          <!-- Name Field -->
          <div style="margin-bottom:20px;">
            <label style="display:block;font-weight:700;font-size:18px;margin-bottom:8px;">Name:</label>
            <div style="border-bottom:2px solid #9ca3af;padding-bottom:6px;font-size:18px;font-weight:600;">
              ${fullName || ""}
            </div>
          </div>

          <!-- Main Content Box -->
          <div style="border:2px solid #1f2937;padding:20px 22px;margin-bottom:20px;background:#fff;">

            <p style="margin:0 0 12px 0;font-size:16px;">
              All eligible members <em>shall be considered for a <strong><u>merit award</u></strong></em> by their Department Head/School Director and a reasonable number of colleagues.
            </p>

            <p style="margin:12px 0 18px 0;font-size:16px;">
              Please note that all faculty are required to submit an annual academic activity report by January 31 of each calendar year. The academic activities will be reviewed annually, including for those who opt out of merit awards and/or Performance Salary Adjustment (PSA). Should you opt out of a merit award, you may still be considered for the Faculty of Medicine Outstanding Academic Performance (OAP) award.
            </p>

            <p style="margin:0 0 8px 0;font-style:italic;font-size:15px;">
              <strong>Please indicate below <u>ONLY</u> if you wish to opt out of merit and/or PSA considerations.</strong>
            </p>

            <!-- Merit Opt Out -->
            <div style="margin:12px 0 16px 32px;">
              <div style="display:flex;align-items:flex-start;gap:12px;">
                <input type="checkbox" ${fomOptOut ? "checked" : ""
        } aria-label="fom-optout" disabled style="width:16px;height:16px;margin-top:2px;flex-shrink:0;">
                <div style="font-size:15px;line-height:1.4;margin-left:6px;">
                  I do <strong><u>NOT</u></strong> wish to be awarded merit by the Dean for my academic activities performed during <strong>January 1, ${year} – December 31, ${year}.</strong>
                  ${fomSubmissionDate
            ? `<div style="margin-top:6px;font-size:14px;"><strong>Submission Date:</strong> ${fomSubmissionDate}</div>`
            : ""
        }
                </div>
              </div>
            </div>

            <!-- PSA Intro -->
            <p style="margin:0 0 8px 0;font-size:15px;font-weight:600;">
              <strong>PSA may be</strong> recommended by the Department Head/School Director based on the following factors:
            </p>

            <ul style="margin:8px 0 16px 40px;font-size:15px;line-height:1.5;">
              <li>Performance over a period of time which is worthy of recognition;</li>
              <li>The relationship of a faculty member's salary to that of other faculty taking into consideration total years of service at UBC; and</li>
              <li>Market considerations.</li>
            </ul>

            <p style="margin:0 0 12px 0;font-size:14px;font-style:italic;">
              Note: Normally, PSA would not be awarded to members in their first three (3) years of employment as a Faculty Member at UBC.
            </p>

            <!-- PSA Opt Out -->
            <div style="margin-left:32px;">
              <div style="display:flex;align-items:flex-start;gap:12px;">
                <input type="checkbox" ${psaOptOut ? "checked" : ""
        } aria-label="psa-optout" disabled style="width:16px;height:16px;margin-top:2px;flex-shrink:0;">
                <div style="font-size:15px;line-height:1.4;margin-left:6px;">
                  I do <strong><u>NOT</u></strong> wish to be considered for PSA.
                </div>
              </div>
            </div>

          </div>

          <!-- Date of Submission -->
          <div style="margin-bottom:12px;">
            <label style="display:block;font-weight:700;font-size:16px;margin-bottom:8px;">Date of Submission:</label>
            <div style="border-bottom:2px solid #9ca3af;padding-bottom:6px;width:16rem;font-size:16px;font-weight:600;">
              ${fomSubmissionDate || psaSubmissionDate || latest_declaration?.submissionDate || ""}
            </div>
          </div>

          <div style="margin-top:24px;font-size:12px;color:#111827;">Personal &amp; Confidential</div>

        </div>
      </div>
      <div style="page-break-after: always;"></div>
    `;
}

function buildPromotionReview(latest_declaration, userInfo) {
    const { first_name, last_name } = userInfo || {};
    const fullName = [first_name, last_name].filter(Boolean).join(" ");
    const wishPromotion = latest_declaration?.promotion === "YES";
    const notWishPromotion = latest_declaration?.promotion === "NO";
    const effectiveYear = latest_declaration?.promotionEffectiveDate || "";
    const pathwaysRaw = String(latest_declaration?.promotionPathways || "").toLowerCase();
    const supportAnticipated = latest_declaration?.supportAnticipated || "";
    const submissionDate = latest_declaration?.promotionSubmissionDate || "";

    const pathwayTraditional = pathwaysRaw.includes("traditional");
    const pathwayIndigenous = pathwaysRaw.includes("indigenous");
    const pathwayBlended =
        pathwaysRaw.includes("blended") || pathwaysRaw.includes("teaching") || pathwaysRaw.includes("scholarship");

    // compute the "upcoming academic year" bounds using current year
    const currentYear = new Date().getFullYear();
    const upcomingStart = currentYear;
    const upcomingEnd = currentYear + 1;
    const effectiveDisplayYear = upcomingEnd;

    return `
      <!-- Promotion Review fragment: scalable via --pr-scale -->
      <style>
        /* wrapper scales the whole fragment while preserving layout */
        .pr-scale-wrapper { --pr-scale: 1; transform: scale(var(--pr-scale)); transform-origin: top left; width: calc(100% / var(--pr-scale)); box-sizing: border-box; }

        /* Scoped styles for the promotion review fragment (copied from provided styling) */
        .pr-root { font-family: 'Calibri', 'Arial', sans-serif; font-size:11pt; line-height:1.5; padding:40px 60px; max-width:8.5in; margin:0 auto; background:#fff; color:#000; }

        /* Strong keep-together hints for print engines */
        .pr-root, .pr-root * { page-break-inside: avoid; break-inside: avoid; page-break-before: avoid; page-break-after: avoid; }

        .pr-root h1 { text-align:center; font-size:24pt; font-weight:700; margin-bottom:30px; color:#000; }
        .pr-root .field-label { font-weight:700; font-size:11pt; display:block; margin-bottom:8px; }
        .pr-root .name-field { margin-bottom:25px; }
        .pr-root .main-box { border:2px solid #000; padding:25px; margin-bottom:25px; }
        .pr-root .main-box p { margin-bottom:15px; line-height:1.4; }
        .pr-root .checkbox-group { margin:15px 0; }
        .pr-root .checkbox-item { display:flex; align-items:flex-start; margin-bottom:8px; gap:8px; }
        .pr-root .checkbox-item input[type="checkbox"] { width:16px; height:16px; margin-top:2px; flex-shrink:0; }
        .pr-root .checkbox-item label { font-size:11pt; line-height:1.4; }
        .pr-root .indented { margin-left:40px; }
        .pr-root .underline { text-decoration:underline; }
        .pr-root .bold { font-weight:700; }
        .pr-root .italic { font-style:italic; }
        .pr-root .date-input { display:inline-block; border-bottom:1px solid #000; min-width:100px; padding:0 5px; }
        .pr-root .section-title { font-weight:700; margin-top:20px; margin-bottom:10px; }
        .pr-root .support-section { min-height:50px; margin:15px 0; }
        .pr-root .footer-note { margin-top:10px; padding-top:10px; }
        .pr-root .submission-date { margin-top:25px; }
        .pr-root .confidential { margin-top:10px; font-size:10pt; page-break-inside: avoid; }
      </style>

      <div class="pr-scale-wrapper">
        <div class="pr-root">
          <h1>FOM Promotion Review</h1>

          <div class="name-field">
            <span class="field-label">Name:</span>
            <div style="font-size:11pt;">${fullName || ""}</div>
          </div>

          <div class="main-box">
            <p>
              <span class="bold">For those faculty in ranks other than Professor or Professor of Teaching, please indicate whether you wish to be considered for review for promotion during the upcoming academic year (July 1, ${upcomingStart} – June 30, ${upcomingEnd}) for an effective date of July 1, ${effectiveDisplayYear}.</span>
            </p>

            <div class="checkbox-group">
              <div class="checkbox-item">
                <span>a)</span>
                <input type="checkbox" ${wishPromotion ? "checked" : ""} aria-label="wish-promotion" disabled>
                <label><span class="bold">I do wish to be considered for promotion.</span></label>
              </div>

              <div class="checkbox-item">
                <span>b)</span>
                <input type="checkbox" ${notWishPromotion ? "checked" : ""} aria-label="not-wish-promotion" disabled>
                <label><span class="bold">I do <span class="underline">NOT</span> wish to be considered for promotion.</span></label>
              </div>
            </div>

            <p style="margin-top:20px;">
              <span class="bold">If applicable, the anticipated effective date for the next promotion, if not July 1, ${effectiveDisplayYear}:</span>
            </p>
            <p style="margin-left:40px;">
              <span class="bold">[July 1, <span class="date-input">${effectiveYear || ""}</span>]</span>
            </p>
            <p class="italic" style="margin-left:20px;">Note: The application deadline is one year prior to effective date.</p>

            <div class="section-title">
              <span class="bold">Anticipated pathway for <span class="underline">Research Stream</span></span>
            </div>

            <div class="checkbox-group">
              <div class="checkbox-item">
                <input type="checkbox" ${pathwayTraditional ? "checked" : ""} aria-label="pathway-traditional" disabled>
                <label><span class="bold">Traditional</span></label>
              </div>

              <div class="checkbox-item indented">
                <input type="checkbox" ${pathwayIndigenous ? "checked" : ""} aria-label="pathway-indigenous" disabled>
                <label><span class="bold">Indigenous scholarly activity</span></label>
              </div>

              <div class="checkbox-item">
                <input type="checkbox" ${pathwayBlended ? "checked" : ""} aria-label="pathway-blended" disabled>
                <label><span class="bold">Blended with scholarship of teaching or professional contributions</span></label>
              </div>
            </div>

            <div class="section-title">
              <span class="bold">Support anticipated:</span>
            </div>
            <div class="support-section" style="border:1px solid #e5e5e5;padding:8px;font-size:11pt;line-height:1.4;">${supportAnticipated || ""
        }</div>

            <div class="footer-note">
              <p>
                <span class="bold">Please note that all faculty are <span class="underline">required</span> to submit an annual activity report, regardless of whether they wish to be considered for promotion.</span>
              </p>
            </div>
          </div>

          <div class="submission-date">
            <span class="field-label">Date of Submission:</span>
            <div style="display:inline-block;border-bottom:1px solid #000;min-width:120px;padding:2px 6px;font-size:11pt;">${submissionDate || ""
        }</div>
          </div>

          <div class="confidential">Personal &amp; Confidential</div>
        </div>
      </div>
    `;
}

function buildFomHonorificImpactReport(latest_declaration, userInfo) {
    const { first_name, last_name } = userInfo || {};
    const fullName = [first_name, last_name].filter(Boolean).join(" ");
    const attached = !!(latest_declaration?.honorificAttachment || latest_declaration?.honorificAttached);
    const reportText = latest_declaration?.honorific || "";
    const yearHint = latest_declaration?.year || new Date().getFullYear();

    return `
      <div style="page-break-before: always;"></div>

      <style>
        /* Scoped styles for FOM Honorific Impact Report */
        .fh-root { font-family: 'Calibri', 'Arial', sans-serif; font-size:11pt; line-height:1.5; padding:40px 60px; max-width:1200px; margin:0 auto; background:#fff; color:#000; }
        .fh-root h1 { text-align:center; font-size:28pt; font-weight:700; margin-bottom:30px; color:#000; }
        .fh-root .field-label { font-weight:700; font-size:11pt; margin-bottom:8px; margin-top:20px; display:block; }
        .fh-root .field-input { width:100%; border:none; border-bottom:1px solid #000; padding:4px 0; font-size:11pt; margin-bottom:20px; }
        .fh-root p { margin-bottom:15px; text-align:justify; }
        .fh-root .bold-text { font-weight:700; }
        .fh-root .email-link { color:#0000EE; text-decoration:underline; }
        .fh-root .checkbox-group { margin:20px 0; }
        .fh-root .checkbox-item { display:flex; align-items:flex-start; margin-bottom:8px; gap:8px; }
        .fh-root .checkbox-item input[type="checkbox"] { width:16px; height:16px; margin-top:2px; flex-shrink:0; }
        .fh-root .checkbox-item label { font-weight:700; font-size:11pt; }
        .fh-root .section-header { font-weight:normal; text-decoration:underline; margin-top:20px; margin-bottom:15px; }
        .fh-root .text-area { width:100%; min-height:200px; border:1px solid #000; padding:10px; font-size:11pt; line-height:1.5; }
      </style>

      <div class="fh-root">
        <h1>FOM Honorific Impact Report</h1>

        <div>
          <span class="field-label">Name:</span>
          <div class="field-input" style="border:none;border-bottom:1px solid #000;padding:4px 0;font-size:11pt;">${fullName || ""
        }</div>
        </div>

        <p>
          If you are the holder of a Faculty of Medicine Honorific (i.e., Chair, Professorship, Distinguished Scholar),
          please provide a summary of the impact your activities have had on the advancement of medical research,
          education and community service in the recent calendar year.
        </p>

        <p>
          Please complete the field below (approximately 100 words) explaining the impact your activities have made to
          education and/or research and/or community service over the past year. Consider this your "elevator pitch" –
          provide the most impactful highlight(s) of the work being conducted in the name of the honorific. This
          information will be used by the Development Office in its report to the stakeholder(s), and may be used more
          broadly to bring additional awareness to the Faculty's accomplishments.
        </p>

        <p>
          Alternately, if a full report has recently been prepared, please attach a copy of the report.
        </p>

        <p>
          <span class="bold-text">Please submit your impact report to your Department Head / School Director and</span>
          <a href="mailto:fomdae.assistant@ubc.ca" class="email-link">fomdae.assistant@ubc.ca</a><span class="bold-text">.</span>
        </p>

        <div class="checkbox-group">
          <div class="checkbox-item">
            <input type="checkbox" id="fh-attached" ${attached ? "checked" : ""
        } aria-label="honorific-attached" disabled>
            <label for="fh-attached">Full or Summary Report is attached; OR</label>
          </div>
          <div class="checkbox-item">
            <input type="checkbox" id="fh-follows" ${!attached && reportText ? "checked" : ""
        } aria-label="honorific-follows" disabled>
            <label for="fh-follows">Report is as follows:</label>
          </div>
        </div>

        <div class="section-header">Short Paragraph (approximately 100 words)</div>

        <div>
          <div class="text-area" aria-label="honorific-text">${reportText || ""}</div>
        </div>

        <div style="margin-top:18px;font-size:11pt;color:#111827;">(Year referenced: ${yearHint})</div>
      </div>
    `;
}

// Insert the FOM/PSA page into the declaration flow
// filepath: same file - modify buildDeclarationReport to append honorific page (no change to early-return logic)
function buildDeclarationReport(cv) {
    const { declaration_to_use } = cv || {};

    if (!declaration_to_use) {
        const year = cv?.start_year ?? "";
        return `<div style="font-weight:700; margin:12px 0;">Declaration not filled out for year ${year}</div>`;
    }

    // build conflict page fragment (Tailwind classes used so it matches provided template)
    const conflictOfInterestPage = buildConflictOfInterestPage(declaration_to_use, cv);

    // build FOM Merit & PSA page
    const fomMeritAndPsaPage = buildFomMeritAndPsa(declaration_to_use, cv);

    // build Promotion Review page
    const promotionReviewPage = buildPromotionReview(declaration_to_use, cv);

    // build Honorific Impact Report page
    const honorificPage = buildFomHonorificImpactReport(declaration_to_use, cv);

    // combine and return: conflict page, then FOM/PSA page, promotion page, honorific page, then summary
    let html = "";
    // Removed extra page-break wrappers here: each fragment already starts with a page-break.
    html += conflictOfInterestPage;
    html += fomMeritAndPsaPage;
    html += promotionReviewPage;
    html += honorificPage;
    return html;
}

function buildCv(cv) {
    const { groups } = cv;

    // Top block: template title (large, bold) then key details in a table
    let html = "";

    html += buildHeader(cv);
    html += buildUserInfoTable(cv);

    // Groups (under the header)
    if (Array.isArray(groups) && groups.length) {
        groups.forEach((group) => {
            html += buildGroup(group);
        });
    }

    // Add declaration at the end
    html += buildDeclarationReport(cv);

    return html;
}

function buildGroup(group) {
    const { title, tables } = group;
    let html = "";

    html += `
        <div class="group">
            <h2>
                <span style="display:inline-block; border-bottom: 3px solid #000;">${title}</span>
            </h2>
    `;

    const emptyTableNames = [];
    tables.forEach((table) => {
        const htmlTable = buildTable(table);

        if (htmlTable.tableEmpty) {
            const tableName = table?.columns?.[0]?.headerName.replace("(0)", "").trim();

            if (tableName) {
                emptyTableNames.push(tableName);
            }
            if (htmlTable.underlinedHeaderHtml) {
                html += htmlTable.underlinedHeaderHtml;
            }
        } else {
            html += buildTable(table);
        }
    });

    if (emptyTableNames.length > 0) {
        html += `
        <div style="
            margin-top: 1em;
            font-family: Arial, sans-serif;
            font-size: 0.95em;
        ">
            <strong>Tables with no data:</strong>
            ${emptyTableNames
                .map(
                    (name, i) => `
                <span style="
                    background-color: ${i % 2 === 0 ? "#f2f2f2" : "#dcdcdc"};
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-right: 4px;
                    display: inline-block;
                ">
                    ${name}${i < emptyTableNames.length - 1 ? "," : ""}
                </span>
            `
                )
                .join("")}
        </div>
    `;
    }

    html += "</div>";
    return html;
}

function buildTable(table) {
    const { columns, rows, justHeader, noPadding } = table;

    let filteredColumns;
    if (!justHeader) {
        // prune empty columns first
        filteredColumns = removeEmptyColumns(columns, rows);
    }

    // If pruning removed every column, fall back to the original columns
    // so we still render the header (title/subsection) even for empty tables.
    const columnsToRender =
        Array.isArray(filteredColumns) && filteredColumns.length > 0
            ? filteredColumns
            : Array.isArray(columns)
                ? columns
                : [];

    // Helper: calculate max depth of columns
    function getDepth(cols) {
        return cols.reduce((max, col) => {
            if (col.children) return Math.max(max, 1 + getDepth(col.children));
            return Math.max(max, 1);
        }, 0);
    }

    const depth = getDepth(columnsToRender);

    // Build header rows
    const headerRows = Array.from({ length: depth }, () => []);

    function processColumn(col, level) {
        const hasChildren = !!col.children && col.children.length > 0;
        if (hasChildren) {
            const colspan = countLeafColumns(col);
            headerRows[level].push({ name: col.headerName, colspan, rowspan: 1 });
            col.children.forEach((child) => processColumn(child, level + 1));
        } else {
            headerRows[level].push({ name: col.headerName, colspan: 1, rowspan: depth - level });
        }
    }

    function countLeafColumns(col) {
        if (!col.children) return 1;
        return col.children.reduce((sum, c) => sum + countLeafColumns(c), 0);
    }

    columnsToRender.forEach((col) => processColumn(col, 0));

    // remove any header rows that contain only empty names (e.g. ["", ""])
    const visibleHeaderRows = headerRows.filter((row) => row.some((cell) => String(cell?.name ?? "").trim() !== ""));

    // Generate header HTML from filtered rows
    const headerHtml = visibleHeaderRows
        .map(
            (row) =>
                "<tr>" +
                row
                    .map(
                        (cell) =>
                            `<th${cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ""}${cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ""
                            }>${cell.name}</th>`
                    )
                    .join("") +
                "</tr>"
        )
        .join("\n");

    // Flatten columns to get order of fields
    function flattenColumns(cols) {
        return cols.flatMap((c) => (c.children ? flattenColumns(c.children) : c));
    }

    const flatColumns = flattenColumns(columnsToRender);

    // Build students supervised summary (plain bold text, placed below header and above rows)
    let studentsSupervisedSummaryHtml = "";
    if (table?.studentsSupervisedSummary) {
        const keys = Object.keys(table.studentsSupervisedSummary || {});
        const lines = keys
            .map((key) => {
                const { total = 0, completed = 0, current = 0 } = table.studentsSupervisedSummary[key] || {};
                return `${key} Total: ${total}, ${current} current, ${completed} completed`;
            })
            .filter(Boolean);

        if (lines.length) {
            // plain text (bold), separated by <br/>, not inside the table
            studentsSupervisedSummaryHtml = `<div style="font-weight:700; margin:8px 0;">${lines.join("<br/>")}</div>`;
        }
    }

    // Build body: if there are no rows (or no surviving leaf columns), show "No data" under the header
    let bodyHtml;
    const noRows = !Array.isArray(rows) || rows.length === 0;
    const noLeafColumns = !Array.isArray(flatColumns) || flatColumns.length === 0;

    if (noRows || noLeafColumns) {
        let underlinedHeaderHtml = "";
        if (table.underlined_header) {
            const underlinedHeader = table.underlined_header;
            underlinedHeaderHtml = underlinedHeader
                ? `<h3 style="text-decoration: underline; margin-bottom: 6px;">${underlinedHeader}</h3>`
                : "";
        }
        return { tableEmpty: true, underlinedHeaderHtml };
    } else {
        bodyHtml = rows
            .map(
                (row) =>
                    "<tr>" +
                    flatColumns
                        .map((c) => {
                            let fieldValue = row[c.field] ?? "";

                            // Special handling for merged_data in publications
                            if (c.field === "merged_data" && row["Author Names"]) {
                                // Check if this row has Author Names data with metadata
                                const authorNames = row["Author Names"];
                                const hasMetadata =
                                    (row["author_trainees"] && row["author_trainees"].length > 0) ||
                                    (row["author_doctoral_supervisors"] && row["author_doctoral_supervisors"].length > 0) ||
                                    (row["author_postdoctoral_supervisors"] && row["author_postdoctoral_supervisors"].length > 0);

                                if (authorNames && hasMetadata) {
                                    // console.log("✅ Formatting authors in merged_data");
                                    // Format the author names with metadata
                                    const formattedAuthors = formatAuthorNamesWithMetadata(authorNames, row);

                                    // Replace the author names in the merged data with formatted version
                                    let modifiedMergedData = String(fieldValue);

                                    // Try different join formats to match what's in merged_data
                                    // merged_data might have "X,Y" (no space) or "X, Y" (with space)
                                    const authorStringWithSpace = Array.isArray(authorNames) ? authorNames.join(', ') : String(authorNames);
                                    const authorStringNoSpace = Array.isArray(authorNames) ? authorNames.join(',') : String(authorNames);

                                    // Determine which format exists in merged_data
                                    let authorString;
                                    if (modifiedMergedData.includes(authorStringNoSpace)) {
                                        authorString = authorStringNoSpace;
                                        // console.log("🔧 Found authors WITHOUT space after comma");
                                    } else if (modifiedMergedData.includes(authorStringWithSpace)) {
                                        authorString = authorStringWithSpace;
                                        // console.log("🔧 Found authors WITH space after comma");
                                    } else {
                                        // console.warn("⚠️ Author string not found in merged_data in any format");
                                        // console.log("Tried:", { withSpace: authorStringWithSpace, noSpace: authorStringNoSpace, mergedData: modifiedMergedData });
                                        // Fall back to regular styling
                                        modifiedMergedData = dataStyler(modifiedMergedData);
                                        return `<td>${modifiedMergedData}</td>`;
                                    }

                                    // Split merged data, preserve the author formatted HTML, and apply dataStyler to other parts
                                    const parts = modifiedMergedData.split(authorString);
                                    console.log("✅ Split parts:", parts);

                                    // Apply dataStyler to non-author parts and insert formatted authors in between
                                    const styledParts = parts.map((part, idx) => {
                                        if (idx < parts.length - 1) {
                                            // Apply dataStyler to this part, then add formatted authors
                                            return dataStyler(part) + formattedAuthors;
                                        } else {
                                            // Last part, just apply dataStyler
                                            return dataStyler(part);
                                        }
                                    });

                                    modifiedMergedData = styledParts.join('');
                                    // console.log("✅ After replacement:", modifiedMergedData);

                                    // Return directly to preserve HTML formatting
                                    return `<td>${modifiedMergedData}</td>`;
                                }
                            }

                            // Check if this is an author names field (for non-merged tables)
                            const isAuthorNamesField = c.field && c.field === "Author Names";

                            if (isAuthorNamesField && fieldValue) {
                                console.log("✅ APPLYING AUTHOR FORMATTING to Author Names field");
                                return `<td>${formatAuthorNamesWithMetadata(fieldValue, row)}</td>`;
                            }

                            return `<td>${dataStyler(fieldValue)}</td>`;
                        })
                        .join("") +
                    "</tr>"
            )
            .join("\n");
    }

    const underlinedHeader = table.underlined_header;
    const underlinedHeaderHtml = underlinedHeader
        ? `<h3 style="text-decoration: underline; margin-bottom: 6px;">${underlinedHeader}</h3>`
        : "";

    const instructions = table.instructions;
    const instructionsHtml = instructions
        ? `<h3 style="margin: 0 0 6px 0; padding: 0; font-size: 0.9em;">${instructions}</h3>`
        : "";


    // Return full table HTML
    const wrapperClass = noPadding ? "table-with-notes no-padding" : "table-with-notes";
    const notesHtml = buildNotes(table.note_sections);
    return `<div class="${wrapperClass}">
            ${underlinedHeaderHtml}
            ${instructionsHtml}
            <table border="1" cellspacing="0" cellpadding="5">
            <thead>
            ${studentsSupervisedSummaryHtml}
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
    });

    const formattedData = formattedArray.join(" ");

    return formattedData;
}

function doiWrapper(doi) {
    const cleanedDoi = String(doi).trim().replace(/[,.]$/, "");

    const link = `https://doi.org/${cleanedDoi}`;

    // Check the original string for a trailing comma and append it if found.
    if (String(doi).endsWith(",")) {
        return `<a href="${link}">${doi}</a>`;
    }

    return `<a href="${link}">${doi}</a>`;
}

function isDOI(str) {
    const cleanedStr = String(str).trim().replace(/,$/, "");
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
        const month = String(word)
            .replace(/[^a-z]/g, "")
            .toLowerCase();

        const monthMap = {
            january: "Jan",
            february: "Feb",
            march: "Mar",
            april: "Apr",
            may: "May",
            june: "Jun",
            july: "Jul",
            august: "Aug",
            september: "Sep",
            october: "Oct",
            november: "Nov",
            december: "Dec",
        };

        return monthMap[month];
    }

    const cleanedData = String(data).trim().toLowerCase();
    const wordArray = cleanedData.split(/\s+/);

    const formattedWordArray = wordArray.map((word) => {
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

        return parts.every(
            (part) => allowedMonths.includes(part.toLowerCase()) || /^\d+$/.test(part) || part.toLowerCase() === "current"
        );
    }

    let cleanedData = String(data)
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .toLowerCase();
    const allowedMonths = [
        "january",
        "jan",
        "february",
        "feb",
        "march",
        "mar",
        "april",
        "apr",
        "may",
        "june",
        "jun",
        "july",
        "jul",
        "august",
        "aug",
        "september",
        "sep",
        "sept",
        "october",
        "oct",
        "november",
        "nov",
        "december",
        "dec",
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

/**
 * Format author names with metadata (bold, italic, underline) for publications
 *
 * Formatting rules:
 * - Trainees: underline
 * - Doctoral supervisors: italic
 * - Postdoctoral supervisors: bold + italic
 *
 * @param {string|array} authorNamesString - Comma-separated author names or array
 * @param {object} rowData - Full row data containing metadata fields
 * @returns {string} - HTML formatted author names with inline styles
 */
function formatAuthorNamesWithMetadata(authorNamesString, rowData) {
    if (!authorNamesString) return "";

    // Parse author names - handle both string and array formats
    let authorNames = [];
    if (Array.isArray(authorNamesString)) {
        authorNames = authorNamesString;
    } else if (typeof authorNamesString === "string") {
        authorNames = authorNamesString.split(",").map((name) => name.trim());
    } else {
        return String(authorNamesString);
    }
    console.log("🔍 Author formatting - Parsed author names:", authorNamesString);
    console.log("🔍 Author formatting - Row data keys:", Object.keys(rowData));

    // Get metadata arrays from row data - check all possible field name variations
    const trainees = rowData["author_trainees"] || [];
    const doctoralSupervisors = rowData["author_doctoral_supervisors"] || [];
    const postdoctoralSupervisors = rowData["author_postdoctoral_supervisors"] || [];

    // Debug: Log to see what we're getting
    if (trainees.length > 0 || doctoralSupervisors.length > 0 || postdoctoralSupervisors.length > 0) {
        console.log("📝 Author formatting - Found metadata:", {
            authorNames,
            trainees,
            doctoralSupervisors,
            postdoctoralSupervisors,
            rowData: Object.keys(rowData),
        });
    }

    // Parse metadata if they're strings
    const parseMetadata = (data) => {
        if (Array.isArray(data)) return data;
        if (typeof data === "string" && data.trim()) {
            try {
                return JSON.parse(data);
            } catch {
                return data.split(",").map((item) => item.trim());
            }
        }
        return [];
    };

    const traineesList = parseMetadata(trainees);
    const doctoralList = parseMetadata(doctoralSupervisors);
    const postdocList = parseMetadata(postdoctoralSupervisors);

    // Format each author name
    const formattedAuthors = authorNames.map((name, idx) => {
        if (!name) return "";

        // Check if author is in any special role
        const isTrainee = traineesList.includes(name);
        const isDoctoralSupervisor = doctoralList.includes(name);
        const isPostdoctoralSupervisor = postdocList.includes(name);

        // Apply formatting based on author roles
        let styles = [];
        let classes = [];

        // Trainees - underline
        if (isTrainee) {
            styles.push("text-decoration: underline");
            classes.push("author-trainee");
        }

        // Doctoral supervisors - italic only
        if (isDoctoralSupervisor) {
            styles.push("font-style: italic");
            classes.push("author-doctoral-supervisor");
        }

        // Postdoctoral supervisors - bold + italic
        if (isPostdoctoralSupervisor) {
            styles.push("font-weight: bold");
            styles.push("font-style: italic");
            classes.push("author-postdoctoral-supervisor");
        }

        // Apply formatting if any styles are defined
        if (styles.length > 0 || classes.length > 0) {
            const styleAttr = styles.length > 0 ? ` style="${styles.join("; ")}"` : "";
            const classAttr = classes.length > 0 ? ` class="${classes.join(" ")}"` : "";
            console.log(`✨ Formatting author "${name}":`, {
                isTrainee,
                isDoctoralSupervisor,
                isPostdoctoralSupervisor,
                styles,
                classes,
            });
            return `<span${styleAttr}${classAttr}>${name}</span>`;
        }

        return name;
    });

    // Join authors with commas
    return formattedAuthors.join(", ");
}

function buildNotes(noteSections) {
    if (!noteSections || noteSections.length === 0) {
        return "";
    }

    let html = "";
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
