import React, { useState } from "react";
import ModalStylingWrapper from "SharedComponents/ModalStylingWrapper";

const AddGroupModal = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd(name);
      setName("");
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setName("");
    setIsOpen(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: "8px 16px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        + Add Group
      </button>

      {isOpen && (
        <ModalStylingWrapper useDefaultBox>
          <div>
            <h4 style={{ marginTop: 0, marginBottom: 16 }}>Add New Group</h4>
            <input
              type="text"
              placeholder="Group name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: 4,
                fontSize: 14,
                marginBottom: 16,
                boxSizing: "border-box",
              }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={handleClose}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f0f0f0",
                  color: "#333",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Add Group
              </button>
            </div>
          </div>
        </ModalStylingWrapper>
      )}
    </>
  );
};

export default AddGroupModal;
