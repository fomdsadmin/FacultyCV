import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaGripVertical, FaChevronDown } from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { updateSection } from "../graphql/graphqlHelpers";

const ATTRIBUTE_TYPES = ["dropdown", "date", "boolean", "text"];

const AttributeModal = ({
  setIsOpen,
  getDataSections,
  section,
  mode = "add", // "add" or "edit"
  attributeTypeMap, // New prop for attribute type mapping
}) => {
  // Add a unique id to each attribute
  const [attributes, setAttributes] = useState([
    { id: "attr-0", name: "", type: "" },
  ]);
  const [addingSection, setAddingSection] = useState(false);
  const [errors, setErrors] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({});

  useEffect(() => {
    // Build attribute type map from section.attributes_type
    let attributesType =
      typeof section.attributes_type === "string"
        ? JSON.parse(section.attributes_type)
        : section.attributes_type || {};

    // Map attribute name to type and options (for dropdown)
    const attrTypeMap = {};
    Object.entries(attributesType).forEach(([type, attrsObj]) => {
      // Normalize type: map "dates" to "date"
      const normalizedType = type === "dates" ? "date" : type;
      if (normalizedType === "dropdown") {
        // attrsObj: { Type: ["A", "B"] }
        Object.entries(attrsObj || {}).forEach(([attrName, options]) => {
          attrTypeMap[attrName] = { type: normalizedType, options };
        });
      } else {
        // attrsObj: { Note: "", Details: "" }
        Object.keys(attrsObj || {}).forEach((attrName) => {
          attrTypeMap[attrName] = { type: normalizedType };
        });
      }
    });

    if (mode === "edit") {
      let existingAttributes = {};
      try {
        existingAttributes =
          typeof section.attributes === "string"
            ? JSON.parse(section.attributes)
            : section.attributes;
      } catch {
        existingAttributes = {};
      }
      const attrArr = Object.keys(existingAttributes).length
        ? Object.keys(existingAttributes).map((name, index) => ({
            id: `attr-${index}`,
            name,
            type: attrTypeMap[name]?.type || "text",
          }))
        : [{ id: "attr-0", name: "", type: "text" }];

      setAttributes(attrArr);

      // Autofill dropdown options if present
      const dropdowns = {};
      attrArr.forEach((attr) => {
        if (attr.type === "dropdown" && attrTypeMap[attr.name]?.options) {
          dropdowns[attr.name] = attrTypeMap[attr.name].options.join(", ");
        }
      });
      setDropdownOptions(dropdowns);
    } else {
      setAttributes([{ id: "attr-0", name: "", type: "text" }]);
    }
  }, [mode, section, attributeTypeMap]);

  const handleDropdownOptionsChange = (index, value) => {
    const attrName = attributes[index].name;
    setDropdownOptions((prev) => ({
      ...prev,
      [attrName]: value,
    }));
  };

  const capitalizeFirst = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  // Update attribute name change to keep dropdownOptions in sync
  const handleAttributeChange = (index, value) => {
    const newAttributes = [...attributes];
    newAttributes[index].name = capitalizeFirst(value);
    setAttributes(newAttributes);

    // If this is a dropdown, move options to new name
    if (newAttributes[index].type === "dropdown") {
      setDropdownOptions((prev) => {
        const updated = { ...prev };
        const oldName = attributes[index].name;
        if (updated[oldName]) {
          updated[newAttributes[index].name] = updated[oldName];
          delete updated[oldName];
        }
        return updated;
      });
    }
  };

  const handleTypeChange = (index, value) => {
    const newAttributes = [...attributes];
    newAttributes[index].type = value;
    setAttributes(newAttributes);
  };

  const handleAddAttribute = () => {
    setAttributes([
      ...attributes,
      {
        id: `attr-${attributes.length}`,
        name: "",
        type: "",
      },
    ]);
  };

  const handleRemoveAttribute = (index) => {
    const newAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(newAttributes);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(attributes);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setAttributes(reordered);
  };

  const handleUpdateSection = async () => {
    // Trim trailing spaces from attribute names
    const trimmedAttributes = attributes.map((attr) => ({
      ...attr,
      name: attr.name ? attr.name.trimEnd() : "",
    }));

    const newErrors = {};
    if (
      trimmedAttributes.length === 0 ||
      trimmedAttributes.some((attr) => !attr.name || attr.name.trim() === "")
    ) {
      newErrors.attributes = "All attribute names are required";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setAddingSection(true);

    // Convert array to object for old attributes
    const combinedAttributes = trimmedAttributes.reduce((acc, obj) => {
      acc[obj.name] = obj.type || "text";
      return acc;
    }, {});

    let existingAttributes = {};
    try {
      existingAttributes =
        typeof section.attributes === "string"
          ? JSON.parse(section.attributes)
          : section.attributes;
    } catch {
      existingAttributes = {};
    }
    const updatedAttributes =
      mode === "edit"
        ? combinedAttributes
        : { ...existingAttributes, ...combinedAttributes };

    // Only keep field names with empty string values
    const toSnakeCase = (str) =>
      str
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .replace(/([a-z])([A-Z])/g, "$1_$2") // Add underscore before capital letters (not at start)
        .toLowerCase();

    const attributesJSONString = JSON.stringify(
      Object.keys(updatedAttributes).reduce((acc, key) => {
        acc[key] = toSnakeCase(key);
        return acc;
      }, {})
    );

    // Build AWSJson structure
    const awsJson = {
      text: {},
      dropdown: {},
      boolean: {},
      date: {},
    };

    Object.entries(updatedAttributes).forEach(([name, type]) => {
      const key = (type || "text").toLowerCase();
      if (key === "dropdown") {
        // Add options as array, split by comma, trim spaces
        awsJson[key][name] = (dropdownOptions[name] || "")
          .split(",")
          .map((opt) => opt.trim())
          .filter((opt) => opt.length > 0);
      } else if (awsJson[key]) {
        awsJson[key][name] = "";
      }
    });

    console.log("Attributes JSON:", attributesJSONString);
    console.log("AWSJson for updateSection:", awsJson);

    try {
      await updateSection(
        section.data_section_id,
        false,
        attributesJSONString,
        JSON.stringify(awsJson)
      );
    } catch (error) {
      console.error("Error updating section:", error);
    }
    await getDataSections();
    console.log("Section updated successfully: ", section.title);
    setAddingSection(false);
    setIsOpen(false);

  };

  return (
    <div className="w-full max-w-5xl items-center ml-6 bg-white rounded-lg px-4 relative">
      <button
        type="button"
        className="btn btn-md btn-circle btn-ghost absolute top-2 right-2 z-10"
        onClick={() => setIsOpen(false)}
        aria-label="Close"
      >
        ✕
      </button>
      <div className="w-full mt-2 mb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 w-full">
          <div className="mt-5 leading-tight mr-4 ml-4 w-full md:col-span-2">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === "edit" ? "Edit Section Attributes" : "Add Section Attributes"}
              </label>

              {/* Fixed DragDropContext */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="attributes">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="rounded-lg bg-gray-50 p-2" // Add container styling
                    >
                      {attributes.map((attribute, index) => (
                        <Draggable key={attribute.id} draggableId={attribute.id} index={index}>
                          {(provided, snapshot) => {
                            // Fix positioning with proper style properties
                            const draggableStyle = {
                              ...provided.draggableProps.style,
                              top: "auto", // Keep original top position
                              left: "auto", // Keep original left position
                              width: snapshot.isDragging ? "45%" : "100%", // Slightly narrower when dragging
                              transform: provided.draggableProps.style.transform, // Keep transform for positioning
                              margin: 0, // Remove margins
                            };

                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={draggableStyle}
                                className={`flex flex-col gap-2 mb-2 rounded p-2 ${
                                  snapshot.isDragging ? "bg-blue-50 shadow-lg border border-blue-200" : "bg-white"
                                }`}
                              >
                                <div className="flex gap-4 items-center">
                                  <span
                                    {...provided.dragHandleProps}
                                    className="cursor-grab px-2 text-gray-400"
                                    title="Drag to reorder"
                                  >
                                    <FaGripVertical />
                                  </span>
                                  <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    placeholder="Attribute name"
                                    value={attribute.name}
                                    onChange={(e) => handleAttributeChange(index, e.target.value)}
                                  />
                                  <div className="relative w-full">
                                    <select
                                      className="input input-bordered w-full pr-8"
                                      value={attribute.type || "text"}
                                      onChange={(e) => handleTypeChange(index, e.target.value)}
                                    >
                                      <option value="text">text</option>
                                      {ATTRIBUTE_TYPES.filter((type) => type !== "text").map((type) => (
                                        <option key={type} value={type}>
                                          {type}
                                        </option>
                                      ))}
                                    </select>
                                    <FaChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                                  </div>
                                  {attributes.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAttribute(index)}
                                      className="btn btn-danger hover:bg-red-700 text-white bg-black h-15 w-15 flex items-center justify-center"
                                    >
                                      <FaTrash />
                                    </button>
                                  )}
                                </div>
                                {attribute.type === "dropdown" && (
                                  <div className={mode === "edit" ? "w-[81%] ml-12" : "w-full ml-12"}>
                                    <input
                                      type="text"
                                      className="input input-bordered w-full"
                                      placeholder="Dropdown options (comma separated)"
                                      value={dropdownOptions[attribute.name] || ""}
                                      onChange={(e) => handleDropdownOptionsChange(index, e.target.value)}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Rest of your form */}
              {errors.attributes && <p className="text-red-500 text-sm">{errors.attributes}</p>}
              <button
                type="button"
                onClick={handleAddAttribute}
                className="btn btn-sm bg-green-400 text-white mt-4 flex items-center"
              >
                <FaPlus className="mr-2" /> New
              </button>
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleUpdateSection}
                className="btn btn-primary text-white"
                disabled={addingSection}
              >
                {addingSection
                  ? mode === "edit"
                    ? "Updating..."
                    : "Adding..."
                  : mode === "edit"
                  ? "Update Section"
                  : "Add Section"}
              </button>
            </div>
          </div>
          <div className="md:col-span-1 mt-12 leading-tight mr-8 ml-2 min-h-[40vh] w-full bg-gray-100 rounded-lg p-4">
            <h1 className="text-sm font-medium text-gray-700 mb-2">Notes</h1>
            <ul className="text-xs text-gray-600 list-disc pl-4 space-y-2">
              <li>
                <b>Text</b>: For freeform text fields.
                <br />
                Example: <i>“Details”</i>
              </li>
              <li>
                <b>Date</b>: For date fields. Examples:
                <ul className="list-decimal pl-4 mt-2">
                  <li>
                    <i>"Start Date"</i> : Start Month and Start Year
                  </li>
                  <li>
                    <i>"End Date"</i> : End Month and End Year
                  </li>
                  <li>
                    <i>"Year"</i> : For single Year field
                  </li>
                  <li>
                    <i>“Dates”</i> : For a range of Dates (Start Date and End Date)
                  </li>
                </ul>
              </li>
              <li>
                <b>Dropdown</b>: For selecting from a list. Enter options separated by commas (e.g.,{" "}
                <i>“A, B, C, Other”</i>).
                <br />
                To add an “Other” option, just include it in the list.
              </li>
              {/* <li>
                <b>Boolean</b>: For yes/no or true/false fields.
              </li> */}
              <li>
                <b>Attribute Names</b> are for display and will be saved capitalized (e.g., <i>“Start Date”</i>).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttributeModal;