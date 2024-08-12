import React, { useState, useEffect, useRef } from "react";

const authors = [
  {
    last_name: "Hayden",
    first_name: "Michael R.",
    current_affiliation: "BC Children's Hospital Research Institute",
    name_variants: ["Michael R. Hayden", "Michael Hayden"],
    subjects: ["Genetics", "Pediatrics"],
    scopus_id: "55765887300",
    orcid: "0000-0001-5159-1419",
  },
  {
    last_name: "Hayden",
    first_name: "Michael E.",
    current_affiliation: "Simon Fraser University",
    name_variants: ["Michael E. Hayden", "Michael Hayden"],
    subjects: ["Physics", "Materials Science"],
    scopus_id: "120",
    orcid: "0000-0001-5159-1419",
  },
  {
    last_name: "Hayden",
    first_name: "Michael R.",
    current_affiliation: "The University of British Columbia",
    name_variants: ["Michael R. Hayden", "Michael Hayden"],
    subjects: ["Neurology", "Biochemistry"],
    scopus_id: "57222035992",
    orcid: "0000-0001-5159-1419",
  },
  {
    last_name: "no scopus",
    first_name: "Michael E.",
    current_affiliation: "Simon Fraser University",
    name_variants: ["Michael E. Hayden", "Michael Hayden"],
    subjects: ["Physics", "Materials Science"],
    scopus_id: "",
    orcid: "0000-0001-5159-1419",
  },
  {
    last_name: "no orcid",
    first_name: "Michael R.",
    current_affiliation: "The University of British Columbia",
    name_variants: ["Michael R. Hayden", "Michael Hayden"],
    subjects: ["Neurology", "Biochemistry"],
    scopus_id: "57222035992",
    orcid: "",
  },
];

const ProfileLinkModal = ({ setClose, setOrcidId, setScopusId, orcidId, scopusId, onLink }) => {
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [manualScopusId, setManualScopusId] = useState(() => {
    if (Array.isArray(scopusId)) return scopusId;
    if (scopusId) return scopusId.split(",");
    return [];
  });
  const [manualOrcidId, setManualOrcidId] = useState(orcidId);
  const [reviewed, setReviewed] = useState(false);
  const [linkedScopusIds, setLinkedScopusIds] = useState(manualScopusId);

  const scopusInputRef = useRef(null);
  const orcidInputRef = useRef(null);

  useEffect(() => {
    if (scopusId || orcidId) {
      setReviewed(true);
    }
  }, [scopusId, orcidId]);

  const handleLinkClick = (author) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setManualOrcidId(author.orcid || "");
      
      const newScopusId = author.scopus_id ? author.scopus_id.split(",") : [];
      const updatedScopusIds = [...new Set([...linkedScopusIds, ...newScopusId])];
      
      setLinkedScopusIds(updatedScopusIds);
      setScopusId(updatedScopusIds.join(","));
      setOrcidId(author.orcid || "");
      setReviewed(true);
      onLink(updatedScopusIds.join(","), author.orcid || "");
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
    setManualScopusId([]);
    setLinkedScopusIds([]);
    setReviewed(false);
    onLink("", "");
  };

  const handleSaveManualEntry = () => {
    setScopusId(linkedScopusIds.join(","));
    setOrcidId(manualOrcidId);
    setIsManual(false);
    setReviewed(true);
    onLink(linkedScopusIds.join(","), manualOrcidId);
  };

  const handleScopusBlur = () => {
    const newScopusIds = scopusInputRef.current.value.split(",");
    setLinkedScopusIds(newScopusIds);
    setScopusId(newScopusIds.join(","));
    setUpdateStatus("Updating...");
    setTimeout(() => {
      setOrcidId(manualOrcidId);
      setReviewed(true);
      setUpdateStatus("Linked");
      onLink(newScopusIds.join(","), manualOrcidId);
    }, 700);
  };

  const handleOrcidBlur = () => {
    const newOrcidId = orcidInputRef.current.value;
    setManualOrcidId(newOrcidId);
    setOrcidId(newOrcidId);
    setUpdateStatus("Updating...");
    setTimeout(() => {
      setScopusId(linkedScopusIds.join(","));
      setReviewed(true);
      setUpdateStatus("Linked");
      onLink(linkedScopusIds.join(","), newOrcidId);
    }, 700);
  };

  const handleAddScopusId = () => {
    setLinkedScopusIds([...linkedScopusIds, ""]);
  };

  const handleScopusIdChange = (index, value) => {
    const newScopusIds = [...linkedScopusIds];
    newScopusIds[index] = value;
    setLinkedScopusIds(newScopusIds);
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
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-2xl">Linked Profile</h2>
              <button onClick={() => setReviewed(false)} className="btn btn-sm btn-secondary text-white mr-6">
                Link Another Scopus ID
              </button>
            </div>
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
                <span className="label-text-alt">Scopus ID(s)</span>
              </div>
              {linkedScopusIds.map((id, index) => (
                <div key={index} className="flex items-center mt-2">
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => handleScopusIdChange(index, e.target.value)}
                    className="input input-sm input-bordered w-full max-w-xs mr-2"
                  />
                </div>
              ))}
              <button type="button" onClick={handleAddScopusId} className="btn btn-sm btn-secondary text-white mt-2">
                Add Scopus ID
              </button>
            </label>

            <label className="form-control w-full max-w-xs mt-4">
              <div className="label">
                <span className="label-text-alt">Orcid ID</span>
              </div>
              <input
                type="text"
                value={manualOrcidId}
                onChange={(e) => setManualOrcidId(e.target.value)}
                ref={orcidInputRef}
                className="input input-sm input-bordered w-full max-w-xs"
                onBlur={handleOrcidBlur}
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

            <div className="flex justify-between">

            <div className="flex flex-1 flex-col">
              <p className="font-bold">Scopus Author ID(s):</p>
              {linkedScopusIds.length > 0 ? (
                linkedScopusIds.map((id, index) => (
                  <a
                    key={index}
                    href={`https://www.scopus.com/authid/detail.uri?authorId=${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-accent text-white my-1 mr-8"
                  >
                   {id}
                  </a>
                ))
              ) : (
                <input
                  type="text"
                  defaultValue={linkedScopusIds.join(",")}
                  ref={scopusInputRef}
                  className="ml-1 input input-bordered input-xs w-full max-w-32"
                  onBlur={handleScopusBlur}
                />
              )}
            </div>

            <div className="flex flex-col flex-1">
              <p className="font-bold">Orcid ID:</p>
              {orcidId ? (
                  <a
                    href={`https://orcid.org/${orcidId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-accent text-white my-1 mr-8"
                  >
                    {orcidId}
                  </a>
                ) : (
                <input
                  type="text"
                  defaultValue={manualOrcidId}
                  ref={orcidInputRef}
                  className="ml-1 input input-bordered input-xs w-full max-w-32"
                  onBlur={handleOrcidBlur}
                />
              )}
            </div>

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
