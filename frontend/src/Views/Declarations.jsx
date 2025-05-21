import React, { useState, useRef, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import FacultyMenu from "../Components/FacultyMenu.jsx";
import DeclarationForm from "../Components/DeclarationForm.jsx";
import { getUserDeclarations } from "../graphql/graphqlHelpers";
import { Link } from "react-router-dom";

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

// Dummy data in correct format (matches backend/Lambda format)
const dummyDeclarations = [
  {
    year: 2025,
    coi: "YES",
    fomMerit: "NO",
    psa: "YES",
    promotion: "NO",
    meritJustification: "Contributed to teaching and research.",
    psaJustification: "Recognized for outstanding service.",
    honorific: "Led a major research initiative.",
  },
  {
    year: 2024,
    coi: "YES",
    fomMerit: "YES",
    psa: "NO",
    promotion: "NO",
    meritJustification: "Improved curriculum.",
    psaJustification: "",
    honorific: "",
  },
];

const fetchDeclarations = async (
  first_name,
  last_name,
  reporting_year = null
) => {
  // Replace with your actual Lambda endpoint
  try {
    const result = await getUserDeclarations(
      first_name,
      last_name,
      reporting_year
    );
    console.log("Lambda result function fetchDeclarations:", result);
    return await result.json();
  } catch (error) {
    console.error("Error fetching declarations:", error);
  }
  return [];
};

const Declarations = ({ userInfo, getCognitoUser, toggleViewMode }) => {
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Find the biggest/latest year
  const currentYear =
    declarations.length > 0
      ? Math.max(...declarations.map((d) => d.year))
      : null;

  // State for expanded declaration year
  const [expandedYear, setExpandedYear] = useState(currentYear);

  // Expand the current year by default on mount or when declarations change
  useEffect(() => {
    if (currentYear) setExpandedYear(currentYear);
  }, [currentYear]);

  // Fetch declarations from Lambda on mount or when user changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        // Uncomment this to use Lambda:
        const data = await fetchDeclarations(
          userInfo.first_name,
          userInfo.last_name
        );
        setDeclarations(data);

        // For now, use dummy data in correct format:
        // setDeclarations(dummyDeclarations);
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

  // State for showing the form (create or edit)
  const [showForm, setShowForm] = useState(false);
  // Optionally, track which year is being edited
  const [editYear, setEditYear] = useState(null);

  // Controlled state for select fields
  const [coi, setCoi] = useState("");
  const [fomMerit, setFomMerit] = useState("");
  const [psa, setPsa] = useState("");
  const [promotion, setPromotion] = useState("");
  // Controlled state for textareas (optional, for future save logic)
  const [meritJustification, setMeritJustification] = useState("");
  const [psaJustification, setPsaJustification] = useState("");
  const [honorific, setHonorific] = useState("");
  const [year, setYear] = useState("");

  // For scrolling to form
  const formRef = useRef(null);

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

  // Handler for create new declaration
  const handleCreate = () => {
    setEditYear(null);
    setShowForm(true);
    setYear(""); // Reset year as well
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

  // Optionally, implement onSave logic
  const handleCancel = () => {
    setShowForm(false);
    setEditYear(null);
    setYear(""); // Reset year as well
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
    // Implement your save logic here, e.g. POST to Lambda with all form fields
    // After saving, re-fetch declarations
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
    // Optionally, re-fetch declarations here
  };

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
      <main className="ml-4 pr-5 w-full overflow-auto py-6 px-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-10 px-4">
          <div>
            <div className="text-4xl font-bold text-zinc-600">Declarations</div>
            <div className="text-sm text-gray-500">
              Last visit: 6 Nov 2025, 3:16PM (static)
            </div>
          </div>
          <div>
            <Link to="/support">
              <button className="btn btn-sm btn-success">Get Help</button>
            </Link>
          </div>
        </div>

        {/* Declarations List Dropdown */}
        <div className="mb-12 px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xl font-bold">Previous Declarations</div>
            <button
              className="btn btn-primary bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
              onClick={handleCreate}
            >
              Create New Declaration
            </button>
          </div>
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
                .map((decl) => (
                  <div
                    key={decl.year}
                    className={`
                      rounded-2xl 
                      shadow-l 
                      transition 
                      w-full h-full
                      ${
                        expandedYear === decl.year ? "ring-2 ring-blue-400" : ""
                      }
                      ${
                        decl.year === currentYear
                          ? "border-2 border-blue-500 bg-gray-90"
                          : "border-2 border-zinc-400 bg-zinc-200"
                      }
                    `}
                    style={{ paddingTop: 0, paddingBottom: 0 }}
                  >
                    <button
                      className="w-full h-full flex justify-between items-center px-8 py-4 text-left hover:bg-gray-100 transition rounded-2xl"
                      onClick={() =>
                        setExpandedYear(
                          expandedYear === decl.year ? null : decl.year
                        )
                      }
                    >
                      <span className="font-bold text-zinc-700 text-2xl">
                        {decl.year}
                      </span>
                      <div className="flex items-center gap-4">
                        {/* Edit button: only for the latest year */}
                        {decl.year === currentYear && (
                          <button
                            className="btn btn-md btn-outline text-blue-500 border-l border-blue-500 mr-2 
                          hover:bg-blue-500 hover:text-white transition "
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(decl.year);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {/* Drop down arrow */}
                        <svg
                          className={`w-7 h-7 transform transition-transform ${
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
                      <div className="mx-8 mt-1 mb-4 px-12 py-2 text-gray-700 bg-gray-200 rounded-2xl">
                        <div className="mb-3">
                          <b>
                            Conflict of Interest and Commitment Declaration:
                          </b>
                          <ul className="list-disc list-inside mt-1 indent-6">
                            <li>
                              {DECLARATION_LABELS.coi[decl.coi] || decl.coi}
                            </li>
                          </ul>
                        </div>
                        <div className="mb-3">
                          <b>FOM Merit Declaration:</b>
                          <ul className="list-disc list-inside mt-1 indent-6">
                            <li>
                              {DECLARATION_LABELS.fomMerit[decl.fomMerit] ||
                                decl.fomMerit}
                            </li>
                            {decl.meritJustification && (
                              <div className="mb-3">
                                <li>
                                  <b>Justification:</b>{" "}
                                  {decl.meritJustification}
                                </li>
                              </div>
                            )}
                          </ul>
                        </div>
                        <div className="mb-3">
                          <b>PSA Awards Declaration:</b>
                          <ul className="list-disc list-inside mt-1 indent-6">
                            <li>
                              {DECLARATION_LABELS.psa[decl.psa] || decl.psa}
                            </li>
                            {decl.psaJustification && (
                              <div className="mb-3">
                                <li>
                                  <b>Justification:</b> {decl.psaJustification}
                                </li>
                              </div>
                            )}
                          </ul>
                        </div>
                        <div className="mb-3">
                          <b>Promotion Review Declaration:</b>
                          <ul className="list-disc list-inside mt-1 indent-6">
                            <li>
                              {DECLARATION_LABELS.promotion[decl.promotion] ||
                                decl.promotion}
                            </li>
                          </ul>
                        </div>
                        {decl.honorific && (
                          <div className="mb-3">
                            <b>Honorific Impact Report:</b>
                            <ul className="list-disc list-inside mt-1 indent-6">
                              <li>{decl.honorific}</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
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
          />
        )}

        {/* Footer */}
        <footer className="text-sm text-gray-400 mt-10">
          <div className="flex gap-2 mt-1"></div>
          <div>Version 2.0.0</div>
        </footer>
      </main>
    </PageContainer>
  );
};

export default Declarations;
