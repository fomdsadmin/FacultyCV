import React from "react";

const WorkSection = ({ onClick, id, title, category, info }) => {

    const handleClick = () => {
        onClick(id);
    }

    const arr = title.split(".");
    const name = arr[arr.length - 1];
    const catArr = category.split(".");
    const catName = catArr[catArr.length - 1];


    return (                
        <div className="bg-base-100 pr-5 my-3 m-4 p-4 shadow-glow rounded-lg">
            <div className="flex justify-between items-center ">
                
                <div className="flex flex-col justify-center">
                    <h3 className="card-title">{name ? name.trim() : title}</h3>
                    <p>{catName ? catName.trim() : category}</p>
                    <p className="text-sm">{info}</p>
                </div>

                <div className="card-actions">
                    <button onClick={handleClick} className="text-white btn btn-primary min-h-0 h-8 leading-tight">Manage</button>
                </div>

            </div>
        </div>
    )
}

export default WorkSection;