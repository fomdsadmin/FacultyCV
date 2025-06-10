import React, { useState, useEffect } from "react";
import { FaRegEdit } from "react-icons/fa";
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

const removeCommasIfNeeded = (key, value) => {
  if (
    key.toLowerCase().includes("dates") ||
    key.toLowerCase().includes("year")
  ) {
    return value.replace(/,/g, "");
  }
  return value;
};

const InvitedPresentationEntry = ({
  isArchived,
  onEdit,
  onArchive,
  onRestore,
  field1,
  field2,
  data_details,
}) => {
  const [attributes, setAttributes] = useState([]);
  const [updatedField1, setUpdatedField1] = useState(field1);
  const [updatedField2, setUpdatedField2] = useState(field2);

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
          key !== "tutorials_(per_year)" &&
          key !== "author_ids"
      )
      .map(([key, value]) => {
        const newValue = removeCommasIfNeeded(key, String(value));
        return `${capitalizeWords(key)}: ${addSpaceAfterComma(newValue)}`;
      })
      .sort((a, b) => a.localeCompare(b));

    let tempField1 = field1;
    let tempField2 = field2;
    Object.entries(data_details).forEach(([key, value]) => {
      if (
        value === field1 &&
        (key.toLowerCase().includes("dates") ||
          key.toLowerCase().includes("year"))
      ) {
        tempField1 = field1.replace(/,/g, "");
      }
      if (
        value === field2 &&
        (key.toLowerCase().includes("dates") ||
          key.toLowerCase().includes("year"))
      ) {
        tempField2 = field2.replace(/,/g, "");
      }
    });

    setUpdatedField1(tempField1);
    setUpdatedField2(tempField2);
    setAttributes(newAttributes);
  }, [data_details, field1, field2]);

  return (
    <div className="min-h-8 shadow-glow mx-4 mt-2 px-4 py-4 flex items-center bg-white rounded-lg">
      <div className="flex-1 max-w-full">
        {/* Date Range Line */}
        {(data_details.start_month ||
          data_details.start_year ||
          data_details.end_month ||
          data_details.end_year) && (
          <h1 className="text-gray-800 font-bold break-words">
            {data_details.start_month}
            {data_details.start_month && data_details.start_year ? " " : ""}
            {data_details.start_year}
            {" – "}
            {data_details.end_month === "Current" &&
            data_details.end_year === "Current" ? (
              "Current"
            ) : data_details.end_month === "None" &&
              data_details.end_year === "None" ? (
              "None"
            ) : (
              <>
                {data_details.end_month}
                {data_details.end_month && data_details.end_year ? " " : ""}
                {data_details.end_year}
              </>
            )}
          </h1>
        )}

        {/* Details Field */}
        {data_details.details && (
          <p className="text-gray-600 break-words text-sm">
            <span className="font-semibold">Details:</span>{" "}
            {truncateText(data_details.details, MAX_CHAR_LENGTH)}
          </p>
        )}

        {/* Type Field */}
        {"type" in data_details && data_details.type && (
          <p className="text-gray-600 break-words text-sm">
            <span className="font-semibold">Type:</span>{" "}
            {capitalizeWords(data_details.type)}
          </p>
        )}

        {/* Show "Other" dropdown if type is "other" */}
        {data_details.type === "Other" && data_details.other && (
          <div className="">
            <ul className="list-disc pl-11 text-gray-600 text-sm">
              <li>{data_details.other}</li>
            </ul>
          </div>
        )}

        {/* Other Attributes */}
        {Object.entries(data_details)
          .filter(([key]) =>
            [
              "start_month",
              "start_year",
              "end_month",
              "end_year",
              "details",
              "highlight",
              "note",
              "type", // Exclude "type" from generic attributes
              "other", // Exclude "other" from generic attributes
            ].includes(key)
              ? false
              : true
          )
          .map(([key, value], index) =>
            value ? (
              <p key={index} className="text-gray-600 break-words text-sm">
                <span className="font-semibold">{capitalizeWords(key)}:</span>{" "}
                {truncateText(String(value), MAX_CHAR_LENGTH)}
              </p>
            ) : null
          )}

        {/* Note Field with Highlight */}
        {data_details.note && (
          <div
            className={
              data_details.highlight === "true"
                ? "my-1 p-1 text-sm rounded bg-blue-50 border-l-4 border-blue-300 text-zinc-900 font-medium"
                : "my-1 p-1 text-sm rounded bg-gray-100 border-l-4 border-gray-400 text-gray-900 font-medium"
            }
          >
            {data_details.highlight === "true" ? (
              <>
                <span className="font-semibold text-sm">Note:</span>{" "}
                {truncateText(data_details.note, MAX_CHAR_LENGTH)}
              </>
            ) : (
              <>
                <span className="text-gray-600 font-semibold text-sm">
                  Note:
                </span>{" "}
                <span className="break-words text-gray-600 text-sm">
                  {truncateText(data_details.note, MAX_CHAR_LENGTH)}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1">
        {!isArchived && (
          <>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={() => onEdit()}
            >
              <FaRegEdit className="h-5 w-5" />
            </button>
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

export default InvitedPresentationEntry;
