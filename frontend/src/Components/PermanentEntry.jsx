import React, { useState, useEffect } from "react";
import { FaEye } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { LuUndo2 } from "react-icons/lu";

const MAX_CHAR_LENGTH = 220;

const truncateText = (text, maxLength) => {
  if (text.length > maxLength) {
    return `${text.substring(0, maxLength)}...`;
  }
  return text;
};

const capitalizeWords = (string) => {
  return string
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const addSpaceAfterComma = (string) => {
  return string.replace(/,/g, ", ");
};

const agencyColorMap = {
  cihr: "bg-blue-500 text-white",
  nserc: "bg-green-500 text-white",
  sshrc: "bg-yellow-500 text-black",
  cfi: "bg-purple-500 text-white",
  default: "bg-gray-400 text-white",
};

const PermanentEntry = ({
  isArchived,
  onEdit,
  onArchive,
  onRestore,
  field1,
  field2,
  data_details,
}) => {
  const [attributes, setAttributes] = useState([]);

  // Get agency and check if it's not "rise"
  const agency = data_details.agency ? data_details.agency.trim() : "";
  const isRise = agency.toLowerCase() === "rise";
  const agencyKey = agency.toLowerCase();

  useEffect(() => {
    const newAttributes = Object.entries(data_details)
      .filter(
        ([key, value]) =>
          value &&
          value !== field1 &&
          value !== field2 &&
          !(Array.isArray(value) && value.length === 0) &&
          key !== "author_ids" &&
          key !== "class_size_(per_year)" &&
          key !== "labs_(per_year)" &&
          key !== "lectures_(per_year)" &&
          key !== "other_(per_year)" &&
          key !== "scheduled_hours" &&
          key !== "tutorials_(per_year)"
        // <-- do NOT filter out "agency" here
      )
      .map(
        ([key, value]) =>
          `${capitalizeWords(key)}: ${addSpaceAfterComma(String(value))}`
      )
      .sort((a, b) => a.localeCompare(b));
    setAttributes(newAttributes);
  }, [data_details, field1, field2, isRise]);

  return (
    <div className="min-h-8 shadow-glow mx-4 my-2 px-4 py-4 flex items-center bg-white rounded-lg relative">
      {/* Agency label at top right if not rise */}
      {!isRise && agency && (
        <span
          className={`absolute top-4 right-4 px-4 py-2 rounded-full text-xs font-semibold shadow ${
            agencyColorMap[agencyKey] || agencyColorMap.default
          }`}
          style={{ zIndex: 10 }}
        >
          {agency}
        </span>
      )}
      <div className="flex-1 max-w-full pr-32">
        {field1 && (
          <h1 className="text-gray-800 font-bold break-words">
            {truncateText(field1, MAX_CHAR_LENGTH)}
          </h1>
        )}
        {field2 && (
          <h2 className="text-gray-600 break-words">
            {truncateText(field2, MAX_CHAR_LENGTH)}
          </h2>
        )}
        {attributes.map((attribute, index) => {
          // Split "Label: Value"
          const [label, ...rest] = attribute.split(": ");
          const value = rest.join(": ");
          const isAmount = label.trim().toLowerCase() === "amount";
          const isAgency = label.trim().toLowerCase() === "agency";
          // Only show agency in details if not rise
          if (isAgency && isRise) return null;
          return (
            <p key={index} className="text-gray-600 break-words text-sm">
              <span className="font-bold">{label}:</span>{" "}
              {isAmount ? (
                <span>${truncateText(value, MAX_CHAR_LENGTH)}</span>
              ) : (
                truncateText(value, MAX_CHAR_LENGTH)
              )}
            </p>
          );
        })}
      </div>

      <div className="flex items-center space-x-1">
        {!isArchived && (
          <>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={() => onArchive()}
            >
              <IoClose className="h-5 w-5" />
            </button>
          </>
        )}

        {isArchived && (
          <button
            className="btn btn-xs btn-circle btn-ghost"
            onClick={onRestore}
          >
            <LuUndo2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PermanentEntry;
