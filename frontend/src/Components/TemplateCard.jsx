import React from "react";

const TemplateCard = ({ onClick, onClone, id, title }) => {

    const handleClick = () => {
        onClick(id);
    }

    const handleClone = () => {
        if (onClone) onClone(id);
    }

    return (                
        <div className="bg-base-100 pr-5 my-3 m-4 p-4 shadow-glow rounded-lg">
            <div className="flex justify-between items-center ">
                
                <div className="flex flex-col justify-center">
                    <h3 className="card-title">{title}</h3>
                </div>

                <div className="card-actions flex gap-2">
                    <button onClick={handleClick} className="text-white btn btn-primary min-h-0 h-8 leading-tight">Manage</button>
                    <button onClick={handleClone} className="btn btn-secondary min-h-0 h-8 leading-tight">Clone</button>
                </div>

            </div>
        </div>
    )
}

export default TemplateCard;
