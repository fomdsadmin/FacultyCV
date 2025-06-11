import { useApp } from "../../../../Contexts/AppContext"
import AiBioImportButton from "./AiBioImportButton"
import OrcidBioImportButton from "./OrcidBioImportButton"

const Bio = () => {
  const { userInfo, setUserInfo } = useApp()

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
          rows={5}
          value={userInfo.bio || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          onChange={handleBioChange}
        />
        <div className="flex space-x-4">
          <OrcidBioImportButton />
          <AiBioImportButton />
        </div>
      </div>
    </div>
  );
}

export default Bio
