import React from "react";
import { FaPlusCircle, FaTimesCircle } from "react-icons/fa";

const SecureFundingEntry = ({ secureFundingData, onSelect, selected }) => {
  const handleToggle = () => {
    onSelect(secureFundingData, !selected);
  };

  return (
    <div className="min-h-8 shadow-glow mx-auto w-full px-4 py-2 flex flex-col justify-between shadow-lg bg-white-50 rounded-xl mb-4">
      <div className="relative flex justify-between items-center w-full">
        <button className="btn btn-xs btn-circle btn-ghost absolute top-0 right-0" onClick={handleToggle}>
          {selected ? (
            <FaTimesCircle className="h-6 w-6 text-red-500" />
          ) : (
            <FaPlusCircle className="h-6 w-6 text-green-500" />
          )}
        </button>
      </div>
      <div className="w-full justify-between items-center mt-1">
        <span className="font-bold text-sm break-words">
          {secureFundingData.first_name} {secureFundingData.last_name}
        </span>
        <span className="text-sm font-bold text-right">
          {secureFundingData.dates ? ` | ${secureFundingData.dates}` : ""}
        </span>
        <p className="text-sm break-words">{secureFundingData.title}</p>
        {secureFundingData.agency && secureFundingData.agency.toLowerCase() === "rise" ? (
          <p className="text-sm break-words">
            <b>Agency:</b> {secureFundingData.sponsor}{" "}
          </p>
        ) : (
          <p className="text-sm break-words">
            <b>Agency:</b> {secureFundingData.agency}
          </p>
        )}
        <p className="text-sm break-words">
          <b>Amount: </b> ${secureFundingData.amount}
        </p>
        {secureFundingData.program && secureFundingData.program.trim() !== "" && (
          <p className="text-sm break-words">
            <b>Program: </b> {secureFundingData.program}
          </p>
        )}
        {secureFundingData.department && secureFundingData.department.trim() !== "" && (
          <p className="text-sm break-words">
            <b>Department: </b> {secureFundingData.department}
          </p>
        )}
      </div>
    </div>
  );
};

export default SecureFundingEntry;
