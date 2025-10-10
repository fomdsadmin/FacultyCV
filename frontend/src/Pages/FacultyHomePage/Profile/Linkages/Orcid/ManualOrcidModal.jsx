"use client"

import React, { useState } from "react"
import { useApp } from "../../../../../Contexts/AppContext"
import { updateUser } from "../../../../../graphql/graphqlHelpers"
import ModalStylingWrapper from "../../../../../SharedComponents/ModalStylingWrapper"
import { toast } from "react-toastify";

function isValidOrcidFormat(orcidId) {
    // ORCID format: 0000-0000-0000-000X (4 groups of 4 characters separated by hyphens, last character can be X)
    const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
    return orcidPattern.test(orcidId);
}

const ManualOrcidModal = ({ isOpen, onClose, user, setUser, isAdmin, fetchAllUsers }) => {
    const { userInfo, setUserInfo } = useApp()
    const [manualOrcidId, setManualOrcidId] = useState("")

    // Use correct user object based on isAdmin
    const currentUser = isAdmin ? user : userInfo;

    const formatOrcidInput = (value) => {
        // Remove all characters except digits and X
        const validChars = value.replace(/[^\dX]/gi, '').toUpperCase();
        
        // Limit to 16 characters (15 digits + 1 possible X at the end)
        const limited = validChars.slice(0, 16);
        
        // Add hyphens after every 4 characters
        const formatted = limited.replace(/(.{4})(?=.)/g, '$1-');
        
        return formatted;
    };

    const handleInputChange = (e) => {
        const formatted = formatOrcidInput(e.target.value);
        setManualOrcidId(formatted);
    };

    const handleManualOrcidLink = async () => {
        if (!manualOrcidId.trim()) return

        const trimmedOrcidId = manualOrcidId.trim();

        if (!isValidOrcidFormat(trimmedOrcidId)) {
            toast.error("ORCID ID must be in format: 0000-0000-0000-000X (last character can be a digit or X)", { autoClose: 3000 });
            setManualOrcidId("");
            return;
        }

        try {
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
                    currentUser.scopus_id,
                    trimmedOrcidId // Update ORCID ID
                );

                // Update the local user state
                if (setUser) {
                    setUser(prev => ({
                        ...prev,
                        orcid_id: trimmedOrcidId
                    }));
                }

                toast.success("ORCID ID added successfully!", { autoClose: 3000 });
                console.log("ORCID ID updated successfully");
                
                // Refresh the users list in admin context
                if (fetchAllUsers) {
                    await fetchAllUsers();
                }
            } else {
                // Update local state for regular user
                setUserInfo((prev) => ({
                    ...prev,
                    orcid_id: trimmedOrcidId,
                }))
                toast.success("ORCID ID added successfully!", { autoClose: 3000 });
            }

            setManualOrcidId("")
            onClose()
        } catch (error) {
            console.error("Error updating ORCID ID:", error);
            toast.error("Failed to add ORCID ID. Please try again.", { autoClose: 3000 });
        }
    }

    if (!isOpen) return null

    return (
        <ModalStylingWrapper>
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-2xl">Enter ORCID ID Manually</h2>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <input
                        type="text"
                        value={manualOrcidId}
                        onChange={handleInputChange}
                        className="input input-bordered w-full"
                        placeholder="0000-0003-2193-178X"
                        maxLength={19} // 15 digits + 1 X + 3 hyphens
                    />

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={handleManualOrcidLink}
                            className="btn btn-primary text-white"
                            disabled={!manualOrcidId.trim()}
                        >
                            Add ORCID ID
                        </button>
                    </div>
                </div>
            </div>
        </ModalStylingWrapper>
    )
}

export default ManualOrcidModal
