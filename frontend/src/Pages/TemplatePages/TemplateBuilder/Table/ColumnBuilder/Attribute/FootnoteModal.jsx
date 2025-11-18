import React, { useEffect, useMemo, useState } from "react";
import ModalStylingWrapper from "SharedComponents/ModalStylingWrapper";

const FootnoteModal = ({ attribute, setAttribute, availableAttributes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(attribute?.footnoteSettings?.footnoteSource || "");

  // Sync selectedSource when attribute changes
  useEffect(() => {
    setSelectedSource(attribute?.footnoteSettings?.footnoteSource || "");
  }, [attribute?.footnoteSettings?.footnoteSource]);

  // Filter out the current attribute from the available options
  const footnoteSourceOptions = availableAttributes.filter((attr) => attr.key !== attribute?.key);

  const handleSourceChange = (e) => {
    const sourceKey = e.target.value;
    setSelectedSource(sourceKey);

    // Automatically set footnoteTarget to the current attribute's key
    if (sourceKey) {
      setAttribute({
        footnoteSettings: {
          footnoteSource: sourceKey,
          footnoteTarget: attribute?.key,
        },
      });
    } else {
      setAttribute({
        footnoteSettings: {
          footnoteSource: "",
          footnoteTarget: "",
        },
      });
    }
  };

  const handleClose = () => {
    setSelectedSource(attribute?.footnoteSettings?.footnoteSource || "");
    setIsOpen(false);
  };

  const hasSetting = attribute?.footnoteSettings?.footnoteSource;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: "6px 12px",
          backgroundColor: hasSetting ? "#4CAF50" : "#f0f0f0",
          color: hasSetting ? "white" : "#333",
          border: `1px solid ${hasSetting ? "#45a049" : "#ddd"}`,
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        {hasSetting ? "✓ Footnote" : "+ Add Footnote"}
      </button>

      {isOpen && (
        <ModalStylingWrapper useDefaultBox>
          <div>
            <h4 style={{ marginTop: 0, marginBottom: 16 }}>Footnote Settings</h4>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4, fontWeight: 500 }}>
                Footnote Source (attribute to reference)
              </label>
              <select
                value={selectedSource}
                onChange={handleSourceChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              >
                <option value="">Select a source...</option>
                {footnoteSourceOptions.map((attr) => (
                  <option key={attr.key} value={attr.key}>
                    {attr.originalName}
                  </option>
                ))}
              </select>
            </div>

            {selectedSource && (
              <div style={{ marginBottom: 16, padding: "8px", backgroundColor: "#f9f9f9", borderRadius: 4 }}>
                <span style={{ fontSize: 12, color: "#666" }}>
                  <strong>Footnote Target:</strong> {attribute?.originalName}
                </span>
              </div>
            )}

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
                  fontSize: 13,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </ModalStylingWrapper>
      )}
    </>
  );
};

export default FootnoteModal;
