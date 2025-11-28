import React from "react";

const ValidationError = ({ error, className = "text-red-500 text-sm mt-1" }) => {
  if (!error) return null;
  
  return (
    <div className={className}>
      {error}
    </div>
  );
};

export default ValidationError;
