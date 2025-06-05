import { useState } from "react"
import { toast } from "react-toastify"
import { useApp } from "../../../../Contexts/AppContext"
import { getOrcidSections } from "../../../../graphql/graphqlHelpers"
import ImportWarningModal from "../ImportWarningModal"

const OrcidKeywordsImportButton = () => {
  const { userInfo, setUserInfo } = useApp()
  const [showKeywordsWarningDialog, setShowKeywordsWarningDialog] = useState(false)

  const handleImportKeywords = () => {
    if (!userInfo.orcid_id) {
      toast.warning("Please enter ORCID ID before fetching keywords.")
    } else {
      setShowKeywordsWarningDialog(true)
    }
  }

  const getKeywords = async () => {
    try {
      const keywords_output = await getOrcidSections(userInfo.orcid_id, "keywords")
      if (keywords_output && keywords_output.keywords) {
        setUserInfo((prevUserInfo) => ({
          ...prevUserInfo,
          keywords: keywords_output.keywords,
        }))
        toast.success("Keywords imported successfully!", { autoClose: 3000 })
      } else {
        toast.error("Failed to fetch the keywords from ORCID.", { autoClose: 3000 })
      }
    } catch (error) {
      toast.error("An error occurred while fetching the keywords.", { autoClose: 3000 })
    }
  }

  const handleConfirmImport = () => {
    setShowKeywordsWarningDialog(false)
    getKeywords()
  }

  const handleCloseDialog = () => {
    setShowKeywordsWarningDialog(false)
  }

  return (
    <>
      <button type="button" className="btn btn-sm btn-primary text-white mt-2" onClick={handleImportKeywords}>
        Import Keywords from ORCID
      </button>
      <ImportWarningModal
        isOpen={showKeywordsWarningDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmImport}
        warning="Importing keywords from ORCID will overwrite your existing keywords. Do you want to continue?"
      />
    </>
  )
}

export default OrcidKeywordsImportButton
