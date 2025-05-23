"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { useFaculty } from "../../FacultyContext"

const Keywords = () => {
  const { userInfo, setUserInfo, orcidId, getKeywords, setChange } = useFaculty()
  const [showKeywordsWarningDialog, setShowKeywordsWarningDialog] = useState(false)

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
          onChange={(e) => {
            setUserInfo((prevUserInfo) => ({ ...prevUserInfo, keywords: e.target.value }))
            setChange(true)
          }}
        ></textarea>

        <button
          type="button"
          className="btn btn-sm btn-primary text-white mt-2"
          onClick={() => {
            if (!orcidId) {
              toast.warning("Please enter ORCID ID before fetching keywords.")
            } else {
              setShowKeywordsWarningDialog(true)
            }
          }}
        >
          Import Keywords from ORCID
        </button>
      </div>

      {showKeywordsWarningDialog && (
        <dialog className="modal-dialog" open>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            onClick={() => setShowKeywordsWarningDialog(false)}
          >
            ✕
          </button>
          <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
            <p className="text-center text-lg font-bold text-zinc-600">
              Importing keywords from ORCID will overwrite your existing keywords. Do you want to continue?
            </p>
            <div className="flex space-x-4 mt-4">
              <button
                type="button"
                className="btn btn-success text-white"
                onClick={() => {
                  setShowKeywordsWarningDialog(false)
                  getKeywords()
                }}
              >
                Yes
              </button>
              <button
                type="button"
                className="btn btn-secondary text-white"
                onClick={() => setShowKeywordsWarningDialog(false)}
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

export default Keywords
