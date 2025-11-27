import { useCallback } from "react";

const ERROR_MESSAGES = {
  REQUIRED: "Please select a submission date.",
  FUTURE_DATE: "Submission date cannot be in the future.",
};

/**
 * Custom hook to handle date validation logic
 */
const useDateValidation = (setValidationErrors) => {
  const clearError = useCallback((field) => {
    setValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, [setValidationErrors]);

  const validateSubmissionDate = useCallback((dateValue, fieldName) => {
    if (!dateValue) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: ERROR_MESSAGES.REQUIRED,
      }));
      return false;
    }

    const submissionDate = new Date(dateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (submissionDate > today) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: ERROR_MESSAGES.FUTURE_DATE,
      }));
      return false;
    }

    clearError(fieldName);
    return true;
  }, [setValidationErrors, clearError]);

  return {
    clearError,
    validateSubmissionDate,
  };
};

export default useDateValidation;
