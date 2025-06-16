import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaGripVertical, FaChevronDown } from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { updateSection } from "../graphql/graphqlHelpers";

const ATTRIBUTE_TYPES = ["dropdown", "date", "boolean", "text"];

const AttributeModal = ({
  setIsOpen,
  onBack,
  getDataSections,
  section,
  mode = "add", // "add" or "edit"
}) => {
  // Add a unique id to each attribute
  const [attributes, setAttributes] = useState([
    { id: "attr-0", name: "", type: "" },
  ]);
  const [addingSection, setAddingSection] = useState(false);
  const [errors, setErrors] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({});

  useEffect(() => {
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
      // Convert object to array of {id, name, type}
      const attrArr = Object.keys(existingAttributes).length
        ? Object.entries(existingAttributes).map(([name, type], index) => ({
            id: `attr-${index}`,
            name,
            type: type || "",
          }))
        : [{ id: "attr-0", name: "", type: "" }];
      setAttributes(attrArr);

      // Initialize dropdownOptions for dropdown attributes
      const dropdownInit = {};
      attrArr.forEach((attr) => {
        if (attr.type === "dropdown") {
          dropdownInit[attr.name] = ""; // You can prefill with saved options if available
        }
      });
      setDropdownOptions(dropdownInit);
    } else {
      setAttributes([{ id: "attr-0", name: "", type: "" }]);
      setDropdownOptions({});
    }
  }, [mode, section]);

  const handleDropdownOptionsChange = (index, value) => {
    const attrName = attributes[index].name;
    setDropdownOptions((prev) => ({
      ...prev,
      [attrName]: value,
    }));
  };

  // Update attribute name change to keep dropdownOptions in sync
  const handleAttributeChange = (index, key) => {
    const oldName = attributes[index].name;
    const newAttributes = [...attributes];
    newAttributes[index].name = key;
    setAttributes(newAttributes);

    // If this is a dropdown, move options to new name
    if (newAttributes[index].type === "dropdown" && oldName !== key) {
      setDropdownOptions((prev) => {
        const updated = { ...prev };
        if (updated[oldName]) {
          updated[key] = updated[oldName];
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
    const newErrors = {};
    if (
      attributes.length === 0 ||
      attributes.some((attr) => !attr.name || attr.name.trim() === "")
    ) {
      newErrors.attributes = "All attribute names are required";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setAddingSection(true);

    // Convert array to object for old attributes
    const combinedAttributes = attributes.reduce((acc, obj) => {
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

    const attributesJSONString = JSON.stringify(updatedAttributes);

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

    console.log("AWSJson for updateSection:", awsJson);

    try {
      await updateSection(section.data_section_id, false, attributesJSONString);
    } catch (error) {
      console.error("Error updating section:", error);
    }
    await getDataSections();
    console.log("Section updated successfully: ", section.title);
    setAddingSection(false);
    onBack();
  };

  return (
    <dialog className="modal-dialog items-center mx-auto" open>
      <div className="modal-content">
        {/* Header */}
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>
        <div className="mt-5 leading-tight mr-4 ml-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mode === "edit"
                ? "Edit Section Attributes"
                : "Add Section Attributes"}
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
                      <Draggable
                        key={attribute.id}
                        draggableId={attribute.id}
                        index={index}
                      >
                        {(provided, snapshot) => {
                          // Fix positioning with proper style properties
                          const draggableStyle = {
                            ...provided.draggableProps.style,
                            top: "auto", // Keep original top position
                            left: "auto", // Keep original left position
                            width: snapshot.isDragging ? "85%" : "100%", // Slightly narrower when dragging
                            transform: provided.draggableProps.style.transform, // Keep transform for positioning
                            margin: 0, // Remove margins
                          };

                          return (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={draggableStyle}
                              className={`flex flex-col gap-2 mb-2 rounded p-2 ${
                                snapshot.isDragging
                                  ? "bg-blue-50 shadow-lg border border-blue-200"
                                  : "bg-white"
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
                                  onChange={(e) =>
                                    handleAttributeChange(index, e.target.value)
                                  }
                                />
                                <div className="relative w-full">
                                  <select
                                    className="input input-bordered w-full pr-8"
                                    value={attribute.type || "text"}
                                    onChange={(e) =>
                                      handleTypeChange(index, e.target.value)
                                    }
                                  >
                                    <option value="text">text</option>
                                    {ATTRIBUTE_TYPES.filter(
                                      (type) => type !== "text"
                                    ).map((type) => (
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
                                <div
                                  className={
                                    mode === "edit"
                                      ? "w-[77%] ml-12"
                                      : "w-[90%] ml-12"
                                  }
                                >
                                  <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    placeholder="Dropdown options (comma separated)"
                                    value={
                                      dropdownOptions[attribute.name] || ""
                                    }
                                    onChange={(e) =>
                                      handleDropdownOptionsChange(
                                        index,
                                        e.target.value
                                      )
                                    }
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
            {errors.attributes && (
              <p className="text-red-500 text-sm">{errors.attributes}</p>
            )}
            <button
              type="button"
              onClick={handleAddAttribute}
              className="btn btn-secondary text-white mt-4 flex items-center"
            >
              <FaPlus className="mr-2" /> Add Attribute
            </button>
          </div>

          <div className="flex justify-end">
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
      </div>
    </dialog>
  );
};

export default AttributeModal;