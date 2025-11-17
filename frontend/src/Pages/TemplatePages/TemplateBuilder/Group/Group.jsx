import React from "react";
import HeaderEditor from "../Table/HeaderEditor";

const Group = ({ group, setGroup }) => {
  // group is the group object from items state
  // setGroup(id, updates) to update the group

  const handleNameChange = (e) => {
    setGroup(group.id, { name: e.target.value });
  };

  const handleHeaderChange = (value) => {
    console.log(value);
    setGroup(group.id, { groupSettings: { ...group.groupSettings, header: value } });
  };

  const handleWrapperTagChange = (wrapperTag) => {
    setGroup(group.id, { groupSettings: { ...group.groupSettings, headerWrapperTag: wrapperTag } });
  };

  return (
    <>
      <div style={{ color: "#666", fontSize: 12, padding: "8px 12px" }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4, fontWeight: 500 }}>
            Group Name
          </label>
          <input
            type="text"
            value={group?.name || ""}
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

        <HeaderEditor
          header={group?.groupSettings?.header || ""}
          onHeaderChange={handleHeaderChange}
          headerWrapperTag={group?.groupSettings?.headerWrapperTag || "div"}
          onWrapperTagChange={handleWrapperTagChange}
        />
      </div>
    </>
  );
};

export default Group;
