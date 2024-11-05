import React, { useState, useEffect, useRef } from "react";
import { getElsevierAuthorMatches, getOrcidAuthorMatches } from "../graphql/graphqlHelpers";

const ProfileLinkModal = ({ user, activeModal, setClose, setOrcidId, setScopusId, institution }) => {
  const [loading, setLoading] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [institutionError, setInstitutionError] = useState(false);
  const [manualScopusId, setManualScopusId] = useState('');
  const [manualOrcidId, setManualOrcidId] = useState(['', '', '', '']); 
  const orcidRefs = [useRef(), useRef(), useRef(), useRef()]; 

  useEffect(() => {
    if (activeModal !== 'ManualScopus' && activeModal !== 'ManualOrcid') {
      fetchAuthorMatches();
    }
  }, [activeModal]);

  const fetchAuthorMatches = async () => {
    if (!institution) {
      setInstitutionError(true);
      return;
    }
    setLoading(true);
    let formattedElsevierMatches = [];
    let formattedOrcidMatches = [];

    try {
      const elsevierMatches = await getElsevierAuthorMatches(user.first_name, user.last_name, institution);
      formattedElsevierMatches = elsevierMatches.map(match => ({
        last_name: match.last_name || '',
        first_name: match.first_name || '',
        current_affiliation: match.current_affiliation || '',
        name_variants: match.name_variants || '',
        subjects: match.subjects || '',
        scopus_id: match.scopus_id || '',
        orcid: match.orcid ? match.orcid.replace(/[\[\]]/g, '') : ''
      }));
    } catch (error) {
      console.error("Error fetching elsevier matches:", error);
    }

    try {
      const orcidMatches = await getOrcidAuthorMatches(user.first_name, user.last_name, institution);
      formattedOrcidMatches = orcidMatches.map(match => ({
        last_name: match.last_name || '',
        first_name: match.first_name || '',
        current_affiliation: match.current_affiliation || '',
        name_variants: match.name_variants || '',
        subjects: match.keywords ? match.keywords.replace(/[\[\]]/g, '') : [],
        scopus_id: '',
        orcid: match.orcid_id || ''
      }));
    } catch (error) {
      console.error("Error fetching orcid matches:", error);
    }

    const authors = [...formattedElsevierMatches, ...formattedOrcidMatches];
    setAuthors(authors);
    setLoading(false);
  };

  const handleAuthorLink = (scopusIdToAdd, orcidIdToAdd) => {
    if (activeModal === 'Scopus') {
      setScopusId(scopusIdToAdd);
    } else {
      setOrcidId(orcidIdToAdd);
    }
    setClose();
  };

  const handleManualScopusLink = () => {
    setScopusId(manualScopusId);
    setClose();
  };

  const handleManualOrcidLink = () => {
    const fullOrcid = manualOrcidId.join('-');
    setOrcidId(fullOrcid);
    setClose();
  };

  const handleOrcidInputChange = (index, value) => {
    if (value.length <= 4) {
      const newOrcid = [...manualOrcidId];
      newOrcid[index] = value;
      setManualOrcidId(newOrcid);

      // Move to the next input if 4 characters are entered
      if (value.length === 4 && index < orcidRefs.length - 1) {
        orcidRefs[index + 1].current.focus();
      }
    }
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

        {activeModal === 'ManualScopus' ? (
          <div className="manual-scopus-section">
            <h2 className="font-bold text-2xl">Enter Scopus ID Manually</h2>
            <input
              type="text"
              value={manualScopusId}
              onChange={(e) => setManualScopusId(e.target.value)}
              className="input input-bordered w-full mt-2"
              placeholder="Enter Scopus ID"
            />
            <button
              onClick={handleManualScopusLink}
              className="btn btn-primary text-white mt-4"
              disabled={!manualScopusId}
            >
              Add Scopus ID
            </button>
          </div>
        ) : activeModal === 'ManualOrcid' ? (
          <div className="manual-orcid-section">
            <h2 className="font-bold text-2xl">Enter ORCID ID Manually</h2>
            <div className="flex space-x-2 mt-2">
              {manualOrcidId.map((segment, index) => (
                <React.Fragment key={index}>
                <input
                  ref={orcidRefs[index]}
                  type="text"
                  value={segment}
                  onChange={(e) => handleOrcidInputChange(index, e.target.value)}
                  className="input input-bordered w-1/5 text-center"
                  placeholder="____"
                  maxLength={4}
                />
                {index < manualOrcidId.length - 1 && <span className="mx-1">-</span>}
              </React.Fragment>
              ))}
            </div>
            <button
              onClick={handleManualOrcidLink}
              className="btn btn-primary text-white mt-4"
              disabled={manualOrcidId.some(segment => segment.length !== 4)}
            >
              Add ORCID ID
            </button>
          </div>
        ) : institutionError ? (
          <div className="text-center mt-4">
            <p className="text-lg text-red-500">Please select and save an Institution for your profile</p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="font-bold text-2xl">Potential Matches</h2>
              <div className="border-t my-2"></div>
            </div>

            {loading && (
              <div className="text-center mt-4">
                <p className="text-lg font-bold">Loading...</p>
              </div>
            )}

            {!loading && authors.length === 0 && (
              <div className="text-center mt-4">
                <p className="text-lg text-gray-500">No matches found</p>
              </div>
            )}

            {!loading && authors.map((author, index) => (
              <div
                key={index}
                className="py-2 shadow-glow p-2 my-6 rounded-lg flex items-center justify-between"
              >
                <div className="ml-4">
                  <p className="font-bold">
                    {author.first_name} {author.last_name}
                  </p>
                  <p className="text-sm">{author.current_affiliation}</p>
                  <p className="text-sm">{author.subjects}</p>
                  <p className="text-sm">Scopus ID: {author.scopus_id || 'Not found'}</p>
                  <p className="text-sm">Orcid ID: {author.orcid || 'Not found'}</p>
                </div>
                <div>
                  <button
                    className="btn btn-primary text-white btn-sm"
                    onClick={() => handleAuthorLink(author.scopus_id, author.orcid)}
                    disabled={!author.scopus_id && !author.orcid}
                  >
                    Link
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </dialog>
  );
};

export default ProfileLinkModal;



















