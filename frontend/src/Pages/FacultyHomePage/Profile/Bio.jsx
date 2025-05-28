import { useState } from "react"
import { useFaculty } from "../FacultyContext"
import { toast } from "react-toastify"
import { useApp } from "../../../Contexts/AppContext"
import ImportWarningDialog from "./ImportWarningDialog"
import { getBioResponseData } from "../../../graphql/graphqlHelpers"
import { FaRobot } from "react-icons/fa";

const Bio = () => {
  const { getBio } = useFaculty()
  const { setUserInfo, userInfo } = useApp()
  const [showBioWarningDialog, setShowBioWarningDialog] = useState(false)
  const [showBioWarningDialogAi, setShowBioWarningDialogAi] = useState(false)

  const handleImportBio = () => {
    if (!userInfo.orcid_id) {
      toast.warning("Please enter ORCID ID before fetching bio.")
    } else {
      setShowBioWarningDialog(true)
    }
  }

  const handleConfirmImportAi = async () => {
    toast.success("Generating bio!", { autoClose: 3000 })
    setShowBioWarningDialogAi(false)
    const response = await getBioResponseData(userInfo.first_name + " " + userInfo.last_name);
    setUserInfo((prevUserInfo) => ({
      ...prevUserInfo,
      bio: response.answer,
    }))
    setShowBioWarningDialogAi(false)
    toast.success("Bio imported successfully!", { autoClose: 3000 })
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
        <div className="flex space-x-4">
          <button type="button" className="btn btn-sm btn-primary text-white mt-2" onClick={handleImportBio}>
            Import Bio from ORCID
          </button>
          <button type="button" className="btn btn-sm btn-info text-white mt-2" onClick={() => setShowBioWarningDialogAi(true)}>
            <FaRobot></FaRobot>
            Import Bio from AI
          </button>
        </div>
      </div>
      <ImportWarningDialog isOpen={showBioWarningDialog} onClose={handleCloseDialog} onConfirm={handleConfirmImport} warning={"Importing bio from ORCID will overwrite your existing bio. Do you want to continue?"} />
      <ImportWarningDialog isOpen={showBioWarningDialogAi} onClose={() => { setShowBioWarningDialogAi(false) }} onConfirm={handleConfirmImportAi} warning={"Importing bio with AI will overwrite your existing bio. Do you want to continue?"} />
    </div>
  )
}

export default Bio
