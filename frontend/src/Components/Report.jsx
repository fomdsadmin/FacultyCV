import React from "react";

const Report = ({ title }) => {
    return (
        <div className="min-h-8 shadow-glow ml-2 my-2 max-w-xs px-2 flex items-center">
            <p className="font-bold text-sm">{title}</p>
        </div>
    );
}

export default Report;