import React from "react";

const ErrorMessage = ({ error }) => {
    if (!error) return null;

    return (
        <div className="mb-3 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-xs">
            {error}
        </div>
    );
};

const InfoMessage = ({ message, type = "info" }) => {
    if (!message) return null;

    const styleMap = {
        info: "bg-green-50 border-green-300 text-green-700",
        success: "bg-green-50 border-green-300 text-green-700",
        warning: "bg-yellow-50 border-yellow-300 text-yellow-700",
    };

    const classes = styleMap[type] || styleMap.info;

    return (
        <div className={`mt-3 p-3 border rounded text-xs ${classes}`}>
            {message}
        </div>
    );
};

export { ErrorMessage, InfoMessage };
