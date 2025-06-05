import React, { useState, useRef, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import FacultyMenu from "../Components/FacultyMenu.jsx";
import DeclarationForm from "../Components/DeclarationForm.jsx";
import {
  getUserDeclarations,
  addUserDeclaration,
  deleteUserDeclaration,
  updateUserDeclaration,
} from "../graphql/graphqlHelpers";
import { Link } from "react-router-dom";
import { FaRegCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Helper to map value to full label
const DECLARATION_LABELS = {
  coi: {
    YES: "YES, my Conflict of Interest and Conflict of Commitment declarations are up to date.",
    NO: "NO, my Conflict of Interest and Conflict of Commitment declarations are NOT up to date.",
  },
  fomMerit: {
    YES: "I do wish to be awarded merit for my academic activities.",
    NO: "I do NOT wish to be awarded merit for my academic activities.",
  },
  psa: {
    YES: "I do wish to be considered for PSA.",
    NO: "I do NOT wish to be considered for PSA.",
  },
  promotion: {
    YES: "I do wish to be considered for promotion.",
    NO: "I do NOT wish to be considered for promotion.",
  },
};

export const normalizeDeclarations = (rawDeclarations) => {
  return rawDeclarations.map((decl) => {
    let other = {};
    try {
      other = JSON.parse(decl.other_data || "{}");
    } catch (e) {
      other = {};
    }
    return {
      year: Number(decl.reporting_year),
      coi: (other.conflict_of_interest || "").toUpperCase(),
      fomMerit: (other.fom_merit || "").toUpperCase(),
      psa: (other.psa_awards || "").toUpperCase(),
      promotion: (other.fom_promotion_review || "").toUpperCase(),
      meritJustification: other.merit_justification || "",
      psaJustification: other.psa_justification || "",
      honorific: other.fom_honorific_impact_report || "",
      created_by: decl.created_by,
      created_on: decl.created_on,
      updated_at: other.updated_at || null, // <-- add this line
    };
  });
};

const fetchDeclarations = async (first_name, last_name) => {
  try {
    const result = await getUserDeclarations(first_name, last_name);
    // Normalize the API response to match the UI's expected format
    return normalizeDeclarations(result);
  } catch (error) {
    console.error("Error fetching declarations:", error);
  }
  return [];
};

const Declarations = ({ userInfo, getCognitoUser, toggleViewMode }) => {
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Year logic
  const thisYear = new Date().getFullYear();
  const nextYear = thisYear + 1;

  // Only show years that don't already exist
  const availableYears = [
    { value: thisYear, label: thisYear.toString() },
    { value: nextYear, label: nextYear.toString() },
  ].filter((opt) => !declarations.some((d) => d.year === Number(opt.value)));

  // Find current and next year declarations
  const currentYearDecl = declarations.find((d) => d.year === thisYear);
  const nextYearDecl = declarations.find((d) => d.year === nextYear);
  const disableCreate = !!currentYearDecl && !!nextYearDecl;

  // Fetch declarations from Lambda on mount or when user changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await fetchDeclarations(
          userInfo.first_name,
          userInfo.last_name
        );
        setDeclarations(data);
      } catch (err) {
        setFetchError("Could not load declarations.");
        setDeclarations([]);
      }
      setLoading(false);
    };
    if (userInfo?.first_name && userInfo?.last_name) {
      fetchData();
    }
  }, [userInfo?.first_name, userInfo?.last_name]);
  // Find the biggest/latest year
  const currentYear =
    declarations.length > 0
      ? Math.max(...declarations.map((d) => d.year))
      : null;

  // Expand the current year by default on mount or when declarations change
  useEffect(() => {
    if (currentYear) setExpandedYear(currentYear);
  }, [currentYear]);

  const [expandedYear, setExpandedYear] = useState(currentYear);

  // State for showing the form (create or edit)
  const [showForm, setShowForm] = useState(false);
  const [editYear, setEditYear] = useState(null); // track which year is being edited

  // Controlled state for select fields
  const formRef = useRef(null); // scroll to form
  const [coi, setCoi] = useState("");
  const [fomMerit, setFomMerit] = useState("");
  const [psa, setPsa] = useState("");
  const [promotion, setPromotion] = useState("");
  // Controlled state for textareas (optional, for future save logic)
  const [meritJustification, setMeritJustification] = useState("");
  const [psaJustification, setPsaJustification] = useState("");
  const [honorific, setHonorific] = useState("");
  const [year, setYear] = useState("");

  // Handler for edit button
  const handleEdit = (year) => {
    setEditYear(year);
    setShowForm(true);
    const data = declarations.find((d) => d.year === year);
    setYear(year);
    setCoi(data?.coi || "");
    setFomMerit(data?.fomMerit || "");
    setPsa(data?.psa || "");
    setPromotion(data?.promotion || "");
    setMeritJustification(data?.meritJustification || "");
    setPsaJustification(data?.psaJustification || "");
    setHonorific(data?.honorific || "");
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleDelete = async (year) => {
    try {
      await deleteUserDeclaration(
        userInfo.first_name,
        userInfo.last_name,
        year
      );
      toast.success("Declaration deleted successfully!", {
        autoClose: 2000,
        theme: "light",
      }); // <-- Add this line
      const data = await fetchDeclarations(
        userInfo.first_name,
        userInfo.last_name
      );
      setDeclarations(data);
    } catch (error) {
      alert("Failed to delete declaration.");
      console.error("Error delete declaration:", error);
    }
  };

  // Handler for create new declaration
  const handleCreate = () => {
    setEditYear(null);
    setShowForm(true);
    setYear("");
    setCoi("");
    setFomMerit("");
    setPsa("");
    setPromotion("");
    setMeritJustification("");
    setPsaJustification("");
    setHonorific("");
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Reset fields on cancel and close form
  const handleCancel = () => {
    setShowForm(false);
    setEditYear(null);
    setYear("");
    setCoi("");
    setFomMerit("");
    setPsa("");
    setPromotion("");
    setMeritJustification("");
    setPsaJustification("");
    setHonorific("");
  };

  // Handler for saving a new declaration (calls Lambda)
  const handleSave = async () => {
    // Validation logic
    const errors = {};
    if (!editYear && (!year || year === ""))
      errors.year = "Please select a reporting year.";
    if (!coi) errors.coi = "Please select Yes or No.";
    if (!fomMerit) errors.fomMerit = "Please select Yes or No.";
    if (!psa) errors.psa = "Please select Yes or No.";
    if (!promotion) errors.promotion = "Please select Yes or No.";

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Scroll to the first error field
      setTimeout(() => {
        const firstErrorKey = [
          "year",
          "coi",
          "fomMerit",
          "psa",
          "promotion",
        ].find((key) => errors[key]);
        if (firstErrorKey) {
          const el = document.getElementById(
            `declaration-field-${firstErrorKey}`
          );
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus?.();
          }
        }
      }, 100);
      return;
    }

    // Build the input object for the mutation
    const input = {
      first_name: userInfo.first_name,
      last_name: userInfo.last_name,
      reporting_year: Number(editYear || year),
      created_by: userInfo.email || userInfo.first_name,
      other_data: JSON.stringify({
        conflict_of_interest: coi.toLowerCase(),
        fom_merit: fomMerit.toLowerCase(),
        merit_justification: meritJustification || null,
        psa_awards: psa.toLowerCase(),
        psa_justification: psaJustification || null,
        fom_promotion_review: promotion.toLowerCase(),
        fom_honorific_impact_report: honorific || null,
        updated_at: editYear ? new Date().toISOString() : null,
      }),
    };

    try {
      if (editYear) {
        // Edit mode: update
        await updateUserDeclaration(input);
        toast.success("Declaration updated successfully!", { autoClose: 2000 });
      } else {
        // Create mode: add
        await addUserDeclaration(input);
        toast.success("Declaration added successfully!", { autoClose: 2000 });
      }
      setShowForm(false);
      setEditYear(null);
      setYear("");
      setCoi("");
      setFomMerit("");
      setPsa("");
      setPromotion("");
      setMeritJustification("");
      setPsaJustification("");
      setHonorific("");
      setValidationErrors({});
      // Refresh declarations
      const data = await fetchDeclarations(
        userInfo.first_name,
        userInfo.last_name
      );
      setDeclarations(data);
    } catch (error) {
      if (editYear) {
        alert("Failed to update declaration.");
        console.error("Error updating declaration:", error);
      } else if (
        !editYear &&
        error.message &&
        error.message.includes("Entry already exists")
      ) {
        alert("A declaration for this year already exists.");
      } else {
        alert("Failed to save declaration.");
        console.error("Error saving declaration:", error);
      }
    }
  };

  const yearOptionsForForm = React.useMemo(() => {
    if (editYear) {
      // In edit mode, show only the year being edited
      return [{ value: editYear, label: editYear.toString() }];
    }
    // In create mode, show only available years
    return [{ value: "", label: "Select year..." }, ...availableYears];
  }, [editYear, availableYears]);

  return (
    <PageContainer>
      {/* Sidebar */}
      <FacultyMenu
        getCognitoUser={getCognitoUser}
        userName={userInfo.preferred_name || userInfo.first_name}
        toggleViewMode={toggleViewMode}
        userInfo={userInfo}
      />

      {/* Main content */}
      <main className="ml-4 pr-5 w-full overflow-auto mt-2 py-6 px-4">
        {/* Heading row */}
        <div className="max-w-6xl mx-auto px-0 mb-2">
          <div className="text-4xl font-bold text-zinc-600">Declarations</div>
        </div>

        {/* Button row */}
        <div className="flex justify-end max-w-6xl mx-auto px-0 mb-4">
          <button
            className={`btn btn-primary px-6 py-2 rounded-lg shadow transition
        ${
          disableCreate
            ? "bg-gray-300 text-gray-600 border border-gray-400 cursor-not-allowed opacity-90"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }
      `}
            onClick={handleCreate}
            disabled={disableCreate}
          >
            Create New Declaration
          </button>
        </div>

        {/* Declarations List Dropdown */}
        <div className="mb-8 max-w-6xl mx-auto px-0">
          <div className="space-y-6">
            {loading ? (
              <div className="rounded-2xl bg-zinc-100 shadow-xl border-2 border-zinc-300 px-10 py-10 flex items-center justify-center text-lg text-gray-500">
                Loading...
              </div>
            ) : fetchError ? (
              <div className="rounded-2xl bg-red-100 shadow-xl border-2 border-red-300 px-10 py-10 flex items-center justify-center text-lg text-red-500">
                {fetchError}
              </div>
            ) : declarations.length === 0 ? (
              <div className="rounded-2xl bg-zinc-100 shadow-xl border-2 border-zinc-300 px-10 py-10 flex items-center justify-center text-lg text-gray-500">
                No declarations found.
              </div>
            ) : (
              declarations
                .sort((a, b) => b.year - a.year)
                .map((decl) => {
                  const canEdit =
                    decl.year === thisYear || decl.year === nextYear;
                  const isCurrent = decl.year === thisYear;
                  const isNext = decl.year === nextYear;
                  return (
                    <div
                      key={decl.year}
                      className={`
                        flex flex-col rounded-xl shadow transition
                        w-full max-w-6xl mx-auto mb-2 border-l-8 px-2 py-2
                        ${
                          isCurrent
                            ? "border-blue-500 bg-white"
                            : isNext
                            ? "border-green-500 bg-white"
                            : "border-zinc-300 bg-zinc-50"
                        }
                        ${
                          expandedYear === decl.year
                            ? "ring-2 ring-blue-300"
                            : ""
                        }
                      `}
                    >
                      <button
                        className="flex items-center justify-between px-6 py-3 text-left hover:bg-blue-50 transition rounded-t-xl"
                        onClick={() =>
                          setExpandedYear(
                            expandedYear === decl.year ? null : decl.year
                          )
                        }
                      >
                        <div className="flex items-center gap-3 px-2">
                          <FaRegCalendarAlt
                            className={`text-xl ${
                              isCurrent
                                ? "text-blue-500"
                                : isNext
                                ? "text-green-500"
                                : "text-zinc-400"
                            }`}
                          />
                          <span
                            className={`font-bold text-lg ${
                              isCurrent
                                ? "text-blue-700"
                                : isNext
                                ? "text-green-700"
                                : "text-zinc-600"
                            }`}
                          >
                            {decl.year}
                          </span>
                          {isCurrent && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 font-semibold">
                              Current
                            </span>
                          )}
                          {isNext && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 font-semibold">
                              Next
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          {canEdit && (
                            <>
                              <button
                                className="btn btn-s btn-outline text-blue-600 border-blue-400 hover:bg-blue-500 hover:text-white transition"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(decl.year);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-s btn-outline text-red-600 border-red-400 hover:bg-red-500 hover:text-white transition ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(decl.year);
                                }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                          <svg
                            className={`w-6 h-6 ml-2 transition-transform ${
                              expandedYear === decl.year ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>
                      {expandedYear === decl.year && (
                        <div className="px-6 ml-10 pb-4 pt-2 text-gray-700 text-base">
                          <div className="mb-4">
                            <b>Conflict of Interest and Commitment:</b>
                            <div className="ml-4">
                              {DECLARATION_LABELS.coi[decl.coi] || decl.coi}
                            </div>
                          </div>
                          <div className="mb-4">
                            <b>FOM Merit:</b>
                            <div className="ml-4">
                              {DECLARATION_LABELS.fomMerit[decl.fomMerit] ||
                                decl.fomMerit}
                            </div>
                            {decl.meritJustification && (
                              <div className="ml-4 mt-1 text-mmt-1 text-m text-gray-500">
                                <b>Justification:</b> {decl.meritJustification}
                              </div>
                            )}
                          </div>
                          <div className="mb-4">
                            <b>PSA Awards:</b>
                            <div className="ml-4">
                              {DECLARATION_LABELS.psa[decl.psa] || decl.psa}
                            </div>
                            {decl.psaJustification && (
                              <div className="ml-4 mt-1 text-m text-gray-500">
                                <b>Justification:</b> {decl.psaJustification}
                              </div>
                            )}
                          </div>
                          <div className="mb-4">
                            <b>Promotion Review:</b>
                            <div className="ml-4">
                              {DECLARATION_LABELS.promotion[decl.promotion] ||
                                decl.promotion}
                            </div>
                          </div>
                          {decl.honorific && (
                            <div className="mb-4">
                              <b>Honorific Impact Report:</b>
                              <div className="ml-4 text-m mt-1text-gray-600">
                                {decl.honorific}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col text-xs text-gray-500 items-end justify-end">
                            <div>
                              Created by: {decl.created_by} &nbsp;|&nbsp;{" "}
                              {decl.created_on
                                ? decl.created_on.split(" ")[0]
                                : ""}
                            </div>
                            {decl.updated_at && (
                              <div className="mt-1 items-end">
                                Updated &nbsp;:&nbsp;{" "}
                                {decl.updated_at.split("T")[0]}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Declaration Form (Create/Edit) */}
        {showForm && (
          <DeclarationForm
            editYear={editYear}
            year={year}
            setYear={setYear}
            coi={coi}
            setCoi={setCoi}
            fomMerit={fomMerit}
            setFomMerit={setFomMerit}
            psa={psa}
            setPsa={setPsa}
            promotion={promotion}
            setPromotion={setPromotion}
            meritJustification={meritJustification}
            setMeritJustification={setMeritJustification}
            psaJustification={psaJustification}
            setPsaJustification={setPsaJustification}
            honorific={honorific}
            setHonorific={setHonorific}
            formRef={formRef}
            onCancel={handleCancel}
            onSave={handleSave}
            yearOptions={yearOptionsForForm}
            isEdit={!!editYear}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors} // <-- Add this line
          />
        )}
      </main>
    </PageContainer>
  );
};

export default Declarations;
