"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { FaRobot } from "react-icons/fa"
import { useApp } from "../../../../Contexts/AppContext"
import { getBioResponseData } from "../../../../graphql/graphqlHelpers"
import ImportWarningDialog from "../ImportWarningDialog"

const AIBioImportButton = () => {
    const { userInfo, setUserInfo } = useApp()
    const [showBioWarningDialogAi, setShowBioWarningDialogAi] = useState(false)

    const handleAIBioImport = () => {
        setShowBioWarningDialogAi(true)
    }

    const handleConfirmImportAi = async () => {
        toast.success("Generating bio!", { autoClose: 3000 })
        setShowBioWarningDialogAi(false)

        try {
            const response = await getBioResponseData(userInfo.first_name + " " + userInfo.last_name)
            setUserInfo((prevUserInfo) => ({
                ...prevUserInfo,
                bio: response.answer,
            }))
            toast.success("Bio imported successfully!", { autoClose: 3000 })
        } catch (error) {
            toast.error("An error occurred while generating the bio.", { autoClose: 3000 })
        }
    }

    const handleCloseDialog = () => {
        setShowBioWarningDialogAi(false)
    }

    return (
        <>
            <button type="button" className="btn btn-sm btn-info text-white mt-2" onClick={handleAIBioImport}>
                <FaRobot />
                Import Bio from AI
            </button>
            <ImportWarningDialog
                isOpen={showBioWarningDialogAi}
                onClose={handleCloseDialog}
                onConfirm={handleConfirmImportAi}
                warning={"Importing bio with AI will overwrite your existing bio. Do you want to continue?"}
            />
        </>
    )
}

export default AIBioImportButton
