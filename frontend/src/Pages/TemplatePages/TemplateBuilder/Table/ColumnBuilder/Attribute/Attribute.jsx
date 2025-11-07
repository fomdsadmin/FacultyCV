import React from "react";

const Attribute = ({ attribute, setAttribute }) => {
  const handleRenameChange = (e) => {
    setAttribute({ rename: e.target.value });
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
          color: "#333"
        }}
      />
    </div>
  );
};

export default Attribute;
