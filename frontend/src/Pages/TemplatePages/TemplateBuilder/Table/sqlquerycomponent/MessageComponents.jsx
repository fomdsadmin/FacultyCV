import React from "react";

const ErrorMessage = ({ error }) => {
    if (!error) return null;

    return (
        <div style={{
            marginBottom: 12,
            padding: "8px 12px",
            backgroundColor: "#ffebee",
            border: "1px solid #ef5350",
            borderRadius: 4,
            color: "#c62828",
            fontSize: 12,
        }}>
            {error}
        </div>
    );
};

const InfoMessage = ({ message, type = "info" }) => {
    if (!message) return null;

    const styles = {
        info: {
            backgroundColor: "#e8f5e9",
            border: "1px solid #4caf50",
            color: "#2e7d32",
        },
        success: {
            backgroundColor: "#e8f5e9",
            border: "1px solid #4caf50",
            color: "#2e7d32",
        },
        warning: {
            backgroundColor: "#fff3e0",
            border: "1px solid #ff9800",
            color: "#e65100",
        },
    };

    const style = styles[type] || styles.info;

    return (
        <div style={{
            marginTop: 12,
            padding: "8px 12px",
            ...style,
            borderRadius: 4,
            fontSize: 12,
        }}>
            {message}
        </div>
    );
};

export { ErrorMessage, InfoMessage };
