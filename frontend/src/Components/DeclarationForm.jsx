import React from "react";
import { FaRegCalendarAlt } from "react-icons/fa"; // Add at the top if using react-icons

const sc3_link = "https://google.com"; // todo , link broken on APT website
const unicouncil_link = "https://universitycounsel.ubc.ca/subject-areas/coi/";
const orcs_link = "https://ors.ubc.ca/";

const DeclarationForm = ({
  editYear,
  year,
  setYear,
  coi,
  setCoi,
  fomMerit,
  setFomMerit,
  psa,
  setPsa,
  promotion,
  setPromotion,
  meritJustification,
  setMeritJustification,
  psaJustification,
  setPsaJustification,
  honorific,
  setHonorific,
  formRef,
  onCancel,
  onSave,
  yearOptions = [],
  isEdit = false,
  validationErrors = {},
  setValidationErrors, // <-- Add this prop!
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
                ${
                  validationErrors.year
                    ? "border-red-500 ring-2 ring-red-200"
                    : ""
                }
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
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.value === ""}
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {validationErrors.year && (
            <div className="text-red-500 text-sm mt-1">
              {validationErrors.year}
            </div>
          )}
        </div>

        <div id="declaration-field-coi">
          <h2 className="text-lg font-semibold mb-3">
            Conflict of Interest and Commitment Declaration{" "}
            <span className="text-red-500">*</span>
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm border max-h-96 overflow-y-auto border-r-8 border-r-blue-500">
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
              , you must maintain up-to-date Conflict of Interest and Conflict
              of Commitment declarations. For more information regarding
              Conflict of Interest and Commitment, please refer to the
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
              Please indicate whether your Conflict of Interest and Conflict of
              Commitment declarations are up to date.
            </p>
            <select
              className={`select select-bordered w-3/5 mt-5 ${
                validationErrors.coi ? "border-red-500" : ""
              }`}
              value={coi}
              onChange={(e) => {
                setCoi(e.target.value);
                clearError("coi");
              }}
              required
            >
              <option value=""></option>
              <option value="YES">
                Yes, my Conflict of Interest and Conflict of Commitment
                declarations are up to date.
              </option>
              <option value="NO">
                No, my Conflict of Interest and Conflict of Commitment
                declarations are NOT up to date.
              </option>
            </select>
            {validationErrors.coi && (
              <div className="text-red-500 text-sm mt-1">
                {validationErrors.coi}
              </div>
            )}
          </div>
        </div>

        <div id="declaration-field-fomMerit">
          <h2 className="text-lg font-semibold mb-3">
            FOM Merit <span className="text-red-500">*</span>
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm border max-h-96 overflow-y-auto">
            <p className="text-gray-500">
              All eligible members shall be considered for a <b>merit award</b>{" "}
              by their Department Head/School Director and a reasonable number
              of colleagues.
              <br />
              <br />
              <i>
                Note: If you request not to be awarded merit, you will still be
                considered for a Faculty of Medicine Outstanding Academic
                Performance (OAP) award.
              </i>
              <br />
              <br />
              Please indicate your request below:
            </p>
            <select
              className={`select select-bordered w-3/5 mt-5 ${
                validationErrors.fomMerit ? "border-red-500" : ""
              }`}
              value={fomMerit}
              onChange={(e) => {
                setFomMerit(e.target.value);
                clearError("fomMerit");
              }}
              required
            >
              <option value=""></option>
              <option value="YES">
                I do wish to be awarded merit for my academic activities.
              </option>
              <option value="NO">
                I do NOT wish to be awarded merit for my academic activities.
              </option>
            </select>
            {validationErrors.fomMerit && (
              <div className="text-red-500 text-sm mt-1">
                {validationErrors.fomMerit}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Merit Justification</h2>
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm border overflow-y-auto">
            <div className="bg-gray-100 p-6 rounded-lg shadow-sm border max-h-96 overflow-y-auto border-l-8 border-l-blue-500">
              <p className="text-gray-500">
                When requesting merit consideration, please provide a summary of
                your relevant achievements in the following areas:
                <br />
                1. Teaching activities and impact,
                <br />
                2. Scholarly activities and accomplishments and
                <br />
                3. Service contributions to the department, faculty, and broader
                community.
                <br />
                <br />
                Your summary should highlight key contributions and achievements
                that support your merit consideration.
              </p>
            </div>
            <textarea
              className="mt-6 w-full rounded-lg border-4 border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 resize-y min-h-[120px] transition-all duration-150"
              placeholder="Enter your merit justification here... (OPTIONAL)"
              value={meritJustification}
              onChange={(e) => setMeritJustification(e.target.value)}
              rows={7}
            />
          </div>
        </div>

        <div id="declaration-field-psa">
          <h2 className="text-lg font-semibold mb-3">
            PSA Awards <span className="text-red-500">*</span>
          </h2>
          <div className="bg-gray-50 p-16 rounded-lg shadow-sm border overflow-y-auto">
            <p className="text-gray-500">
              Department Head/School Director reviews and makes recommendations
              for <b>PSA awards</b> based on the following factors:
              <br />
              <br />
              <ul className="list-disc list-inside">
                <li>
                  Performance over a period of time which is worthy of
                  recognition;
                </li>
                <li>
                  The relationship of a faculty member’s salary to that of other
                  faculty taking into consideration total years of service at
                  UBC; and
                </li>
                <li>Market considerations.</li>
              </ul>
              <br />
              <br />
              Please indicate your request below:
            </p>
            <select
              className={`select select-bordered w-3/5 mt-5 ${
                validationErrors.psa ? "border-red-500" : ""
              }`}
              value={psa}
              onChange={(e) => {
                setPsa(e.target.value);
                clearError("psa");
              }}
              required
            >
              <option value=""></option>
              <option value="YES">I do wish to be considered for PSA.</option>
              <option value="NO">
                I do NOT wish to be considered for PSA.
              </option>
            </select>
            {validationErrors.psa && (
              <div className="text-red-500 text-sm mt-1">
                {validationErrors.psa}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">PSA Justification:</h2>
          <div className="bg-gray-50 p-10 rounded-lg shadow-sm border overflow-y-auto">
            <textarea
              className="mt-6 w-full rounded-lg border-4 border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 resize-y min-h-[100px] transition-all duration-150"
              placeholder="Enter your PSA justification here... (OPTIONAL)"
              value={psaJustification}
              onChange={(e) => setPsaJustification(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        <div id="declaration-field-promotion">
          <h2 className="text-lg font-semibold mb-3">
            FOM Promotion Review <span className="text-red-500">*</span>
          </h2>
          <div className="bg-gray-50 p-12 rounded-lg shadow-sm border max-h-96 overflow-y-auto">
            <p className="text-gray-500">
              Please indicate whether you wish to be considered for review for
              promotion during the upcoming academic year (July 1, 2023 – June
              30, 2024) for an effective of July 1, 2024.
            </p>
            <select
              className={`select select-bordered w-3/5 mt-5 ${
                validationErrors.promotion ? "border-red-500" : ""
              }`}
              value={promotion}
              onChange={(e) => {
                setPromotion(e.target.value);
                clearError("promotion");
              }}
              required
            >
              <option value=""></option>
              <option value="YES">
                I do wish to be considered for promotion.
              </option>
              <option value="NO">
                I do NOT wish to be considered for promotion.
              </option>
            </select>
            {validationErrors.promotion && (
              <div className="text-red-500 text-sm mt-1">
                {validationErrors.promotion}
              </div>
            )}
            <p className="text-gray-500">
              <br />
              <b>
                Please note that all faculty are required to submit an annual
                activity report, regardless of whether they wish to be
                considered for promotion.
              </b>
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">
            FOM Honorific Impact Report
          </h2>
          <div className="bg-gray-50 p-12 rounded-lg shadow-sm border overflow-y-auto">
            <p className="text-gray-500">
              If you are the holder of a Faculty of Medicine Honorific (i.e.,
              Chair, Professorship, Distinguished Scholar), please provide a
              summary of the impact your activities have had on the advancement
              of medical research, education and community service in the recent
              calendar year.
              <br />
              <br />
              <br />
              Please complete the field below (approximately 100 words)
              explaining the impact your activities have made to education
              and/or research and/or community service over the past year.
              Consider this your “elevator pitch” – provide the most impactful
              highlight(s) of the work being conducted in the name of the
              honorific. This information will be used by the Development Office
              in its report to the stakeholder(s), and may be used more broadly
              to bring additional awareness to the Faculty’s accomplishments.
            </p>
            <textarea
              className="mt-6 w-full rounded-lg border-4 border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 resize-y min-h-[100px] transition-all duration-150"
              placeholder="Enter your Honorific Impact Report here... (OPTIONAL)"
              value={honorific}
              onChange={(e) => setHonorific(e.target.value)}
              rows={7}
            />
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <button
            type="button"
            className="btn btn-primary px-6 py-2 rounded-lg shadow transition"
            onClick={onSave}
          >
            {isEdit ? "Update Declaration" : "Save Declaration"}
          </button>
          {Object.keys(validationErrors).length > 0 && (
            <div className="text-red-500 text-sm mt-2">
              Please fill all required fields above before submitting.
            </div>
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
