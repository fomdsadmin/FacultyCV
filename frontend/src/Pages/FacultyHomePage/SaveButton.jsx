import { useState, useEffect } from "react";
import { useApp } from "../../Contexts/AppContext";
import { updateUser, updateUserAffiliations, getUser } from "../../graphql/graphqlHelpers";
import { useFaculty } from "./FacultyContext";
import { useLocation } from "react-router-dom"; // <-- import useLocation
import { useAuditLogger, AUDIT_ACTIONS } from "../../Contexts/AuditLoggerContext";


const SaveButton = ({ affiliationsData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userInfo, getUserInfo, setUserInfo } = useApp();
  const { setPrevUserInfo, change } = useFaculty();
  const location = useLocation(); // <-- get location
  const { logAction } = useAuditLogger();

  useEffect(() => {
    getUserInfo(userInfo.email);
  }, []);

  // Dummy function for affiliations save
  const handleAffiliationsSave = async () => {
    setIsSubmitting(true);
    try {
      await updateUserAffiliations(
        userInfo.user_id,
        userInfo.first_name,
        userInfo.last_name,
        affiliationsData
      );
      alert("Affiliations saved!");

      // Reset change state after successful save
      // if (setPrevUserInfo) {
      //   setPrevUserInfo(JSON.parse(JSON.stringify(userInfo)));
      // }
    } catch (error) {
      console.error("Error updating user affiliations:", error);
      alert("Failed to save affiliations. Please try again.");
    }
    setIsSubmitting(false);
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    setIsSubmitting(true);

    // Create a copy of userInfo and trim values (don't modify the original)
    const trimmedUserInfo = { ...userInfo };
    for (const key in trimmedUserInfo) {
      if (trimmedUserInfo[key] && typeof trimmedUserInfo[key] === "string") {
        trimmedUserInfo[key] = trimmedUserInfo[key].trim();
      }
    }

    // Sanitize bio to prevent GraphQL syntax errors
    const sanitizedBio = sanitizeInput(trimmedUserInfo.bio);

    try {
      const cwlID = trimmedUserInfo.cwl ? trimmedUserInfo.cwl : "";
      const vppID = trimmedUserInfo.vpp ? trimmedUserInfo.vpp : "";
      await updateUser(
        trimmedUserInfo.user_id,
        trimmedUserInfo.first_name,
        trimmedUserInfo.last_name,
        trimmedUserInfo.preferred_name,
        trimmedUserInfo.email,
        trimmedUserInfo.role,
        sanitizedBio, // use sanitized bio here
        trimmedUserInfo.rank,
        trimmedUserInfo.institution,
        trimmedUserInfo.primary_department,
        trimmedUserInfo.secondary_department,
        trimmedUserInfo.primary_faculty,
        trimmedUserInfo.secondary_faculty,
        trimmedUserInfo.primary_affiliation,
        trimmedUserInfo.secondary_affiliation,
        trimmedUserInfo.campus,
        trimmedUserInfo.keywords,
        trimmedUserInfo.institution_user_id,
        trimmedUserInfo.scopus_id,
        trimmedUserInfo.orcid_id,
        cwlID,
        vppID
      );
      
      // Get updated user info and update context
      const updatedUser = await getUser(userInfo.username);
      if (updatedUser) {
        setUserInfo(updatedUser);
        // Update prevUserInfo with the NEW user data, not the old one
        if (setPrevUserInfo) {
          // Use setTimeout to ensure the context update happens after the current render cycle
          setTimeout(() => {
            setPrevUserInfo(JSON.parse(JSON.stringify(updatedUser)));
          }, 0);
        }
      }
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error updating user:", error);
      setIsSubmitting(false);
    }
  };

  function sanitizeInput(input) {
    if (!input) return "";
    return input
      .replace(/\\/g, "\\\\") // escape backslashes
      .replace(/"/g, '\\"') // escape double quotes
      .replace(/\n/g, "\\n"); // escape newlines
  }

  // Decide which save function to call
  const handleClick = async (event) => {
    setIsSubmitting(true);
    if (location.pathname === "/faculty/home/affiliations") {
      handleAffiliationsSave();
      await logAction(AUDIT_ACTIONS.UPDATE_AFFILIATIONS);
    } else {
      handleSubmit(event);
      await logAction(AUDIT_ACTIONS.UPDATE_PROFILE);
    }
  };

  return (
    <button
      type="button"
      className={`btn text-white px-4 py-2 min-h-0 h-10  leading-tight ${
        change ? "btn-success" : "btn-disabled bg-gray-400"
      }`}
      disabled={!change || isSubmitting}
      onClick={change && !isSubmitting ? handleClick : undefined}
    >
      {isSubmitting ? "Saving..." : change ? "Save" : "Saved"}
    </button>
  );
};

export default SaveButton;
