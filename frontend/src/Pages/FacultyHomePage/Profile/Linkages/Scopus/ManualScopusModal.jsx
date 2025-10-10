"use client"

import { useState } from "react"
import { useApp } from "../../../../../Contexts/AppContext"
import { updateUser } from "../../../../../graphql/graphqlHelpers"
import ModalStylingWrapper from "../../../../../SharedComponents/ModalStylingWrapper"
import { toast } from "react-toastify";

function isAllNumbers(str) {
    return /^\d+$/.test(str);
}

const ManualScopusModal = ({ isOpen, onClose, user, setUser, isAdmin, fetchAllUsers }) => {
    const { userInfo, setUserInfo } = useApp()
    const [manualScopusId, setManualScopusId] = useState("")

    // Use correct user object based on isAdmin
    const currentUser = isAdmin ? user : userInfo;

    const handleManualScopusLink = async () => {
        if (!manualScopusId.trim()) return

        if (!isAllNumbers(manualScopusId.trim())) {
            toast.error("Scopus ID must be a numeric value", { autoClose: 3000 })
            setManualScopusId("");
            return;
        }

        try {
            // Handle multiple Scopus IDs
            const newScopusId = manualScopusId.trim();
            const existingScopusIds = currentUser.scopus_id ? currentUser.scopus_id.split(",").map(id => id.trim()) : [];
            
            // Check if this ID already exists
            if (existingScopusIds.includes(newScopusId)) {
                toast.warning("This Scopus ID already exists!", { autoClose: 3000 });
                setManualScopusId("");
                return;
            }
            
            // Combine existing and new IDs
            const updatedScopusIds = existingScopusIds.length > 0 
                ? [...existingScopusIds, newScopusId].join(",")
                : newScopusId;

            if (isAdmin) {
                // Update via GraphQL for admin
                const sanitizeInput = (input) => {
                    if (!input) return "";
                    return input
                        .replace(/\\/g, "\\\\") // escape backslashes
                        .replace(/"/g, '\\"') // escape double quotes
                        .replace(/\n/g, "\\n"); // escape newlines
                };

                await updateUser(
                    currentUser.user_id,
                    currentUser.first_name,
                    currentUser.last_name,
                    currentUser.preferred_name,
                    currentUser.email,
                    currentUser.role,
                    sanitizeInput(currentUser.bio),
                    currentUser.institution,
                    currentUser.primary_department,
                    currentUser.primary_faculty,
                    currentUser.campus,
                    currentUser.keywords,
                    currentUser.institution_user_id,
                    updatedScopusIds, // Update Scopus ID with combined IDs
                    currentUser.orcid_id
                );

                // Update the local user state
                if (setUser) {
                    setUser(prev => ({
                        ...prev,
                        scopus_id: updatedScopusIds
                    }));
                }

                toast.success("Scopus ID added successfully!", { autoClose: 3000 });
                console.log("Scopus ID updated successfully");
                
                // Refresh the users list in admin context
                if (fetchAllUsers) {
                    await fetchAllUsers();
                }
            } else {
                // Update local state for regular user
                setUserInfo((prev) => ({
                    ...prev,
                    scopus_id: updatedScopusIds
                }))
                toast.success("Scopus ID added successfully!", { autoClose: 3000 });
            }

            setManualScopusId("")
            onClose()
        } catch (error) {
            console.error("Error updating Scopus ID:", error);
            toast.error("Failed to add Scopus ID. Please try again.", { autoClose: 3000 });
        }
    }

    if (!isOpen) return null

    return (
        <ModalStylingWrapper>
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-2xl">Enter Scopus ID Manually</h2>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <input
                        type="text"
                        value={manualScopusId}
                        onChange={(e) => setManualScopusId(e.target.value)}
                        className="input input-bordered w-full"
                        placeholder="Enter Scopus ID"
                    />

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={handleManualScopusLink}
                            className="btn btn-primary text-white"
                            disabled={!manualScopusId.trim()}
                        >
                            Add Scopus ID
                        </button>
                    </div>
                </div>
            </div>
        </ModalStylingWrapper>
    )
}

export default ManualScopusModal
