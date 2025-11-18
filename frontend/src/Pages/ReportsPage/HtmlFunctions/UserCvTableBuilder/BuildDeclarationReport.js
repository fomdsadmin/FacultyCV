// Insert the FOM/PSA page into the declaration flow
// filepath: same file - modify buildDeclarationReport to append honorific page (no change to early-return logic)

export function buildDeclarationReport(userCvStore) {
    const cv = userCvStore.getCv();

    const { declaration_to_use } = cv || {};

    if (!declaration_to_use) {
        const year = userCvStore.getStartYear() ?? "";
        return `<div style="font-weight:700; margin:12px 0;">Declaration not filled out for year ${year}</div>`;
    }

    // build conflict page fragment (Tailwind classes used so it matches provided template)
    const conflictOfInterestPage = buildConflictOfInterestPage(userCvStore);

    // build FOM Merit & PSA page
    const fomMeritAndPsaPage = buildFomMeritAndPsa(userCvStore);

    // build Promotion Review page
    const promotionReviewPage = buildPromotionReview(userCvStore);

    // build Honorific Impact Report page
    const honorificPage = buildFomHonorificImpactReport(userCvStore);

    // combine and return: conflict page, then FOM/PSA page, promotion page, honorific page, then summary
    let html = "";
    // Removed extra page-break wrappers here: each fragment already starts with a page-break.
    html += conflictOfInterestPage;
    html += fomMeritAndPsaPage;
    html += promotionReviewPage;
    html += honorificPage;
    return html;
}

function buildConflictOfInterestPage(userCvStore) {
    const cv = userCvStore.getCv();
    const { declaration_to_use } = cv || {};
    const firstName = userCvStore.getFirstName();
    const lastName = userCvStore.getLastName();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const coiValue = declaration_to_use && declaration_to_use.coi ? declaration_to_use.coi : null;
    const submissionDate = declaration_to_use?.coiSubmissionDate || "";

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

function buildFomMeritAndPsa(userCvStore) {
    const cv = userCvStore.getCv();
    const { declaration_to_use } = cv || {};
    const firstName = userCvStore.getFirstName();
    const lastName = userCvStore.getLastName();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const year = declaration_to_use?.year || new Date().getFullYear();
    const fomOptOut = declaration_to_use?.fomMerit === "NO";
    const psaOptOut = declaration_to_use?.psa === "NO";
    const fomSubmissionDate = declaration_to_use?.fomMeritSubmissionDate || "";
    const psaSubmissionDate = declaration_to_use?.psaSubmissionDate || "";

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
              ${fomSubmissionDate || psaSubmissionDate || declaration_to_use?.submissionDate || ""}
            </div>
          </div>

          <div style="margin-top:24px;font-size:12px;color:#111827;">Personal &amp; Confidential</div>

        </div>
      </div>
      <div style="page-break-after: always;"></div>
    `;
}

function buildPromotionReview(userCvStore) {
    const cv = userCvStore.getCv();
    const { declaration_to_use: latest_declaration } = cv || {};
    const firstName = userCvStore.getFirstName();
    const lastName = userCvStore.getLastName();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
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
              <span class="bold">For those faculty in ranks other than Professor or Professor of Teaching, please indicate whether you wish to be considered for review for promotion during the upcoming academic year (July 1, ${upcomingStart + 1} – June 30, ${upcomingEnd + 1}) for an effective date of July 1, ${effectiveDisplayYear + 1}.</span>
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
              <span class="bold">If applicable, the anticipated effective date for the next promotion, if not July 1, ${effectiveDisplayYear + 1}:</span>
            </p>
            <p style="margin-left:40px;">
              <span class="bold">[July 1, <span class="date-input">${effectiveYear + 1 || ""}</span>]</span>
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

function buildFomHonorificImpactReport(userCvStore) {
    const cv = userCvStore.getCv();
    const { declaration_to_use: latest_declaration } = cv || {};
    const firstName = userCvStore.getFirstName();
    const lastName = userCvStore.getLastName();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
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
        <div style="margin-top:18px;font-size:11pt;color:#111827;">(Date of Submission: ${yearHint})</div>
      </div>
    `;
}