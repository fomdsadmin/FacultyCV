"use client"

import React, { useState, useRef } from "react"
import { useApp } from "../../../../../Contexts/AppContext"
import ModalStylingWrapper from "../../../../../SharedComponents/ModalStylingWrapper"
import { toast } from "react-toastify";

function isAllNumbers(str) {
    return /^\d+$/.test(str);
}

const ManualOrcidModal = ({ isOpen, onClose }) => {
    const { setUserInfo } = useApp()
    const [manualOrcidId, setManualOrcidId] = useState(["", "", "", ""])
    const orcidRefs = [useRef(), useRef(), useRef(), useRef()]

    const handleOrcidInputChange = (index, value) => {
        if (value.length <= 4) {
            const newOrcid = [...manualOrcidId]
            newOrcid[index] = value
            setManualOrcidId(newOrcid)

            // Move to the next input if 4 characters are entered
            if (value.length === 4 && index < orcidRefs.length - 1) {
                orcidRefs[index + 1].current.focus()
            }
        }
    }

    const handleManualOrcidLink = () => {

        const isNumeric = manualOrcidId.every((idSegment) => isAllNumbers(idSegment));

        if (!isNumeric) {
            toast.warning("Orcid only contains numeric values!", { autoClose: 3000 });
            setManualOrcidId(["", "", "", ""])
            return;
        }

        const fullOrcid = manualOrcidId.join("-")
        setUserInfo((prev) => ({
            ...prev,
            orcid_id: fullOrcid,
        }))

        setManualOrcidId(["", "", "", ""])
        onClose()
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
                    <div className="flex space-x-2">
                        {manualOrcidId.map((segment, index) => (
                            <React.Fragment key={index}>
                                <input
                                    ref={orcidRefs[index]}
                                    type="text"
                                    value={segment}
                                    onChange={(e) => handleOrcidInputChange(index, e.target.value)}
                                    className="input input-bordered w-1/5 text-center"
                                    placeholder="____"
                                    maxLength={4}
                                />
                                {index < manualOrcidId.length - 1 && <span className="mx-1">-</span>}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={handleManualOrcidLink}
                            className="btn btn-primary text-white"
                            disabled={manualOrcidId.some((segment) => segment.length !== 4)}
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
