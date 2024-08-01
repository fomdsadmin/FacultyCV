import React, { useState } from "react";

const authors = [
  {
    last_name: "Hayden",
    first_name: "Michael R.",
    current_affiliation: "BC Children's Hospital Research Institute",
    name_variants: ["Michael R. Hayden", "Michael Hayden"],
    subjects: ["Genetics", "Pediatrics"],
    scopus_id: "893",
    orcid: "0000-0001-2345-6789",
  },
  {
    last_name: "Hayden",
    first_name: "Michael E.",
    current_affiliation: "Simon Fraser University",
    name_variants: ["Michael E. Hayden", "Michael Hayden"],
    subjects: ["Physics", "Materials Science"],
    scopus_id: "120",
    orcid: "0000-0002-3456-7890",
  },
  {
    last_name: "Hayden",
    first_name: "Michael R.",
    current_affiliation: "The University of British Columbia",
    name_variants: ["Michael R. Hayden", "Michael Hayden"],
    subjects: ["Neurology", "Biochemistry"],
    scopus_id: "1",
    orcid: "0000-0003-4567-8901",
  },
  {
    last_name: "Test",
    first_name: "No Ids",
    current_affiliation: "The University of British Columbia",
    name_variants: ["Michael R. Hayden", "Michael Hayden"],
    subjects: ["Neurology", "Biochemistry"],
    scopus_id: null,
    orcid: null,
  },
  {
    last_name: "Test",
    first_name: "No Scopus",
    current_affiliation: "The University of British Columbia",
    name_variants: ["Michael R. Hayden", "Michael Hayden"],
    subjects: ["Neurology", "Biochemistry"],
    scopus_id: null,
    orcid: "012345",
  },
  {
    last_name: "Test",
    first_name: "No Orcid",
    current_affiliation: "The University of British Columbia",
    name_variants: ["Michael R. Hayden", "Michael Hayden"],
    subjects: ["Neurology", "Biochemistry"],
    scopus_id: "012345",
    orcid: null,
  },
];

const ProfileLinkModal = ({ setClose, setOrcidId, setScopusId, orcidId, scopusId, onLink }) => {
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [manualScopusId, setManualScopusId] = useState(scopusId);
  const [manualOrcidId, setManualOrcidId] = useState(orcidId);
  const [reviewed, setReviewed] = useState(false);

  const handleLinkClick = (author) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setManualOrcidId(author.orcid || "");
      setManualScopusId(author.scopus_id || "");
      setScopusId(author.scopus_id || "");
      setOrcidId(author.orcid || "");
      setReviewed(true);
      onLink(author.scopus_id || "", author.orcid || "");
    }, 700);
  };

  const handleIsManual = () => {
    setIsManual(!isManual);
  };

  const handleUnlink = () => {
    setIsHovered(false);
    setScopusId("");
    setOrcidId("");
    setManualOrcidId("");
    setManualScopusId("");
    setReviewed(false);
    onLink("", "");
  };

  const handleSaveManualEntry = () => {
    setScopusId(manualScopusId);
    setOrcidId(manualOrcidId);
    setReviewed(true);
    setIsManual(false);
    onLink(manualScopusId, manualOrcidId);
  };

  const handleBlur = () => {
    setUpdateStatus("Updating...");
    setTimeout(() => {
      setScopusId(manualScopusId);
      setOrcidId(manualOrcidId);
      setReviewed(true);
      setUpdateStatus("Linked");
      onLink(manualScopusId, manualOrcidId);
    }, 700);
  };

  return (
    <dialog className="modal-dialog" open>
      <div className="max-h-80">
        <form method="dialog">
          <button
            onClick={setClose}
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          >
            ✕
          </button>
        </form>
        {!reviewed && !loading && (
          <div>
            <div className="flex justify-between">
              <h2 className="font-bold text-2xl">{isManual ? "Enter Identifications" : "Potential Matches"}</h2>
              <button onClick={handleIsManual} className="btn btn-sm btn-accent text-white mr-6">
                {isManual ? "Cancel" : "Manual Entry"}
              </button>
            </div>
            <div className="border-t my-2"></div>
          </div>
        )}

        {reviewed && (
          <div>
            <h2 className="font-bold text-2xl">Linked Profile</h2>
            <div className="border-t my-2"></div>
          </div>
        )}

        {!reviewed && !loading && !isManual && authors.map((author, index) => (
          <div
            key={index}
            className="py-2 shadow-glow p-2 my-6 rounded-lg flex items-center justify-between"
          >
            <div className="ml-4">
              <p className="font-bold">
                {author.first_name} {author.last_name}
              </p>
              <p className="text-sm">{author.current_affiliation}</p>
              <p className="text-sm">{author.subjects.join(", ")}</p>
            </div>
            <div>
              <button
                onClick={() => handleLinkClick(author)}
                className="btn btn-sm btn-primary text-white mr-4"
              >
                Link
              </button>
            </div>
          </div>
        ))}

        {!reviewed && !loading && !isManual && (<div className="h-2" />)}

        {isManual && (
          <form>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text-alt">Scopus ID</span>
              </div>
              <input
                type="text"
                value={manualScopusId}
                onChange={(e) => setManualScopusId(e.target.value)}
                className="input input-sm input-bordered w-full max-w-xs"
              />
            </label>

            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text-alt">Orcid ID</span>
              </div>
              <input
                type="text"
                value={manualOrcidId}
                onChange={(e) => setManualOrcidId(e.target.value)}
                className="input input-sm input-bordered w-full max-w-xs"
              />
            </label>

            <div className="mt-4">
              <button type="button" onClick={handleSaveManualEntry} className="btn btn-sm btn-success text-white">
                Save
              </button>
            </div>
          </form>
        )}

        {loading && (
          <div className="text-center mt-4">
            <p className="text-lg font-bold">Loading...</p>
          </div>
        )}
        {reviewed && !loading && (
          <div className="mt-4">
            <div className="flex">
              <p>Scopus ID:</p>
              {scopusId ? (
                <p className="ml-1">{scopusId}</p>
              ) : (
                <input
                  type="text"
                  value={manualScopusId}
                  onChange={(e) => setManualScopusId(e.target.value)}
                  className="ml-1 input input-bordered input-xs w-full max-w-32"
                  onBlur={handleBlur}
                />
              )}
            </div>

            <div className="flex">
              <p>Orcid ID:</p>
              {orcidId ? (
                <p className="ml-1">{orcidId}</p>
              ) : (
                <input
                  type="text"
                  value={manualOrcidId}
                  onChange={(e) => setManualOrcidId(e.target.value)}
                  className="ml-1 input input-bordered input-xs w-full max-w-32"
                  onBlur={handleBlur}
                />
              )}
            </div>

            <div
              className="inline-block mt-2 text-green-600 font-semibold"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isHovered ? (
                <button onClick={handleUnlink} className="text-red-600">
                  Unlink
                </button>
              ) : (
                <span>{updateStatus || "Linked"}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
};

export default ProfileLinkModal;
