"use client";

import { useState, useEffect } from "react";
import { getOrcidAuthorMatches, updateUser } from "../../../../../graphql/graphqlHelpers";
import { useApp } from "../../../../../Contexts/AppContext";
import ModalStylingWrapper from "../../../../../SharedComponents/ModalStylingWrapper";

// Accept user, isAdmin, and onUpdateUser props
const AddOrcidModal = ({ isOpen, onClose, user, setUser, isAdmin, onUpdateUser }) => {
  const { userInfo, setUserInfo } = useApp();
  const [loading, setLoading] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [institutionError, setInstitutionError] = useState(false);

  // Use correct user object based on isAdmin
  const currentUser = isAdmin ? user : userInfo;

  useEffect(() => {
    if (isOpen) {
      fetchAuthorMatches();
    }
  }, [isOpen]);

  const fetchAuthorMatches = async () => {
    if (!currentUser.institution) {
      setInstitutionError(true);
      return;
    }
    setLoading(true);
    let formattedOrcidMatches = [];

    try {
      const orcidMatches = await getOrcidAuthorMatches(
        currentUser.first_name,
        currentUser.last_name,
        currentUser.institution
      );
      formattedOrcidMatches = orcidMatches.map((match) => ({
        last_name: match.last_name || "",
        first_name: match.first_name || "",
        current_affiliation: match.current_affiliation || "",
        name_variants: match.name_variants || "",
        subjects: match.keywords ? match.keywords.replace(/[\[\]]/g, "") : [],
        orcid: match.orcid_id || "",
      }));
    } catch (error) {
      console.error("Error fetching orcid matches:", error);
    }

    setAuthors(formattedOrcidMatches);
    setLoading(false);
  };

  const handleOrcidLink = async (orcidId) => {
    if (!orcidId) return;

    if (isAdmin) {
      function sanitizeInput(input) {
        if (!input) return "";
        return input
          .replace(/\\/g, "\\\\") // escape backslashes
          .replace(/"/g, '\\"') // escape double quotes
          .replace(/\n/g, "\\n"); // escape newlines
      }
      try {
        const updatedUser = await updateUser(
          currentUser.user_id,
          currentUser.first_name,
          currentUser.last_name,
          currentUser.preferred_name,
          currentUser.email,
          currentUser.role,
          sanitizeInput(userInfo.bio),
          currentUser.institution,
          currentUser.primary_department,
          currentUser.primary_faculty,
          currentUser.campus,
          currentUser.keywords,
          currentUser.institution_user_id,
          currentUser.scopus_id,
          orcidId
        );
        console.log("ORCID ID saved successfully:");
        window.location.reload();
      } catch (error) {
        console.error("Error saving ORCID ID:", error);
      }
    } else {
      setUserInfo((prev) => ({
        ...prev,
        orcid_id: orcidId,
      }));
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalStylingWrapper>
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-2xl">Find ORCID Profile</h2>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            ✕
          </button>
        </div>

        {institutionError ? (
          <div className="text-center mt-4">
            <p className="text-lg text-red-500">Please select and save an Institution for your profile</p>
          </div>
        ) : loading ? (
          <div className="text-center mt-4">
            <p className="text-lg font-bold">Loading...</p>
          </div>
        ) : authors.length === 0 ? (
          <div className="text-center mt-4">
            <p className="text-lg text-gray-500">No matches found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {authors.map((author, index) => (
              <div key={index} className="py-2 shadow-glow p-2 rounded-lg flex items-center justify-between">
                <div className="ml-4">
                  <p className="font-bold">
                    {author.first_name} {author.last_name}
                  </p>
                  <p className="text-sm">{author.current_affiliation}</p>
                  <p className="text-sm">{author.subjects}</p>
                  <p className="text-sm">ORCID ID: {author.orcid || "Not found"}</p>
                </div>
                <div>
                  <button
                    className="btn btn-primary text-white btn-sm ml-4"
                    onClick={() => handleOrcidLink(author.orcid)}
                    disabled={!author.orcid}
                  >
                    Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalStylingWrapper>
  );
};

export default AddOrcidModal;
