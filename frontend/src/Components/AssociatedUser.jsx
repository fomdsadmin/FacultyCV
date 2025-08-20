import React, { useState, useEffect } from "react";
import { TiDelete } from "react-icons/ti";
import { updateUserConnection, deleteUserConnection } from '../graphql/graphqlHelpers.js';
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";


const AssociatedUser = ({ connection, getAllUserConnections }) => {
    const [fontSize, setFontSize] = useState(20);
    const [clickedRemove, setClickRemoved] = useState(false);
    const [truncationLength, setTruncationLength] = useState(25);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    const { logAction } = useAuditLogger();

    const truncateString = (str, num) => {
        if (str.length <= num) {
            return str;
        }
        return str.slice(0, num) + '...';
    };

    useEffect(() => {
        
        const calculateFontSize = () => {
            const nameLength = `${connection.assistant_first_name} ${connection.assistant_last_name}`.length;
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
            await logAction(AUDIT_ACTIONS.DELETE_CONNECTION, connection.faculty_email);
        } catch (error) {
            console.error('Error:', error);
        }
        setIsRemoving(false);
        getAllUserConnections();
    }

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            const response = await updateUserConnection(connection.user_connection_id, 'confirmed');
            await logAction(AUDIT_ACTIONS.ACCEPT_CONNECTION, connection.faculty_email);
        } catch (error) {
            console.error('Error:', error);
        }
        setIsAccepting(false);
        getAllUserConnections();
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Header with Avatar and Status */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            {/* Use a generic user icon or initials if desired */}
                            <span className="text-gray-500 text-sm font-bold">{connection.assistant_first_name[0]}</span>
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate" title={`${connection.assistant_first_name} ${connection.assistant_last_name}`}>
                            {connection.assistant_first_name} {connection.assistant_last_name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate" title={connection.assistant_email}>
                            {connection.assistant_email}
                        </p>
                    </div>
                </div>
                {/* Only show status badge for pending */}
                {connection.status === "pending" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                    </span>
                )}
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2">
                {connection.status === "confirmed" && !clickedRemove && (
                    <button
                        onClick={handleRemoveClick}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:bg-red-25 disabled:text-red-400 rounded-md transition-colors duration-200"
                        title="Remove connection"
                    >
                        <TiDelete className="text-xs" />
                        Remove
                    </button>
                )}
                {connection.status === "confirmed" && clickedRemove && (
                    <div className="flex flex-col space-y-1">
                        <button onClick={handleCancel} className="text-white btn btn-primary min-h-0 h-6 leading-tight">Cancel</button>
                        <button onClick={handleRemoveConfirm} className="text-white btn btn-warning min-h-0 h-6 ml-auto leading-tight" disabled={isRemoving}>
                            {isRemoving ? 'Removing...' : 'Remove'}
                        </button>
                    </div>
                )}
                {/* Pending actions */}
                {connection.status === "pending" && (
                    <>
                        <button onClick={handleRemoveConfirm} className="text-white btn btn-warning min-h-0 h-6 leading-tight" disabled={isRemoving}>
                            {isRemoving ? 'Declining...' : 'Decline'}
                        </button>
                        <button onClick={handleAccept} className="text-white btn btn-success min-h-0 h-6 leading-tight" disabled={isAccepting}>
                            {isAccepting ? 'Accepting...' : 'Accept'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AssociatedUser;
