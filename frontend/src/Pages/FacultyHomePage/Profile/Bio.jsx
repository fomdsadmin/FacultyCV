import { useState } from "react"
import { useFaculty } from "../FacultyContext"
import { toast } from "react-toastify"
import { useApp } from "../../../Contexts/AppContext"
import ImportWarningDialog from "./ImportWarningDialog"

const Bio = () => {
  const { getBio, setChange } = useFaculty()
  const { setUserInfo, userInfo } = useApp()
  const [showBioWarningDialog, setShowBioWarningDialog] = useState(false)

  const handleImportBio = () => {
    if (!userInfo.orcid_id) {
      toast.warning("Please enter ORCID ID before fetching bio.")
    } else {
      setShowBioWarningDialog(true)
    }
  }

  const handleConfirmImport = () => {
    setShowBioWarningDialog(false)
    getBio()
  }

  const handleCloseDialog = () => {
    setShowBioWarningDialog(false)
  }

  const handleBioChange = (e) => {
    setUserInfo((prevUserInfo) => ({ ...prevUserInfo, bio: e.target.value }))
    setChange(true)
  }

  return (
    <div>
      <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Bio</h2>
      <div className="col-span-1 sm:col-span-2 md:col-span-4">
        <textarea
          id="bio"
          name="bio"
          maxLength={3000}
          value={userInfo.bio || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          onChange={handleBioChange}
        />

        <button type="button" className="btn btn-sm btn-primary text-white mt-2" onClick={handleImportBio}>
          Import Bio from ORCID
        </button>
      </div>

      <ImportWarningDialog isOpen={showBioWarningDialog} onClose={handleCloseDialog} onConfirm={handleConfirmImport} warning={"Importing bio from ORCID will overwrite your existing bio. Do you want to continue?"} />
    </div>
  )
}

export default Bio
