import { useState } from "react"
import { useApp } from "../../../../Contexts/AppContext"
import { toast } from "react-toastify"
import { getOrcidSections } from "../../../../graphql/graphqlHelpers"
import ImportWarningDialog from "../ImportWarningDialog"

const OrcidBioImportButton = () => {
    const { userInfo, setUserInfo } = useApp()
    const [showBioWarningDialog, setShowBioWarningDialog] = useState(false)

    const handleImportBio = () => {
        if (!userInfo.orcid_id) {
            toast.warning("Please enter ORCID ID before fetching bio.")
        } else {
            setShowBioWarningDialog(true)
        }
    }

    const getBio = async () => {
        try {
            const bio = await getOrcidSections(userInfo.orcid_id, "biography")
            if (bio && bio.bio) {
                setUserInfo((prevUserInfo) => ({
                    ...prevUserInfo,
                    bio: bio.bio,
                }))
                toast.success("Bio imported successfully!", { autoClose: 3000 })
            } else {
                toast.error("Failed to fetch the bio from ORCID.", { autoClose: 3000 })
            }
        } catch (error) {
            toast.error("An error occurred while fetching the bio.", { autoClose: 3000 })
        }
    }

    const handleConfirmImport = () => {
        setShowBioWarningDialog(false)
        getBio()
    }

    const handleCloseDialog = () => {
        setShowBioWarningDialog(false)
    }

    return (
        <>
            <button type="button" className="btn btn-sm btn-primary text-white mt-2" onClick={handleImportBio}>
                Import Bio from ORCID
            </button>
            <ImportWarningDialog
                isOpen={showBioWarningDialog}
                onClose={handleCloseDialog}
                onConfirm={handleConfirmImport}
                warning={"Importing bio from ORCID will overwrite your existing bio. Do you want to continue?"}
            />
        </>
    )
}

export default OrcidBioImportButton
