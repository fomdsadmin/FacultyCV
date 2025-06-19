import { useApp } from "../../../../Contexts/AppContext"
import AiBioImportButton from "./AiBioImportButton"
import OrcidBioImportButton from "./OrcidBioImportButton"

const Bio = () => {
  const { userInfo, setUserInfo } = useApp();

  const handleBioChange = (e) => {
    setUserInfo((prevUserInfo) => ({ ...prevUserInfo, bio: e.target.value }));
  };

  // Calculate rows based on content
  const calculateRows = (text) => {
    if (!text) return 7; // Minimum rows

    const lines = text.split("\n").length;
    const estimatedLines = Math.ceil(text.length / 80); // Assuming ~80 chars per line
    const totalLines = Math.max(lines, estimatedLines);

    return Math.max(7, totalLines + 1); // Ensure minimum of 7 rows
  };

  return (
    <div>
      <h2 className="text-lg font-bold mt-2 mb-2 text-zinc-500">Bio</h2>
      <div className="col-span-1 sm:col-span-2 md:col-span-4">
        <textarea
          id="bio"
          name="bio"
          maxLength={3000}
          rows={calculateRows(userInfo.bio)}
          value={userInfo.bio || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300 resize-y"
          onChange={handleBioChange}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-1">
          <OrcidBioImportButton />
          <AiBioImportButton />
        </div>
      </div>
    </div>
  );
}

export default Bio
