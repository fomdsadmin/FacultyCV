import React from "react";

const WorkSection = ({ onClick, id, title, category }) => {

    const handleClick = () => {
        onClick(id);
    }
	
  // Change title dynamically
  const displayTitle = title === "Secure Funding" ? "Research Funding" : title;

    return (                
        <div className="bg-base-100 pr-5 my-3 m-4 p-4 shadow-glow rounded-lg">
            <div className="flex justify-between items-center ">
                
                <div className="flex flex-col justify-center">
                    <h3 className="card-title">{displayTitle}</h3>
                    <p>{category}</p>
                </div>

                <div className="card-actions">
                    <button onClick={handleClick} className="text-white btn btn-primary min-h-0 h-8 leading-tight">Manage</button>
                </div>

            </div>
        </div>
    )
}

export default WorkSection;
