import React, { useState, useMemo, useCallback } from "react";
import { FaRegCalendarAlt } from "react-icons/fa";
import CollapsibleSection from "./components/CollapsibleSection";
import DateInput from "./components/DateInput";
import ExternalLink from "./components/ExternalLink";
import ValidationError from "./components/ValidationError";
import YesNoCheckbox from "./components/YesNoCheckbox";
import usePromotionPathways from "./hooks/usePromotionPathways";
import useDateValidation from "./hooks/useDateValidation";

const sc3_link = "https://universitycounsel.ubc.ca/policies/coi-policy/";
const unicouncil_link = "https://universitycounsel.ubc.ca/subject-areas/coi/";
const orcs_link = "https://ors.ubc.ca/";

// Reusable class constants
const CHECKBOX_CLASS = "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2";

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
  supportAnticipated,
  setSupportAnticipated,
  formRef,
  onCancel,
  onSave,
  yearOptions = [],
  isEdit = false,
  validationErrors = {},
  setValidationErrors,
  isProfessor = false,
}) => {
  // State for managing section collapse/expand
  const [expandedSections, setExpandedSections] = useState({
    coi: true,
    fomMerit: false,
    promotion: false,
    honorific: false,
  });

  // Custom hooks
  const { clearError, validateSubmissionDate } = useDateValidation(setValidationErrors);
  const pathwaysHook = usePromotionPathways(promotionPathways, setPromotionPathways);

  // Toggle section expansion with useCallback
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Memoized computed values
  const reportingYear = useMemo(() => isEdit ? editYear : year, [isEdit, editYear, year]);
  const reportingYearNum = useMemo(() => Number(reportingYear), [reportingYear]);
  const nextYearNum = useMemo(() => reportingYearNum ? reportingYearNum + 1 : null, [reportingYearNum]);
  const hasSelectedYear = useMemo(() => !!reportingYearNum, [reportingYearNum]);

  // Memoized event handlers
  const handleYearChange = useCallback((e) => {
    if (!isEdit) {
      setYear(Number(e.target.value));
      clearError("year");
    }
  }, [isEdit, setYear, clearError]);

  return (
    <div className="w-full flex justify-center">
      <div
        ref={formRef}
        className="mb-10 p-12 px-20 w-full rounded-lg gap-6 flex flex-col bg-gray-100 shadow-lg border border-zinc-300"
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
              onChange={handleYearChange}
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
          <ValidationError error={validationErrors.year} />
        </div>

        <CollapsibleSection
          id="declaration-field-coi"
          title="Conflict of Interest and Commitment Declaration"
          isExpanded={expandedSections.coi}
          onToggle={() => toggleSection('coi')}
          isRequired={true}
        >
          <div className="bg-gray-50 py-6 px-8 rounded-lg shadow-sm border max-h-96 overflow-y-auto border-r-8 border-r-blue-500 mt-3">
              <p className="text-gray-500">
                In accordance with{" "}
                <ExternalLink href={sc3_link}>UBC Policy SC3</ExternalLink>
                , you must maintain up-to-date Conflict of Interest and Conflict of Commitment declarations. For more
                information regarding Conflict of Interest and Commitment, please refer to the
                <ExternalLink href={unicouncil_link}> Office of the University Counsel </ExternalLink>
                and the
                <ExternalLink href={orcs_link}> UBC Office of Research Services.</ExternalLink>
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
              <ValidationError error={validationErrors.coi} />

              <DateInput
                label="Date of Submission"
                value={coiSubmissionDate}
                onChange={(e) => {
                  setCoiSubmissionDate(e.target.value);
                  validateSubmissionDate(e.target.value, "coiSubmissionDate");
                }}
                error={validationErrors.coiSubmissionDate}
              />
            </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="declaration-field-fomMerit"
          title="FOM Merit & PSA"
          isExpanded={expandedSections.fomMerit}
          onToggle={() => toggleSection('fomMerit')}
          isRequired={true}
        >
          <div className="bg-gray-50 py-6 px-8 rounded-lg shadow-sm border mt-3">
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
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                {hasSelectedYear ? (
                  <div className="mt-2">
                    <b>
                      <i>
                        Please indicate below <u>ONLY</u> if you wish to opt out of merit considerations.
                      </i>
                    </b>
                    <div className="flex items-start gap-3 mt-6 mb-6">
                      <input
                        id="fomMerit"
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                        checked={fomMerit === "NO"}
                        onChange={(e) => {
                          setFomMerit(e.target.checked ? "NO" : "YES");
                          clearError("fomMerit");
                        }}
                      />
                      <label htmlFor="fomMerit" className="text-gray-700 font-medium">
                        <b>
                          I do{" "}
                          <i>
                            <u>NOT</u>
                          </i>{" "}
                          wish to be awarded merit by the Dean for my academic activities performed during
                          <br />
                          January 1, {reportingYear} – December 31, {reportingYear}.
                        </b>
                      </label>
                    </div>
                  </div>
                ) : (
                  <b>Please select a year first.</b>
                )}
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
                  The relationship of a faculty member’s salary to that of other faculty taking into consideration total
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

            <YesNoCheckbox
              id="psa"
              checked={psa === "NO"}
              onChange={(e) => {
                setPsa(e.target.checked ? "NO" : "YES");
                clearError("psa");
              }}
              label={
                <b>
                  I do{" "}
                  <i>
                    <u>NOT</u>
                  </i>{" "}
                  wish to be considered for PSA.
                </b>
              }
            />

            <DateInput
              label="Date of Submission"
              value={psaSubmissionDate}
              onChange={(e) => {
                setPsaSubmissionDate(e.target.value);
                validateSubmissionDate(e.target.value, "psaSubmissionDate");
              }}
              error={validationErrors.psaSubmissionDate}
            />
          </div>
        </CollapsibleSection>

        {!isProfessor && (
          <CollapsibleSection
            id="declaration-field-promotion"
            title="FOM Promotion Review"
            isExpanded={expandedSections.promotion}
            onToggle={() => toggleSection('promotion')}
            isRequired={true}
          >
            <div className="bg-gray-50 py-6 px-8 rounded-lg shadow-sm border mt-3">
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
            <ValidationError error={validationErrors.promotion} />

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
                    value={promotionEffectiveDate || nextYearNum || ""}
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
            ) : null}

            {hasSelectedYear && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-700 font-semibold mb-3">
                  <b>Anticipated pathway for Research Stream</b>
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        id="traditional"
                        type="checkbox"
                        className={CHECKBOX_CLASS}
                        checked={pathwaysHook.hasTraditional}
                        onChange={(e) => pathwaysHook.toggleTraditional(e.target.checked)}
                      />
                      <label htmlFor="traditional" className="ml-2 text-gray-700 font-medium">
                        Traditional
                      </label>
                    </div>

                    <div className="ml-6">
                      <div className="flex items-center">
                        <input
                          id="indigenous"
                          type="checkbox"
                          className={CHECKBOX_CLASS}
                          checked={pathwaysHook.hasIndigenous}
                          onChange={(e) => pathwaysHook.toggleIndigenous(e.target.checked)}
                        />
                        <label htmlFor="indigenous" className="ml-2 text-gray-700">
                          Indigenous scholarly activity
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="blended"
                      type="checkbox"
                      className={CHECKBOX_CLASS}
                      checked={pathwaysHook.hasBlended}
                      onChange={(e) => pathwaysHook.toggleBlended(e.target.checked)}
                    />
                    <label htmlFor="blended" className="ml-2 text-gray-700 font-medium">
                      Blended with scholarship of teaching or professional contributions
                    </label>
                  </div>
                </div>
              </div>
            )}

            {hasSelectedYear && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-700 font-semibold mb-3">
                  <b>Support anticipated</b>
                </p>
                <textarea
                  className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 resize-y min-h-[100px] transition-all duration-150"
                  placeholder="Please describe any support anticipated for your promotion application (optional)..."
                  value={supportAnticipated}
                  onChange={(e) => setSupportAnticipated(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            <p className="text-gray-500">
              <br />
              <b>
                Please note that all faculty are <u>required</u> to submit an annual activity report, regardless of
                whether they wish to be considered for promotion.
              </b>
            </p>

            <DateInput
              label="Date of Submission"
              value={promotionSubmissionDate}
              onChange={(e) => {
                setPromotionSubmissionDate(e.target.value);
                validateSubmissionDate(e.target.value, "promotionSubmissionDate");
              }}
              error={validationErrors.promotionSubmissionDate}
            />
          </div>
          </CollapsibleSection>
        )}

        <CollapsibleSection
          id="declaration-field-honorific"
          title="FOM Honorific Impact Report"
          isExpanded={expandedSections.honorific}
          onToggle={() => toggleSection('honorific')}
        >
          <div className="bg-gray-50 py-6 px-8 rounded-lg shadow-sm border overflow-y-auto mt-3">
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
              Alternately, if a full report has recently been prepared, please email a copy of the report.
              <br />
              <br />
              <b>
                Please submit your impact report to your Department Head / School Director and{" "}
                <ExternalLink href="mailto:fomdae.assistant@ubc.ca">fomdae.assistant@ubc.ca</ExternalLink>.
              </b>
              <ul className="list-disc list-inside mt-2 ml-4 px-4 mb-2">
                <li>Full or Summary Report is emailed; OR</li>
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
        </CollapsibleSection>

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
