"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { useFaculty } from "../FacultyContext"
import { useApp } from "../../../Contexts/AppContext"
import ImportWarningDialog from "./ImportWarningDialog"
const Keywords = () => {
  const { getKeywords, setChange } = useFaculty()
  const { setUserInfo, userInfo } = useApp()
  const [showKeywordsWarningDialog, setShowKeywordsWarningDialog] = useState(false)

  const handleImportKeywords = () => {
    if (!userInfo.orcid_id) {
      toast.warning("Please enter ORCID ID before fetching keywords.")
    } else {
      setShowKeywordsWarningDialog(true)
    }
  }

  const handleConfirmImport = () => {
    setShowKeywordsWarningDialog(false)
    getKeywords()
  }

  const handleCloseDialog = () => {
    setShowKeywordsWarningDialog(false)
  }

  const handleKeywordsChange = (e) => {
    setUserInfo((prevUserInfo) => ({ ...prevUserInfo, keywords: e.target.value }))
    setChange(true)
  }

  return (
    <div>
      <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Keywords</h2>
      <div className="col-span-1 sm:col-span-2 md:col-span-4">
        <textarea
          id="keywords"
          name="keywords"
          maxLength={1000}
          value={userInfo.keywords || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          placeholder="Add keywords separated by commas"
          onChange={handleKeywordsChange}
        />

        <button type="button" className="btn btn-sm btn-primary text-white mt-2" onClick={handleImportKeywords}>
          Import Keywords from ORCID
        </button>
      </div>

      <ImportWarningDialog
        isOpen={showKeywordsWarningDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmImport}
        warning="Importing keywords from ORCID will overwrite your existing keywords. Do you want to continue?"
      />
    </div>
  )
}

export default Keywords
