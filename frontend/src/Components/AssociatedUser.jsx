import React, { useState, useEffect } from "react";
import { TiDelete } from "react-icons/ti";

const AssociatedUser = ({ assistant }) => {
    const [fontSize, setFontSize] = useState(20);
    const [clickedRemove, setClickRemoved] = useState(false);
    const [truncationLength, setTruncationLength] = useState(25);

    const truncateString = (str, num) => {
        if (str.length <= num) {
            return str;
        }
        return str.slice(0, num) + '...';
    };

    useEffect(() => {
        const calculateFontSize = () => {
            const nameLength = `${assistant.firstName} ${assistant.lastName}`.length;
            if (nameLength > 20) {
                setFontSize(Math.max(16, 18 - (nameLength - 20) / 2));
            } else {
                setFontSize(20);
            }
        };

        calculateFontSize();
    }, [assistant.firstName, assistant.lastName]);

    const handleRemoveClick = () => {
        setClickRemoved(true);
        setTruncationLength(15); 
    }

    const handleCancel = () => {
        setClickRemoved(false);
        setTruncationLength(25); 
    }

    const handleRemoveConfirm = () => {
        console.log("removed");
        // handle an actual removal here
    }

    const handleAccept = () => {
        console.log("accepted");
        // handle accepting invite here
    }

    const handleReject = () => {
        console.log("rejected");
        // handle rejecting invite here
    }

    return (
        <div className="bg-base-100 p-3 shadow-glow rounded-lg w-72">
            <div className="flex flex-col justify-center">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="card-title" style={{ fontSize: `${fontSize}px` }} title={`${assistant.firstName} ${assistant.lastName}`}>
                        {truncateString(`${assistant.firstName} ${assistant.lastName}`, truncationLength)}
                        </h3>
                        <p className="truncate">{assistant.department}</p>
                    </div>
                    {!clickedRemove && assistant.status === "confirmed" && <button onClick={handleRemoveClick}><TiDelete className="text-error w-6 h-6 m-0" /></button>}
                    {clickedRemove && assistant.status === "confirmed" && (
                    <div className="flex flex-col space-y-1">
                        <button onClick={handleCancel} className="text-white btn btn-primary min-h-0 h-6 leading-tight">Cancel</button>
                        <button onClick={handleRemoveConfirm} className="text-white btn btn-warning min-h-0 h-6 ml-auto leading-tight">Remove</button>
                    </div>
                )}
                </div>
                
            </div>
            <div className="card-actions">
                {assistant.status === "pending" && (
                    <div className="flex justify-between w-full mt-2">
                        <button onClick={handleReject} className="text-white btn btn-warning min-h-0 h-6 leading-tight">Reject</button>
                        <button onClick={handleAccept} className="text-white btn btn-success min-h-0 h-6 leading-tight mb-1">Accept</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssociatedUser;
