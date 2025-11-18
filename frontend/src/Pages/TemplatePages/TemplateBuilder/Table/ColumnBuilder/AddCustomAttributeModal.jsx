import React, { useState } from "react";
import ModalStylingWrapper from "SharedComponents/ModalStylingWrapper";

const AddCustomAttributeModal = ({ onAdd }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customName, setCustomName] = useState("");
    const [customKey, setCustomKey] = useState("");
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!customName.trim()) {
            newErrors.name = "Attribute name is required";
        }

        if (!customKey.trim()) {
            newErrors.key = "Attribute key is required";
        }

        // Validate key format (alphanumeric, underscores, hyphens only)
        if (customKey.trim() && !/^[a-zA-Z0-9_-]+$/.test(customKey.trim())) {
            newErrors.key = "Key can only contain letters, numbers, underscores, and hyphens";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onAdd(customName.trim(), customKey.trim());
            setCustomName("");
            setCustomKey("");
            setErrors({});
            setIsOpen(false);
        }
    };

    const handleClose = () => {
        setCustomName("");
        setCustomKey("");
        setErrors({});
        setIsOpen(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && customName.trim() && customKey.trim()) {
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
                + Add Custom Attribute
            </button>

            {isOpen && (
                <ModalStylingWrapper useDefaultBox>
                    <div>
                        <h4 style={{ marginTop: 0, marginBottom: 16 }}>Add Custom Attribute</h4>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, color: "#666", fontWeight: 500, display: "block", marginBottom: 4 }}>
                                Attribute Name
                            </label>
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="e.g., Award Title"
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: `1px solid ${errors.name ? "#f44336" : "#ddd"}`,
                                    borderRadius: 4,
                                    fontSize: 14,
                                    boxSizing: "border-box",
                                }}
                                autoFocus
                            />
                            {errors.name && (
                                <span style={{ fontSize: 12, color: "#f44336", marginTop: 4, display: "block" }}>
                                    {errors.name}
                                </span>
                            )}
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, color: "#666", fontWeight: 500, display: "block", marginBottom: 4 }}>
                                Attribute Key (database column name)
                            </label>
                            <input
                                type="text"
                                value={customKey}
                                onChange={(e) => setCustomKey(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="e.g., award_title"
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: `1px solid ${errors.key ? "#f44336" : "#ddd"}`,
                                    borderRadius: 4,
                                    fontSize: 14,
                                    boxSizing: "border-box",
                                    fontFamily: "monospace",
                                }}
                            />
                            {errors.key && (
                                <span style={{ fontSize: 12, color: "#f44336", marginTop: 4, display: "block" }}>
                                    {errors.key}
                                </span>
                            )}
                            <span style={{ fontSize: 11, color: "#999", marginTop: 4, display: "block" }}>
                                Use only letters, numbers, underscores, and hyphens
                            </span>
                        </div>

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
                                disabled={!customName.trim() || !customKey.trim()}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor:
                                        customName.trim() && customKey.trim() ? "#4CAF50" : "#ccc",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor:
                                        customName.trim() && customKey.trim()
                                            ? "pointer"
                                            : "not-allowed",
                                    fontSize: 14,
                                    fontWeight: 500,
                                }}
                            >
                                Add Custom Attribute
                            </button>
                        </div>
                    </div>
                </ModalStylingWrapper>
            )}
        </>
    );
};

export default AddCustomAttributeModal;
