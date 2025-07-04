import { useState, useEffect } from "react";
import { useApp } from "../../Contexts/AppContext";
import { updateUser } from "../../graphql/graphqlHelpers";
import { useFaculty } from "./FacultyContext";
import { use } from "react";
import { useAuditLogger, AUDIT_ACTIONS } from '../../Contexts/AuditLoggerContext.jsx';

const SaveButton = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userInfo, getUserInfo } = useApp();
  const { setPrevUserInfo, change } = useFaculty();

  useEffect(() => {
    getUserInfo(userInfo.email);
  }, []);
    const logAction = useAuditLogger();

  // Handle form submission
  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    setIsSubmitting(true);

    // for all values, if value not null, trim before sending to backend
    for (const key in userInfo) {
      if (userInfo[key] && typeof userInfo[key] === "string") {
        userInfo[key] = userInfo[key].trim();
      }
    }

    // Sanitize bio to prevent GraphQL syntax errors
    const sanitizedBio = sanitizeInput(userInfo.bio);

    try {
      const cwlID = userInfo.cwl ? userInfo.cwl : "";
      const vppID = userInfo.vpp ? userInfo.vpp : "";
      await updateUser(
        userInfo.user_id,
        userInfo.first_name,
        userInfo.last_name,
        userInfo.preferred_name,
        userInfo.email,
        userInfo.role,
        sanitizedBio, // use sanitized bio here
        userInfo.rank,
        userInfo.institution,
        userInfo.primary_department,
        userInfo.secondary_department,
        userInfo.primary_faculty,
        userInfo.secondary_faculty,
        userInfo.primary_affiliation,
        userInfo.secondary_affiliation,
        userInfo.campus,
        userInfo.keywords,
        userInfo.institution_user_id,
        userInfo.scopus_id,
        userInfo.orcid_id,
        cwlID,
        vppID
      );
      getUserInfo(userInfo.email);
      setIsSubmitting(false);

      if (setPrevUserInfo) {
        setPrevUserInfo(JSON.parse(JSON.stringify(userInfo)));
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setIsSubmitting(false);
    }
  };

  function sanitizeInput(input) {
    if (!input) return "";
    return input
      .replace(/\\/g, "\\\\")   // escape backslashes
      .replace(/"/g, '\\"')     // escape double quotes
      .replace(/\n/g, "\\n");   // escape newlines
  }

  return (
    <button
      type="button"
      className={`btn text-white py-1 px-2 w-1/5 min-h-0 h-8 leading-tight ${
        change ? "btn-success" : "btn-disabled bg-gray-400"
      }`}
      disabled={!change || isSubmitting}
      onClick={change && !isSubmitting ? handleSubmit : undefined}
    >
      {isSubmitting ? "Saving..." : change ? "Save" : "Saved"}
    </button>
  );
};

export default SaveButton;
