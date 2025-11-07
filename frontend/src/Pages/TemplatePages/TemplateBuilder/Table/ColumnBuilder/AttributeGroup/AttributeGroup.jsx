import React from "react";
const AttributeGroup = ({ attributeGroup, setAttributeGroup }) => {
    const handleNameChange = (e) => {
        setAttributeGroup({ name: e.target.value });
    };

    return (
        <div style={{ color: "#666", fontSize: 12 }}>
            <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4, fontWeight: 500 }}>
                    Name
                </label>
                <input
                    type="text"
                    value={attributeGroup?.name || ""}
                    onChange={handleNameChange}
                    style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        fontSize: 14,
                        boxSizing: "border-box",
                        fontWeight: 600,
                        color: "#333"
                    }}
                />
            </div>
        </div>
    );
};

export default AttributeGroup;
