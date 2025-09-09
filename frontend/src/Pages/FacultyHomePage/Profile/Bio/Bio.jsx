import { useApp } from "../../../../Contexts/AppContext";
import AiBioImportButton from "./AiBioImportButton";
import OrcidBioImportButton from "./OrcidBioImportButton";
import InfoCard from "../../../../Components/InfoCard/InfoCard";

const Bio = () => {
  const { userInfo, setUserInfo } = useApp();

  const handleNullValues = (value) => {
    if (value === null || value === undefined || value === "null" || value === "undefined") {
      return "";
    }
    return value;
  };

  const handleBioChange = (e) => {
    setUserInfo((prevUserInfo) => ({ ...prevUserInfo, bio: e.target.value }));
  };

  const helpText =
    "Your bio section provides a professional summary of your background, expertise, and accomplishments. This will appear prominently on your CV and should highlight your key qualifications and achievements.";

  const characterCount = userInfo.bio ? userInfo.bio.length : 0;
  const maxLength = 3000;

  return (
    <InfoCard title="Professional Bio" helpText={helpText} className="h-fit" showHelpIcon={false}>
      <div className="space-y-4">
        <div className="relative">
          <textarea
            id="bio"
            name="bio"
            maxLength={maxLength}
            rows={7}
            value={handleNullValues(userInfo.bio) || ""}
            className="w-full rounded-lg text-sm px-4 py-3 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-y placeholder-gray-400"
            onChange={handleBioChange}
            placeholder="Highlight your expertise, achievements, and career focus..."
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {characterCount}/{maxLength}
          </div>
        </div>

        <div className="border-t border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-2">
            <OrcidBioImportButton />
            <AiBioImportButton />
          </div>
        </div>
      </div>
    </InfoCard>
  );
};

export default Bio;
