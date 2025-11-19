import React, { useRef, useEffect, useState } from "react";
import RichTextEditor from "./RichTextEditor";

const TextEntry = ({ attrsObj, attributes, formData, handleChange, section }) => {
  // State for managing author names table
  const [authorsList, setAuthorsList] = useState([]);
  const [showAllAuthors, setShowAllAuthors] = useState(false);

  // Check if this is a publications section
  const isPublicationsSection = section?.title?.toLowerCase().includes("journal publications") || false;
  const isOtherPublicationsSection = section?.title?.toLowerCase().includes("other publications") || false;

  // Initialize authors list from formData when component loads or formData changes
  useEffect(() => {
    if (!attrsObj) return;

    // Find the Author Names field in attrsObj
    const authorNamesEntry = Object.entries(attrsObj).find(
      ([attrName]) => attrName === "Author Names" || attrName.toLowerCase() === "author names"
    );

    if (!authorNamesEntry) return;

    const [attrName] = authorNamesEntry;
    const snakeKey = attributes && attributes[attrName] ? attributes[attrName] : attrName;
    const authorsValue = formData[snakeKey];

    if (authorsValue && typeof authorsValue === "string" && authorsValue.trim()) {
      // Parse comma-separated names with proper handling of "LastName, FirstInitial" format (eg. "Smith, J.")
      const parseAuthorNames = (str) => {
        const authors = [];
        const parts = str.split(",").map((s) => s.trim());

        let i = 0;
        while (i < parts.length) {
          const current = parts[i];

          // Check if next part exists and looks like an initial (1-2 chars, possibly with period)
          if (i + 1 < parts.length) {
            const next = parts[i + 1];
            // Check if next part is an initial: 1-2 characters, optionally with period(s)
            const isInitial = /^[A-Z]\.?(\s*[A-Z]\.?)*$/.test(next);

            if (isInitial) {
              // Combine current with next (LastName, Initial)
              authors.push(`${current}, ${next}`);
              i += 2;
            } else {
              // Next part is a new last name, so current is a standalone name
              authors.push(current);
              i += 1;
            }
          } else {
            // Last part, add as-is
            authors.push(current);
            i += 1;
          }
        }

        return authors.filter((name) => name);
      };

      const names = parseAuthorNames(authorsValue);
      const parsedAuthors = names.map((name, index) => ({
        id: index,
        name: name,
        isTrainee: false,
        isDoctoralSupervisor: false,
        isPostdoctoralSupervisor: false,
        authorType: "",
      }));
      setAuthorsList(parsedAuthors);
    } else if (authorsValue && Array.isArray(authorsValue)) {
      // Handle case where it's an array
      // Load metadata from separate fields if this is publications section
      const trainees = formData.author_trainees || [];
      const doctoralSupervisors = formData.author_doctoral_supervisors || [];
      const postdoctoralSupervisors = formData.author_postdoctoral_supervisors || [];
      const authorTypes = formData.author_types || {};

      // Helper function to determine author type from the nested structure
      const getAuthorType = (authorName) => {
        if (authorTypes.first_authors && authorTypes.first_authors.includes(authorName)) {
          return "First Author";
        }
        if (authorTypes.senior_authors && authorTypes.senior_authors.includes(authorName)) {
          return "Senior Author";
        }
        return "Contributing Author";
      };

      const parsedAuthors = authorsValue.map((item, index) => {
        const authorName = typeof item === "string" ? item : item?.name || String(item);

        // If item is already an object with our structure, use it
        if (typeof item === "object" && item !== null && "name" in item) {
          return {
            ...item,
            id: index,
            // Ensure new fields exist with defaults if not present
            isTrainee:
              item.isTrainee ??
              ((isPublicationsSection || isOtherPublicationsSection) && trainees.includes(authorName)),
            isDoctoralSupervisor:
              item.isDoctoralSupervisor ??
              ((isPublicationsSection || isOtherPublicationsSection) && doctoralSupervisors.includes(authorName)),
            isPostdoctoralSupervisor:
              item.isPostdoctoralSupervisor ??
              ((isPublicationsSection || isOtherPublicationsSection) && postdoctoralSupervisors.includes(authorName)),
            authorType:
              item.authorType ??
              (isPublicationsSection || isOtherPublicationsSection ? getAuthorType(authorName) : "Contributing Author"),
          };
        }
        // If item is a string, convert it to our structure
        return {
          id: index,
          name: authorName,
          isTrainee: (isPublicationsSection || isOtherPublicationsSection) && trainees.includes(authorName),
          isDoctoralSupervisor:
            (isPublicationsSection || isOtherPublicationsSection) && doctoralSupervisors.includes(authorName),
          isPostdoctoralSupervisor:
            (isPublicationsSection || isOtherPublicationsSection) && postdoctoralSupervisors.includes(authorName),
          authorType: isPublicationsSection || isOtherPublicationsSection ? getAuthorType(authorName) : "",
        };
      });
      setAuthorsList(parsedAuthors);
    } else {
      // Reset to empty if no value
      setAuthorsList([]);
    }
  }, [formData, attributes, attrsObj]);

  // Handle adding a new author
  const handleAddAuthor = (snakeKey) => {
    const newAuthor = {
      id: authorsList.length,
      name: "",
      isTrainee: false,
      isDoctoralSupervisor: false,
      isPostdoctoralSupervisor: false,
      authorType: "",
    };
    const updatedList = [...authorsList, newAuthor];
    setAuthorsList(updatedList);
    // Don't update formData yet until user enters a name
  };

  // Handle removing an author
  const handleRemoveAuthor = (snakeKey, id) => {
    const updatedList = authorsList.filter((author) => author.id !== id);
    setAuthorsList(updatedList);
    updateFormDataWithAuthors(snakeKey, updatedList);
  };

  // Handle author name change
  const handleAuthorNameChange = (snakeKey, id, newName) => {
    const updatedList = authorsList.map((author) => (author.id === id ? { ...author, name: newName } : author));
    setAuthorsList(updatedList);
    updateFormDataWithAuthors(snakeKey, updatedList);
  };

  // Handle checkbox changes - make them mutually exclusive
  const handleAuthorCheckboxChange = (snakeKey, id, field) => {
    const updatedList = authorsList.map((author) => {
      if (author.id === id) {
        // If checking this field, uncheck the other two
        if (!author[field]) {
          return {
            ...author,
            isTrainee: field === "isTrainee",
            isDoctoralSupervisor: field === "isDoctoralSupervisor",
            isPostdoctoralSupervisor: field === "isPostdoctoralSupervisor",
          };
        } else {
          // If unchecking, just toggle this field
          return { ...author, [field]: false };
        }
      }
      return author;
    });
    setAuthorsList(updatedList);
    updateFormDataWithAuthors(snakeKey, updatedList);
  };

  // Handle author type dropdown change
  const handleAuthorTypeChange = (snakeKey, id, newType) => {
    const updatedList = authorsList.map((author) => (author.id === id ? { ...author, authorType: newType } : author));
    setAuthorsList(updatedList);
    updateFormDataWithAuthors(snakeKey, updatedList);
  };

  // Update formData with authors list
  const updateFormDataWithAuthors = (snakeKey, updatedList) => {
    // Convert to array of strings (just the names) for compatibility with display components
    const authorNames = updatedList.map((author) => author.name).filter((name) => name);

    // Store as array of names
    handleChange({
      target: {
        name: snakeKey,
        value: authorNames,
      },
    });

    // Also store metadata in separate fields for publications section
    if (isPublicationsSection || isOtherPublicationsSection) {
      // Create arrays to store actual author names (not indices) for trainees, supervisors, etc.
      const trainees = [];
      const doctoralSupervisors = [];
      const postdoctoralSupervisors = [];

      // Create nested structure for author types
      // const authorTypes = {
      //   first_authors: [],
      //   co_first_authors: [],
      //   contributing_authors: [],
      //   co_senior_authors: [],
      //   senior_authors: [],
      // };
      
      const authorTypes = {
        first_authors: [],
        contributing_authors: [],
        senior_authors: [],
      };

      updatedList.forEach((author) => {
        if (author.name) {
          // Store the actual author name if they have this role
          if (author.isTrainee) {
            trainees.push(author.name);
          }
          if (author.isDoctoralSupervisor) {
            doctoralSupervisors.push(author.name);
          }
          if (author.isPostdoctoralSupervisor) {
            postdoctoralSupervisors.push(author.name);
          }

          // Categorize author by type
          const authorType = author.authorType || "Contributing Author";
          if (authorType === "First Author") {
            authorTypes.first_authors.push(author.name);
          } else if (authorType === "Senior Author") {
            authorTypes.senior_authors.push(author.name);
          } else {
            authorTypes.contributing_authors.push(author.name);
          }
        }
      });

      // Update metadata fields
      handleChange({
        target: {
          name: "author_trainees",
          value: trainees,
        },
      });
      handleChange({
        target: {
          name: "author_doctoral_supervisors",
          value: doctoralSupervisors,
        },
      });
      handleChange({
        target: {
          name: "author_postdoctoral_supervisors",
          value: postdoctoralSupervisors,
        },
      });
      handleChange({
        target: {
          name: "author_types",
          value: authorTypes,
        },
      });
    }
  };

  // Helper function to determine if field should span 2 columns
  const shouldSpanTwoColumns = (content, fieldName) => {
    const lower = fieldName.toLowerCase();
    const charThreshold = 35;

    // Always span 2 columns for certain field types
    if (["title", "details", "description", "note"].some((key) => lower.includes(key))) {
      return true;
    }

    // Span 2 columns if content exceeds threshold
    return content && content.length > charThreshold;
  };

  // Helper function to calculate rows needed
  const calculateRows = (content, fieldName) => {
    const lower = fieldName.toLowerCase();

    // Default rows for different field types
    if (["details", "description", "note"].some((key) => lower.includes(key))) {
      return Math.min(7, Math.max(2, Math.ceil((content || "").length / 80)));
    }

    // For other fields, calculate based on content length
    if (content && content.length > 50) {
      return Math.min(7, Math.max(2, Math.ceil(content.length / 60)));
    }

    return 1;
  };

  // Early return after all hooks have been called
  if (!attrsObj) return null;

  return Object.entries(attrsObj).map(([attrName, value]) => {
    // Get the snake_case key from attributes mapping
    const snakeKey = attributes && attributes[attrName] ? attributes[attrName] : attrName;
    const lower = attrName.toLowerCase();
    const currentValue = formData[snakeKey] || "";
    const shouldSpan = shouldSpanTwoColumns(currentValue, attrName);
    const rows = calculateRows(currentValue, attrName);

    // Special handling for Author Names field - only for Publications section
    // if (
    //   (attrName === "Author Names" || lower === "author names") &&
    //   (isPublicationsSection || isOtherPublicationsSection)
    // ) {
    //   const MAX_VISIBLE_AUTHORS = 10;
    //   const displayedAuthors = showAllAuthors ? authorsList : authorsList.slice(0, MAX_VISIBLE_AUTHORS);
    //   const hasMoreAuthors = authorsList.length > MAX_VISIBLE_AUTHORS;

    //   return (
    //     <div key={attrName} className="col-span-2 mb-1">
    //       <label className="block text-sm font-semibold capitalize mb-2">{attrName}</label>
    //       <div className="border border-gray-300 rounded p-3 bg-gray-50">
    //         {authorsList && (
    //           <div className="overflow-x-auto">
    //             <table className="w-full mb-3 text-sm">
    //               <thead>
    //                 <tr className="border-b border-gray-300">
    //                   <th className="text-left py-2 px-1 font-semibold">Author Name</th>
    //                   <th className="text-center py-2 px-1 font-semibold w-20">Trainee</th>
    //                   <th className="text-center py-2 px-1 font-semibold w-20">Doctoral Supervisor</th>
    //                   <th className="text-center py-2 px-2 font-semibold w-20">Postdoctoral Supervisor</th>
    //                   <th className="text-left py-2 px-2 font-semibold w-32">Author Type</th>
    //                 </tr>
    //               </thead>
    //               <tbody>
    //                 {displayedAuthors.map((author) => (
    //                   <tr key={author.id} className="border-b border-gray-200">
    //                     <td className="py-2 px-2">
    //                       <div className="flex items-center gap-2">
    //                         <button
    //                           type="button"
    //                           onClick={() => handleRemoveAuthor(snakeKey, author.id)}
    //                           className="text-red-600 hover:text-red-800 font-bold text-lg flex-shrink-0"
    //                           title="Remove author"
    //                         >
    //                           ×
    //                         </button>
    //                         <input
    //                           type="text"
    //                           value={author.name}
    //                           onChange={(e) => handleAuthorNameChange(snakeKey, author.id, e.target.value)}
    //                           className="w-full rounded text-sm px-2 py-1 border border-gray-300"
    //                           placeholder="Enter author name"
    //                         />
    //                       </div>
    //                     </td>
    //                     <td className="py-2 px-1 text-center">
    //                       <input
    //                         type="checkbox"
    //                         checked={author.isTrainee || false}
    //                         onChange={() => handleAuthorCheckboxChange(snakeKey, author.id, "isTrainee")}
    //                         disabled={author.isDoctoralSupervisor || author.isPostdoctoralSupervisor}
    //                         className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    //                       />
    //                     </td>
    //                     <td className="py-2 px-1 text-center">
    //                       <input
    //                         type="checkbox"
    //                         checked={author.isDoctoralSupervisor || false}
    //                         onChange={() => handleAuthorCheckboxChange(snakeKey, author.id, "isDoctoralSupervisor")}
    //                         disabled={author.isTrainee || author.isPostdoctoralSupervisor}
    //                         className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    //                       />
    //                     </td>
    //                     <td className="py-2 px-1 text-center">
    //                       <input
    //                         type="checkbox"
    //                         checked={author.isPostdoctoralSupervisor || false}
    //                         onChange={() => handleAuthorCheckboxChange(snakeKey, author.id, "isPostdoctoralSupervisor")}
    //                         disabled={author.isTrainee || author.isDoctoralSupervisor}
    //                         className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    //                       />
    //                     </td>
    //                     <td className="py-2 px-2">
    //                       <select
    //                         value={author.authorType || ""}
    //                         onChange={(e) => handleAuthorTypeChange(snakeKey, author.id, e.target.value)}
    //                         className="w-full rounded text-sm px-2 py-1 border border-gray-300 bg-white"
    //                       >
    //                         <option value="">-</option>
    //                         <option value="First Author">First Author</option>
    //                         <option value="Contributing Author">Contributing Author</option>
    //                         <option value="Senior Author">Senior Author</option>
    //                       </select>
    //                     </td>
    //                   </tr>
    //                 ))}
    //               </tbody>
    //             </table>
    //             <div className="flex items-center justify-between mb-1">
    //               <button
    //                 type="button"
    //                 onClick={() => handleAddAuthor(snakeKey)}
    //                 className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    //               >
    //                 + Add Author
    //               </button>
    //               {hasMoreAuthors && (
    //                 <div className="flex items-center gap-3">
    //                   <p className="text-sm text-gray-600">
    //                     Showing {showAllAuthors ? authorsList.length : MAX_VISIBLE_AUTHORS} of {authorsList.length} authors
    //                   </p>
    //                   <button
    //                     type="button"
    //                     onClick={() => setShowAllAuthors(!showAllAuthors)}
    //                     className="text-sm px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
    //                   >
    //                     {showAllAuthors ? 'Show Less' : 'Show All'}
    //                   </button>
    //                 </div>
    //               )}
    //             </div>
    //           </div>
    //         )}
    //       </div>
    //     </div>
    //   );
    // }

    if (["title"].some((key) => lower.includes(key))) {
      // Title fields - always span 2 columns
      return (
        <div key={attrName} className="col-span-2">
          <label className="block text-sm font-semibold capitalize mb-1">{attrName}</label>
          <textarea
            name={snakeKey}
            value={currentValue}
            onChange={handleChange}
            rows={rows}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300 resize-none"
            style={{ minHeight: "40px" }}
          />
        </div>
      );
    }

    if (["details", "note"].some((key) => lower.includes(key))) {
      // Details/Note fields - always span 2 columns with rich text editor
      return (
        <div key={attrName} className="col-span-2 mt-1">
          <label className="block text-sm font-semibold capitalize mb-1">{attrName}</label>
          <RichTextEditor
            ref={(ref) => {
              // Store reference to get value on save
              if (ref) {
                window.richTextEditorRefs = window.richTextEditorRefs || {};
                window.richTextEditorRefs[snakeKey] = ref;
              }
            }}
            value={currentValue}
            onChange={handleChange}
            rows={rows}
            name={snakeKey}
          />
        </div>
      );
    }

    // Dynamic fields - span 1 or 2 columns based on content
    if (shouldSpan) {
      return (
        <div key={attrName} className="col-span-2">
          <label className="block text-sm capitalize mb-1 font-semibold">{attrName}</label>
          <textarea
            name={snakeKey}
            value={currentValue}
            onChange={handleChange}
            rows={rows}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300 resize-none"
          />
        </div>
      );
    }

    // Default: single column text input
    return (
      <div key={attrName} className="">
        <label className="block text-sm capitalize mb-1 font-semibold">{attrName}</label>
        <input
          type="text"
          name={snakeKey}
          value={currentValue}
          onChange={handleChange}
          maxLength={500}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
        />
      </div>
    );
  });
};

export default TextEntry;
