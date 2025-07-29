import React from "react";

const WorkSection = ({ onClick, onDataClick, id, title, category, info, userInfo }) => {
  const handleClick = () => {
    onClick(id);
  };

  const handleDataClick = () => {
    onDataClick(id);
  };

  const arr = title.split(".");
  const name = arr[arr.length - 1];
  const catArr = category.split(".");
  const catName = catArr[catArr.length - 1];

  return (
    <div className="bg-base-100 my-3 m-4 p-4 shadow-glow rounded-lg">
      <div className="flex flex-row justify-between items-start gap-4">
        <div className="flex flex-col justify-center">
          <h3 className="card-title">{name ? name.trim() : title}</h3>
          <p>{catName ? catName.trim() : category}</p>
          <p className="text-sm">{info}</p>
        </div>
        <div className="card-actions flex flex-row gap-2 self-start min-w-max">
          {userInfo && userInfo.role === "Admin" && (
            <button onClick={handleDataClick} className="text-white btn btn-secondary min-h-0 h-8 leading-tight">
              CV Data
            </button>
          )}
          <button onClick={handleClick} className="text-white btn btn-primary min-h-0 h-8 leading-tight">
            Manage
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkSection;

