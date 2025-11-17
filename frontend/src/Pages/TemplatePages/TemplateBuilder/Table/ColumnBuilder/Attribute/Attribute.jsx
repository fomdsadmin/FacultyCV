import React from "react";
import FootnoteModal from "./FootnoteModal";

const Attribute = ({ attribute, setAttribute, availableAttributes }) => {
  const handleRenameChange = (e) => {
    setAttribute({ rename: e.target.value });
  };

  const handleKeyRenameChange = (e) => {
    setAttribute({ keyRename: e.target.value });
  };

  return (
    <div style={{ color: "#666", fontSize: 12, padding: "8px 12px" }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>
          Original Name: {attribute?.originalName}
        </span>
      </div>
      <input
        type="text"
        value={attribute?.rename || ""}
        onChange={handleRenameChange}
        placeholder="Enter new name"
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #ddd",
          borderRadius: 4,
          fontSize: 13,
          boxSizing: "border-box",
          color: "#333",
          marginBottom: 12,
        }}
      />

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "#666", fontWeight: 500, display: "block", marginBottom: 4 }}>
          Key: <span style={{ fontFamily: "monospace", color: "#333" }}>{attribute?.key}</span>
        </label>
        <input
          type="text"
          value={attribute?.keyRename || ""}
          onChange={handleKeyRenameChange}
          placeholder="Enter custom key (optional)"
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: 4,
            fontSize: 13,
            boxSizing: "border-box",
            color: "#333",
            fontFamily: "monospace",
          }}
        />
      </div>

      <div>
        <FootnoteModal
          attribute={attribute}
          setAttribute={setAttribute}
          availableAttributes={availableAttributes || []}
        />
      </div>
    </div>
  );
};

export default Attribute;
