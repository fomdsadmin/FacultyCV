import React, { useState, useEffect } from "react";
import { getElsevierAuthorMatches, getOrcidAuthorMatches } from "../graphql/graphqlHelpers";

const ProfileLinkModal = ({ user, activeModal, setClose, setOrcidId, setScopusId, institution }) => {
  const [loading, setLoading] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [institutionError, setInstitutionError] = useState(false);

  useEffect(() => {
    fetchAuthorMatches();
  }, []);

  const fetchAuthorMatches = async () => {
    if (!institution) {
      setInstitutionError(true);
      return;
    }
    setLoading(true);
    let formattedElsevierMatches = [];
    let formattedOrcidMatches = [];

    try {
      const elsevierMatches = await getElsevierAuthorMatches('Michael', 'Hayden', institution);
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

        {institutionError ? (
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
