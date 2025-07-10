import React, { useState, useEffect } from "react";
import { FaRegEdit } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { LuUndo2 } from "react-icons/lu";
import "./GenericEntry.css";

const MAX_CHAR_LENGTH = 250;

const truncateText = (text, maxLength) => {
  if (text.length > maxLength) {
    return `${text.substring(0, maxLength)}...`;
  }
  return text;
};

const truncateHtml = (html, maxLength) => {
  // Strip HTML tags for length calculation
  const textOnly = html.replace(/<[^>]*>/g, '');
  if (textOnly.length <= maxLength) {
    return html;
  }
  
  // Truncate the text and add ellipsis
  const truncatedText = textOnly.substring(0, maxLength);
  // Find the last complete word
  const lastSpaceIndex = truncatedText.lastIndexOf(' ');
  const finalText = lastSpaceIndex > 0 ? truncatedText.substring(0, lastSpaceIndex) : truncatedText;
  
  return `${finalText}...`;
};

const isHtmlContent = (content) => {
  // Check if content contains HTML tags (simple detection)
  return /<[a-z][\s\S]*>/i.test(content);
};

const isRichTextField = (key) => {
  // Check if field name suggests it's a rich text field
  const lowerKey = key.toLowerCase();
  return lowerKey.includes('details') || lowerKey.includes('note');
};

const capitalizeWords = (string) => {
  return string.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const addSpaceAfterComma = (string) => {
  return string.replace(/,/g, ", ");
};

const removeCommasIfNeeded = (key, value) => {
  if (key.toLowerCase().includes("dates") || key.toLowerCase().includes("year")) {
    return value.replace(/,/g, "");
  }
  return value;
};

const GenericEntry = ({ isArchived, onEdit, onArchive, onRestore, field1, field2, data_details }) => {
  const [attributes, setAttributes] = useState([]);
  const [updatedField1, setUpdatedField1] = useState(field1);
  const [updatedField2, setUpdatedField2] = useState(field2);

  useEffect(() => {
    const newAttributes = Object.entries(data_details)
      .filter(([key, value]) => {
        // Find which keys correspond to field1 and field2
        const field1Key = Object.keys(data_details).find((k) => data_details[k] === field1);
        const field2Key = Object.keys(data_details).find((k) => data_details[k] === field2);

        return (
          value &&
          key !== field1Key &&
          key !== field2Key &&
          !(Array.isArray(value) && value.length === 0) &&
          key !== "author_ids" &&
          key !== "class_size_(per_year)" &&
          key !== "labs_(per_year)" &&
          key !== "lectures_(per_year)" &&
          key !== "other_(per_year)" &&
          key !== "scheduled_hours" &&
          key !== "tutorials_(per_year)"
        );
      })
      .map(([key, value]) => {
        const newValue = removeCommasIfNeeded(key, String(value));
        return `${capitalizeWords(key)}: ${addSpaceAfterComma(newValue)}`;
      })
      .sort((a, b) => a.localeCompare(b));

    let tempField1 = field1;
    let tempField2 = field2;
    Object.entries(data_details).forEach(([key, value]) => {
      if (value === field1 && (key.toLowerCase().includes("dates") || key.toLowerCase().includes("year"))) {
        tempField1 = field1.replace(/,/g, "");
      }
      if (value === field2 && (key.toLowerCase().includes("dates") || key.toLowerCase().includes("year"))) {
        tempField2 = field2.replace(/,/g, "");
      }
    });

    setUpdatedField1(tempField1);
    setUpdatedField2(tempField2);
    setAttributes(newAttributes);
  }, [data_details, field1, field2]);

  return (
    <div className="min-h-8 shadow-glow mx-4 my-2 px-4 py-4 flex items-center bg-white rounded-lg">
      <div className="flex-1 w-full">
        {updatedField1 && (
          <h1 className="text-gray-800 font-bold break-words">
            {isHtmlContent(updatedField1) ? (
              <div 
                className="html-content inline"
                dangerouslySetInnerHTML={{ __html: truncateHtml(updatedField1, MAX_CHAR_LENGTH) }}
              />
            ) : (
              truncateText(updatedField1, MAX_CHAR_LENGTH)
            )}
          </h1>
        )}
        {updatedField2 && (
          <h2 className="text-gray-600 break-words mb-[3px]">
            {isHtmlContent(updatedField2) ? (
              <div 
                className="html-content inline"
                dangerouslySetInnerHTML={{ __html: truncateHtml(updatedField2, MAX_CHAR_LENGTH) }}
              />
            ) : (
              truncateText(updatedField2, MAX_CHAR_LENGTH)
            )}
          </h2>
        )}
        {attributes.map((attribute, index) => {
          // Split "Label: Value"
          const [label, ...rest] = attribute.split(": ");
          const value = rest.join(": ");
          const originalKey = Object.keys(data_details).find(k => 
            capitalizeWords(k) === label.trim()
          );
          
          // Special case: Only show Agency if value is not 'rise' (case-insensitive)
          if (label.trim() === "Agency" && value.trim().toLowerCase() === "rise") {
            return <></>;
          }
          if (label.trim().toLowerCase() === "highlight") {
            return <></>;
          }
          
          const isRichField = originalKey && isRichTextField(originalKey);
          const isHtml = isHtmlContent(value);
          
          return (
            <p key={index} className="text-gray-600 break-words text-sm">
              <span className="font-bold">{label}:</span>{" "}
              {isRichField && isHtml ? (
                <span 
                  className="html-content inline"
                  dangerouslySetInnerHTML={{ __html: truncateHtml(value, MAX_CHAR_LENGTH) }}
                />
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
            <button className="btn btn-sm btn-circle btn-ghost" onClick={() => onEdit()}>
              <FaRegEdit className="h-5 w-5" />
            </button>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={() => onArchive()}>
              <IoClose className="h-5 w-5" />
            </button>
          </>
        )}

        {isArchived && (
          <button className="btn btn-xs btn-circle btn-ghost" onClick={onRestore}>
            <LuUndo2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default GenericEntry;
