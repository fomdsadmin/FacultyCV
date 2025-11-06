import React from "react";

const Group = ({ group, setGroup }) => {
  // group is the group object from items state
  // setGroup(id, updates) to update the group
  // Example: setGroup(group.id, { name: "New Name" })

  return (
    <>
      <div style={{ color: "#666", fontSize: 12, padding: "8px 12px" }}>
        Group: {group?.name}
        <div style={{ marginTop: 8, fontSize: 11, color: "#999" }}>
          You can use setGroup to update group properties
        </div>
      </div>
    </>
  );
};

export default Group;
