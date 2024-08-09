import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AssociatedConnection = ({ connection, getUser }) => {
    const [fontSize, setFontSize] = useState(20);
    const [truncationLength, setTruncationLength] = useState(25);
    const navigate = useNavigate();
    
    const truncateString = (str, num) => {
        if (str.length <= num) {
            return str;
        }
        return str.slice(0, num) + '...';
    };

    useEffect(() => {
        console.log("connection", connection);
        const calculateFontSize = () => {
            const nameLength = `${connection.faculty_first_name} ${connection.faculty_last_name}`.length;
            if (nameLength > 20) {
                setFontSize(Math.max(16, 18 - (nameLength - 20) / 2));
            } else {
                setFontSize(20);
            }
        };

        calculateFontSize();
    }, []);

    const enterProfile = () => {
        console.log("Entering profile");
        getUser(connection.faculty_email);
        navigate('/assistant/home');
    }

    return (
        <div className="bg-base-100 p-3 shadow-glow rounded-lg w-72">
            <div className="flex flex-col justify-center">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="card-title" style={{ fontSize: `${fontSize}px` }} title={`${connection.faculty_first_name} ${connection.faculty_last_name}`}>
                        {truncateString(`${connection.faculty_first_name} ${connection.faculty_last_name}`, truncationLength)}
                        </h3>
                        <p className="truncate">{connection.faculty_email}</p>
                    </div>
                    {connection.status === "confirmed" && (
                      <div className="flex justify-between w-full mt-2">
                          <button onClick={enterProfile} className="text-white btn btn-primary min-h-0 h-6 leading-tight">
                            Manage
                          </button>
                      </div>
                    )}
                </div>
                
            </div>
            <div className="card-actions">
                {connection.status === "pending" && (
                    <div className="flex justify-between w-full mt-2">
                        <button className="text-white btn btn-info min-h-0 h-6 leading-tight">
                            Pending
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssociatedConnection;