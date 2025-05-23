"use client"

import { useState } from "react"
import { useFaculty } from "../../FacultyContext"
import { toast } from "react-toastify"

const Bio = () => {
  const { userInfo, setUserInfo, orcidId, getBio, setChange } = useFaculty()
  const [showBioWarningDialog, setShowBioWarningDialog] = useState(false)

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
          onChange={(e) => {
            setUserInfo((prevUserInfo) => ({ ...prevUserInfo, bio: e.target.value }))
            setChange(true)
          }}
        ></textarea>

        <button
          type="button"
          className="btn btn-sm btn-primary text-white mt-2"
          onClick={() => {
            if (!orcidId) {
              toast.warning("Please enter ORCID ID before fetching bio.")
            } else {
              setShowBioWarningDialog(true)
            }
          }}
        >
          Import Bio from ORCID
        </button>
      </div>

      {showBioWarningDialog && (
        <dialog className="modal-dialog" open>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            onClick={() => setShowBioWarningDialog(false)}
          >
            ✕
          </button>
          <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
            <p className="text-center text-lg font-bold text-zinc-600">
              Importing bio from ORCID will overwrite your existing bio. Do you want to continue?
            </p>
            <div className="flex space-x-4 mt-4">
              <button
                type="button"
                className="btn btn-success text-white"
                onClick={() => {
                  setShowBioWarningDialog(false)
                  getBio()
                }}
              >
                Yes
              </button>
              <button
                type="button"
                className="btn btn-secondary text-white"
                onClick={() => setShowBioWarningDialog(false)}
              >
                No
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}

export default Bio
