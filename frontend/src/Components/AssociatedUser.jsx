import React, { useState, useEffect } from "react";
import { TiDelete } from "react-icons/ti";
import { updateUserConnection, deleteUserConnection } from '../graphql/graphqlHelpers.js';


const AssociatedUser = ({ connection, getAllUserConnections }) => {
    const [fontSize, setFontSize] = useState(20);
    const [clickedRemove, setClickRemoved] = useState(false);
    const [truncationLength, setTruncationLength] = useState(25);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    const truncateString = (str, num) => {
        if (str.length <= num) {
            return str;
        }
        return str.slice(0, num) + '...';
    };

    useEffect(() => {
        console.log("connection", connection);
        const calculateFontSize = () => {
            const nameLength = `${connection.user_connection.first_name} ${connection.user_connection.last_name}`.length;
            if (nameLength > 20) {
                setFontSize(Math.max(16, 18 - (nameLength - 20) / 2));
            } else {
                setFontSize(20);
            }
        };

        calculateFontSize();
    }, []);

    const handleRemoveClick = () => {
        setClickRemoved(true);
        setTruncationLength(15); 
    }

    const handleCancel = () => {
        setClickRemoved(false);
        setTruncationLength(25); 
    }

    const handleRemoveConfirm = async () => {
        setIsRemoving(true);
        // handle an actual removal here
        try {
            const response = await deleteUserConnection(connection.user_connection_id);
            console.log("Removed", response);
        } catch (error) {
            console.error('Error:', error);
        }
        setIsRemoving(false);
        getAllUserConnections();
    }

    const handleAccept = async () => {
        setIsAccepting(true);
        // handle accepting invite here
        const updatedConnection = {
            ...connection,
            user_connection: {
                ...connection.user_connection,
                status: "confirmed"
            }
        };
        const updatedConnectionString = JSON.stringify(updatedConnection.user_connection).replace(/"/g, '\\"');
        try {
            const response = await updateUserConnection(connection.user_connection_id, `${updatedConnectionString}`);
            console.log("Updated", response);
        } catch (error) {
            console.error('Error:', error);
        }
        setIsAccepting(false);
        getAllUserConnections();
    }

    return (
        <div className="bg-base-100 p-3 shadow-glow rounded-lg w-72">
            <div className="flex flex-col justify-center">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="card-title" style={{ fontSize: `${fontSize}px` }} title={`${connection.user_connection.first_name} ${connection.user_connection.last_name}`}>
                        {truncateString(`${connection.user_connection.first_name} ${connection.user_connection.last_name}`, truncationLength)}
                        </h3>
                        <p className="truncate">{connection.user_connection.email}</p>
                    </div>
                    {!clickedRemove && connection.user_connection.status === "confirmed" && <button onClick={handleRemoveClick}><TiDelete className="text-error w-6 h-6 m-0" /></button>}
                    {clickedRemove && connection.user_connection.status === "confirmed" && (
                    <div className="flex flex-col space-y-1">
                        <button onClick={handleCancel} className="text-white btn btn-primary min-h-0 h-6 leading-tight">Cancel</button>
                        <button onClick={handleRemoveConfirm} className="text-white btn btn-warning min-h-0 h-6 ml-auto leading-tight" disabled={isRemoving}>
                            {isRemoving ? 'Removing...' : 'Remove'}
                        </button>
                    </div>
                )}
                </div>
                
            </div>
            <div className="card-actions">
                {connection.user_connection.status === "pending" && (
                    <div className="flex justify-between w-full mt-2">
                        <button onClick={handleRemoveConfirm} className="text-white btn btn-warning min-h-0 h-6 leading-tight" disabled={isRemoving}>
                            {isRemoving ? 'Declining...' : 'Decline'}
                        </button>
                        <button onClick={handleAccept} className="text-white btn btn-success min-h-0 h-6 leading-tight" disabled={isAccepting}>
                            {isAccepting ? 'Accepting...' : 'Accept'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssociatedUser;
