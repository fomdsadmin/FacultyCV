"use client"

import { useState } from "react"
import { useApp } from "../../../../../Contexts/AppContext"
import ModalStylingWrapper from "../../../../../SharedComponents/ModalStylingWrapper"
import { toast } from "react-toastify";

function isAllNumbers(str) {
    return /^\d+$/.test(str);
}

const ManualScopusModal = ({ isOpen, onClose }) => {
    const { setUserInfo } = useApp()
    const [manualScopusId, setManualScopusId] = useState("")

    const handleManualScopusLink = () => {
        if (!manualScopusId.trim()) return

        if (!isAllNumbers(manualScopusId.trim())) {
            toast.success("Scopus ID must be a numeric value", { autoClose: 3000 })
            setManualScopusId("");
            return;
        }

        setUserInfo((prev) => ({
            ...prev,
            scopus_id: manualScopusId.trim()
        }))

        setManualScopusId("")
        onClose()
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
