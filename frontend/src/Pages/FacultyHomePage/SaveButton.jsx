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


  // Dummy function for affiliations save
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
      await updateUser(
        trimmedUserInfo.user_id || "",
        trimmedUserInfo.first_name || "",
        trimmedUserInfo.last_name || "",
        trimmedUserInfo.preferred_name || "",
        trimmedUserInfo.email || "",
        trimmedUserInfo.role || "",
        sanitizedBio, // use sanitized bio here
        trimmedUserInfo.institution || "",
        trimmedUserInfo.primary_department || "",
        trimmedUserInfo.primary_faculty || "",
        trimmedUserInfo.campus || "",
        trimmedUserInfo.keywords || "",
        trimmedUserInfo.institution_user_id || "",
        trimmedUserInfo.scopus_id || "",
        trimmedUserInfo.orcid_id || ""
      );

      // Get updated user info and update context
      const updatedUser = await getUser(userInfo.cwl_username);
      if (updatedUser) {
        setUserInfo(updatedUser);
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
    handleSubmit(event);
    await logAction(AUDIT_ACTIONS.UPDATE_PROFILE);
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
