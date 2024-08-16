import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserConnections } from "../graphql/graphqlHelpers.js";
import { get } from "aws-amplify/api";

const AssociatedConnection = ({ connection, getUser }) => {
    const [fontSize, setFontSize] = useState(20);
    const [truncationLength, setTruncationLength] = useState(25);
    const [enteringProfile, setEnteringProfile] = useState(false);

    const navigate = useNavigate();
    
    const truncateString = (str, num) => {
        if (str.length <= num) {
            return str;
        }
        return str.slice(0, num) + '...';
    };

    useEffect(() => {
        
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

    const enterProfile = async () => {
        setEnteringProfile(true);
        try {
            const retrievedUserConnections = await getUserConnections(connection.assistant_user_id, false);
            // check if there is an object in retrievedUserConnections with the connection.faculty_user_id and that object.status is confirmed
            const connectionExists = retrievedUserConnections.some((conn) => conn.faculty_user_id === connection.faculty_user_id && conn.status === "confirmed");
            if (connectionExists) {
                
                getUser(connection.faculty_email);
                navigate('/assistant/home');
            } else{
                console.error('Error: Connection does not exist');
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setEnteringProfile(false);
    }

    return (
        <div className={`bg-base-100 p-3 shadow-glow rounded-lg ${enteringProfile ? 'w-90' : 'w-72'}`}>
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
                          <button onClick={enterProfile} disabled={enteringProfile} className="text-white btn btn-primary min-h-0 h-6 leading-tight">
                            {enteringProfile ? "Entering Profile..." : "Manage"}
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