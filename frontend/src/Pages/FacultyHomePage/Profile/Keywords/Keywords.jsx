import { useApp } from "../../../../Contexts/AppContext"
import OrcidKeywordsImportButton from "./OrcidKeywordImportButton"

const Keywords = () => {
  const { userInfo, setUserInfo } = useApp()

  const handleKeywordsChange = (e) => {
    setUserInfo((prevUserInfo) => ({ ...prevUserInfo, keywords: e.target.value }))
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
        <OrcidKeywordsImportButton />
      </div>
    </div>
  )
}

export default Keywords
