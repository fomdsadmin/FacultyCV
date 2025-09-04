import React from "react";
import { useApp } from "Contexts/AppContext";

const TemplateCard = ({ onClick, onClone, id, title, createdWithRole }) => {

    const { currentViewRole } = useApp();

    const handleClick = () => {
        onClick(id);
    }

    const handleClone = () => {
        if (onClone) onClone(id);
    }

    // Determine which buttons to show based on roles
    const canManage = currentViewRole === "Admin" || !(createdWithRole === "Admin" && currentViewRole === "Admin-All");
    const canClone = true; // Everyone can clone

    return (                
        <div className="bg-base-100 pr-5 my-3 m-4 p-4 shadow-glow rounded-lg">
            <div className="flex justify-between items-center ">
                
                <div className="flex flex-col justify-center">
                    <h3 className="card-title">{title}</h3>
                    {createdWithRole && (
                        <span className="text-sm text-gray-500">Created by: {createdWithRole}</span>
                    )}
                </div>

                <div className="card-actions flex gap-2">
                    {canManage && (
                        <button onClick={handleClick} className="text-white btn btn-primary min-h-0 h-8 leading-tight">
                            Manage
                        </button>
                    )}
                    {canClone && (
                        <button onClick={handleClone} className="btn btn-secondary min-h-0 h-8 leading-tight">
                            Clone
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}

export default TemplateCard;
