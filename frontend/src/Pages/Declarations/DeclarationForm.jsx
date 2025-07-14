import React from "react";
import { FaRegCalendarAlt } from "react-icons/fa"; // Add at the top if using react-icons

const sc3_link = "https://universitycounsel.ubc.ca/policies/coi-policy/";
const unicouncil_link = "https://universitycounsel.ubc.ca/subject-areas/coi/";
const orcs_link = "https://ors.ubc.ca/";

const DeclarationForm = ({
  editYear,
  year,
  setYear,
  coi,
  setCoi,
  coiSubmissionDate,
  setCoiSubmissionDate,
  fomMerit,
  setFomMerit,
  psa,
  setPsa,
  psaSubmissionDate,
  setPsaSubmissionDate,
  promotion,
  setPromotion,
  promotionSubmissionDate,
  setPromotionSubmissionDate,
  promotionPathways,
  setPromotionPathways,
  promotionEffectiveDate,
  setPromotionEffectiveDate,
  honorific,
  setHonorific,
  formRef,
  onCancel,
  onSave,
  yearOptions = [],
  isEdit = false,
  validationErrors = {},
  setValidationErrors,
}) => {
  // Helper to clear error for a field
  const clearError = (field) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Helper to validate submission dates
  const validateSubmissionDate = (dateValue, fieldName) => {
    if (!dateValue) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: "Please select a submission date.",
      }));
      return;
    }

    const submissionDate = new Date(dateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    if (submissionDate > today) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: "Submission date cannot be in the future.",
      }));
    } else {
      clearError(fieldName);
    }
  };

  const reportingYear = isEdit ? editYear : year;
  const reportingYearNum = Number(reportingYear);
  const nextYearNum = reportingYearNum ? reportingYearNum + 1 : null;
  const hasSelectedYear = !!reportingYearNum;

  return (
    <div className="w-full flex justify-center">
      <div
        ref={formRef}
        className="mb-10 p-12 px-20 w-full max-w-6xl rounded-lg gap-6 flex flex-col bg-gray-100 shadow-lg border border-zinc-300"
      >
        <div id="declaration-field-year" className="mb-2">
          <label className="block text-base font-semibold mb-1">
            Reporting Year <span className="text-red-500">*</span>
          </label>
          <div className="relative w-56">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <FaRegCalendarAlt />
            </span>
            <select
              className={`
                pl-10 pr-4 py-2 rounded-lg border transition-colors duration-150 w-full
                text-base bg-white shadow-sm
                ${
                  isEdit
                    ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                    : "border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                }
                ${validationErrors.year ? "border-red-500 ring-2 ring-red-200" : ""}
              `}
              value={isEdit ? editYear : year}
              onChange={(e) => {
                if (!isEdit) {
                  setYear(Number(e.target.value));
                  if (validationErrors.year) {
                    setValidationErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.year;
                      return updated;
                    });
                  }
                }
              }}
              disabled={!!isEdit}
              readOnly={!!isEdit}
            >
              {yearOptions.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {validationErrors.year && <div className="text-red-500 text-sm mt-1">{validationErrors.year}</div>}
        </div>

        <div id="declaration-field-coi">
          <h2 className="text-lg font-semibold mb-3">
            Conflict of Interest and Commitment Declaration <span className="text-red-500">*</span>
          </h2>
          <div className="bg-gray-50 py-6 px-8 rounded-lg shadow-sm border max-h-96 overflow-y-auto border-r-8 border-r-blue-500">
            <p className="text-gray-500">
              In accordance with{" "}
              <a
                href={sc3_link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-500 hover:text-blue-900 hover:underline transition-colors duration-150 cursor-pointer"
                style={{ textDecorationThickness: "2px" }}
              >
                UBC Policy SC3
              </a>
              , you must maintain up-to-date Conflict of Interest and Conflict of Commitment declarations. For more
              information regarding Conflict of Interest and Commitment, please refer to the
              <a
                href={unicouncil_link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-500 hover:text-blue-900 hover:underline transition-colors duration-150 cursor-pointer"
                style={{ textDecorationThickness: "2px" }}
              >
                {" "}
                Office of the University Counsel{" "}
              </a>
              and the
              <a
                href={orcs_link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-500 hover:text-blue-900 hover:underline transition-colors duration-150 cursor-pointer"
                style={{ textDecorationThickness: "2px" }}
              >
                {" "}
                UBC Office of Research Services.
              </a>
            </p>
            <br />
            <p className="text-gray-500">
              Please indicate whether your Conflict of Interest and Conflict of Commitment declarations are up to date.
            </p>
            <select
              className={`select select-bordered w-3/5 mt-5 ${validationErrors.coi ? "border-red-500" : ""}`}
              value={coi}
              onChange={(e) => {
                setCoi(e.target.value);
                clearError("coi");
              }}
              required
            >
              <option value=""></option>
              <option value="YES">
                Yes, my Conflict of Interest and Conflict of Commitment declarations are up to date.
              </option>
              <option value="NO">
                No, my Conflict of Interest and Conflict of Commitment declarations are NOT up to date.
              </option>
            </select>
            {validationErrors.coi && <div className="text-red-500 text-sm mt-1">{validationErrors.coi}</div>}

            <div className="mt-4 flex items-center">
              <label className="block text-base font-semibold">
                <span className="text-gray-700 mr-4">
                  Date of Submission <span className="text-red-500">*</span>
                </span>
              </label>
              <div className="relative w-56 ">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FaRegCalendarAlt />
                </span>
                <input
                  type="date"
                  className={`
                    pl-10 pr-4 py-2 rounded-lg border transition-colors duration-150 w-full
                    text-base bg-white shadow-sm
                    border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200
                    ${validationErrors.coiSubmissionDate ? "border-red-500 ring-2 ring-red-200" : ""}
                  `}
                  value={coiSubmissionDate}
                  onChange={(e) => {
                    setCoiSubmissionDate(e.target.value);
                    validateSubmissionDate(e.target.value, "coiSubmissionDate");
                  }}
                  placeholder="Select submission date"
                  required
                />
              </div>
            </div>
            {validationErrors.coiSubmissionDate && (
              <div className="text-red-500 text-sm mt-2">{validationErrors.coiSubmissionDate}</div>
            )}
          </div>
        </div>

        <div id="declaration-field-fomMerit">
          <h2 className="text-lg font-semibold mb-3">
            FOM Merit & PSA <span className="text-red-500">*</span>
          </h2>
          <div className="bg-gray-50 py-6 px-8  rounded-lg shadow-sm border">
            <p className="text-gray-500">
              All eligible members{" "}
              <i>
                shall be considered for a{" "}
                <b>
                  <u>merit award</u>{" "}
                </b>
              </i>{" "}
              by their Department Head/School Director and a reasonable number of colleagues.
              <br />
              <br />
              Please note that all faculty are <u>required</u> to submit an annual academic activity report by January
              31 of each calendar year. The academic activities will be reviewed annually, including for those who opt
              out of merit awards and/or Performance Salary Adjustment (PSA). Should you opt out of a merit award, you
              may still be considered for the Faculty of Medicine Outstanding Academic Performance (OAP) award.
              <br />
              <br />
              <b>
                <i>
                  Please indicate below <u>ONLY</u> if you wish to opt out of merit considerations.
                </i>
              </b>
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  id="fomMerit"
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  checked={fomMerit === "NO"}
                  onChange={(e) => {
                    setFomMerit(e.target.checked ? "NO" : "YES");
                    clearError("fomMerit");
                  }}
                />
                <label htmlFor="fomMerit" className="ml-3 text-gray-700 font-medium">
                  I do NOT wish to be awarded merit for my academic activities.
                </label>
              </div>
            </div>
            <p className="text-gray-500 mt-6">
              <b>
                <u>PSA may be</u>
              </b>{" "}
              recommended by the Department Head/School Director based on the following factors:
              <ul className="list-disc list-inside mt-2 ml-4 px-4 mb-2">
                <li>Performance over a period of time which is worthy of recognition;</li>
                <li>
                  The relationship of a faculty member’s salary to that of other faculty taking into considerationtotal
                  years of service at UBC; and
                </li>
                <li>Market considerations.</li>
              </ul>
              <i>
                Note: Normally, PSA would not be awarded to members in their first three (3) years of employment as a
                Faculty Member at UBC.
              </i>
              <br />
              <br />
              <b>
                <i>
                  Please indicate below <u>ONLY</u> if you wish to opt out of PSA considerations.
                </i>
              </b>
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  id="psa"
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  checked={psa === "NO"}
                  onChange={(e) => {
                    setPsa(e.target.checked ? "NO" : "YES");
                    clearError("psa");
                  }}
                />
                <label htmlFor="psa" className="ml-3 text-gray-700 font-medium">
                  I do NOT wish to be considered for PSA.
                </label>
              </div>
            </div>

            <div className="mt-4 flex items-center">
              <label className="block text-base font-semibold">
                <span className="text-gray-700 mr-4">
                  Date of Submission <span className="text-red-500">*</span>
                </span>
              </label>
              <div className="relative w-56 ">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FaRegCalendarAlt />
                </span>
                <input
                  type="date"
                  className={`
                    pl-10 pr-4 py-2 rounded-lg border transition-colors duration-150 w-full
                    text-base bg-white shadow-sm
                    border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200
                    ${validationErrors.psaSubmissionDate ? "border-red-500 ring-2 ring-red-200" : ""}
                  `}
                  value={psaSubmissionDate}
                  onChange={(e) => {
                    setPsaSubmissionDate(e.target.value);
                    validateSubmissionDate(e.target.value, "psaSubmissionDate");
                  }}
                  placeholder="Select submission date"
                  required
                />
              </div>
            </div>
            {validationErrors.psaSubmissionDate && (
              <div className="text-red-500 text-sm mt-2">{validationErrors.psaSubmissionDate}</div>
            )}
          </div>
        </div>

        <div id="declaration-field-promotion">
          <h2 className="text-lg font-semibold mb-3">
            FOM Promotion Review <span className="text-red-500">*</span>
          </h2>
          <div className="bg-gray-50 py-6 px-8  rounded-lg shadow-sm border">
            <p className="text-gray-500">
              {hasSelectedYear ? (
                <>
                  For those faculty in ranks other than Professor or Professor of Teaching, please indicate whether you
                  wish to be considered for review for promotion during the upcoming academic year (July 1,{" "}
                  {reportingYearNum} – June 30, {nextYearNum}) for an effective of July 1, {nextYearNum}.
                </>
              ) : (
                <>Please select a year first.</>
              )}
            </p>
            <select
              className={`select select-bordered w-3/5 mt-5 ${validationErrors.promotion ? "border-red-500" : ""}`}
              value={promotion}
              onChange={(e) => {
                setPromotion(e.target.value);
                clearError("promotion");
              }}
              required
              disabled={!hasSelectedYear}
            >
              <option value=""></option>
              <option value="YES">I do wish to be considered for promotion.</option>
              <option value="NO">I do NOT wish to be considered for promotion.</option>
            </select>
            {validationErrors.promotion && (
              <div className="text-red-500 text-sm mt-1">{validationErrors.promotion}</div>
            )}

            {hasSelectedYear ? (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-gray-700 mb-3">
                  <b>If applicable, please specify the anticipated effective date for your next promotion:</b>
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-700 font-medium">Effective Date:</span>
                  <span className="text-gray-600">July 1,</span>
                  <select
                    className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm min-w-[100px]"
                    value={promotionEffectiveDate || (nextYearNum || "")}
                    onChange={(e) => setPromotionEffectiveDate(e.target.value)}
                  >
                    <option value={nextYearNum}>{nextYearNum}</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = nextYearNum + i + 1;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <p className="text-sm text-gray-600 italic mt-3">
                  <b>Note:</b> The application deadline is one year prior to the effective date. By default, the
                  promotion will be effective from July 1, {nextYearNum}.
                </p>
              </div>
            ) : (
              <></>
            )}

            {hasSelectedYear ? (
              <p className="mt-4 text-gray-500">
                <b>Anticipated pathway for Research Stream</b>
                <br />
                <ul className="list-disc list-inside mt-2 ml-4 px-4 mb-2">
                  <li>Traditional</li>
                  <ul className="list-disc list-inside ml-4 px-4">
                    <li>Indigenous scholarly activity</li>
                  </ul>
                  <li>Blended with scholarship of teaching or professional contributions</li>
                </ul>
              </p>
            ) : (
              <></>
            )}

            <p className="text-gray-500">
              <br />
              <b>
                Please note that all faculty are <u>required</u> to submit an annual activity report, regardless of
                whether they wish to be considered for promotion.
              </b>
            </p>

            <div className="mt-4 flex items-center">
              <label className="block text-base font-semibold">
                <span className="text-gray-700 mr-4">
                  Date of Submission <span className="text-red-500">*</span>
                </span>
              </label>
              <div className="relative w-56 ">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FaRegCalendarAlt />
                </span>
                <input
                  type="date"
                  className={`
                    pl-10 pr-4 py-2 rounded-lg border transition-colors duration-150 w-full
                    text-base bg-white shadow-sm
                    border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200
                    ${validationErrors.promotionSubmissionDate ? "border-red-500 ring-2 ring-red-200" : ""}
                  `}
                  value={promotionSubmissionDate}
                  onChange={(e) => {
                    setPromotionSubmissionDate(e.target.value);
                    validateSubmissionDate(e.target.value, "promotionSubmissionDate");
                  }}
                  placeholder="Select submission date"
                  required
                />
              </div>
            </div>
            {validationErrors.promotionSubmissionDate && (
              <div className="text-red-500 text-sm mt-2">{validationErrors.promotionSubmissionDate}</div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">FOM Honorific Impact Report</h2>
          <div className="bg-gray-50 py-6 px-8 rounded-lg shadow-sm border overflow-y-auto">
            <p className="text-gray-500">
              If you are the holder of a Faculty of Medicine Honorific (i.e., Chair, Professorship, Distinguished
              Scholar), please provide a summary of the impact your activities have had on the advancement of medical
              research, education and community service in the recent calendar year.
              <br />
              <br />
              Please complete the field below (approximately 100 words) explaining the impact your activities have made
              to education and/or research and/or community service over the past year. Consider this your “elevator
              pitch” – provide the most impactful highlight(s) of the work being conducted in the name of the honorific.
              This information will be used by the Development Office in its report to the stakeholder(s), and may be
              used more broadly to bring additional awareness to the Faculty’s accomplishments.
              <br />
              <br />
              Alternately, if a full report has recently been prepared, please attach a copy of the report.
              <br />
              <br />
              <b>
                Please submit your impact report to your Department Head / School Director and{" "}
                <span className="text-blue-500">
                  <u>fomdae.assistant@ubc.ca</u>
                </span>
                .
              </b>
              <ul className="list-disc list-inside mt-2 ml-4 px-4 mb-2">
                <li>Full or Summary Report is attached; OR</li>
                <li>Report is as follows:</li>
              </ul>
              <br />
              <u>Short Paragraph (approximately 100 words)</u>
            </p>
            <textarea
              className="mt-6 w-full rounded-lg border-4 border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 resize-y min-h-[100px] transition-all duration-150"
              placeholder="Enter your Honorific Impact Report here..."
              value={honorific}
              onChange={(e) => setHonorific(e.target.value)}
              rows={7}
            />
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <button type="button" className="btn btn-primary px-6 py-2 rounded-lg shadow transition" onClick={onSave}>
            {isEdit ? "Update Declaration" : "Save Declaration"}
          </button>
          {Object.keys(validationErrors).length > 0 && (
            <div className="text-red-500 text-sm mt-2">Please fill all required fields above before submitting.</div>
          )}
          <button
            className="btn btn-outline btn-error mt-6"
            onClick={() => {
              onCancel();
              setValidationErrors({});
            }}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeclarationForm;
