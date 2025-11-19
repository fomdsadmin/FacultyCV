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

  const handleListGroupWhenEmptyChange = (e) => {
    setGroup(group.id, {
      groupSettings: {
        ...group.groupSettings,
        noDataDisplaySettings: {
          ...group.groupSettings.noDataDisplaySettings,
          display: e.target.checked
        }
      }
    });
  };

  const handleListEmptyTablesChange = (e) => {
    setGroup(group.id, {
      groupSettings: {
        ...group.groupSettings,
        noDataDisplaySettings: {
          ...group.groupSettings.noDataDisplaySettings,
          listEmptyTables: e.target.checked
        }
      }
    });
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

        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: "1px solid #e0e0e0" }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={group?.groupSettings?.noDataDisplaySettings?.display || false}
                onChange={handleListGroupWhenEmptyChange}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: 12, color: "#666" }}>
                List group when empty
              </span>
            </label>
          </div>

          {group?.groupSettings?.noDataDisplaySettings?.display && (
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={group?.groupSettings?.noDataDisplaySettings?.listEmptyTables || false}
                  onChange={handleListEmptyTablesChange}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontSize: 12, color: "#666" }}>
                  List empty tables?
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Group;
