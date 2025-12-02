import { useGenericSection } from "../GenericSectionContext";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";

const SectionHeader = () => {
  const { section, onBack, handleNew, fieldData, handleRemoveAll, notification } = useGenericSection();
  let availableData = false;
  if (fieldData.length != 0) {
    availableData = true;
  }

  const [titleWithoutSectionNumbers, setTitleWithoutSectionNumbers] = useState("");

  useEffect(() => {
    if (section?.title?.includes(".")) {
      const indexOfLastPeriod = section?.title?.lastIndexOf('.')
      const title = section?.title?.slice(indexOfLastPeriod + 1);
      setTitleWithoutSectionNumbers(title);
    } else if (section?.title) {
      setTitleWithoutSectionNumbers(section.title);
    }
  }, [section?.title])

  return (
    <>
      <div className="ml-2 mr-4 my-2 flex items-center justify-between">
        {/* Left section: Back Button and Title */}
        <div className="flex items-center">
          <button onClick={onBack} className="text-zinc-800 btn btn-ghost min-h-0 h-10 p-2 mr-3 hover:bg-gray-100">
            <FaArrowLeft className="h-5 w-5 text-zinc-800" />
          </button>
          <h2 className="text-3xl font-bold text-zinc-600">{titleWithoutSectionNumbers}</h2>
        </div>

        {/* Right section: Action Buttons */}
        <div className="flex items-center gap-3">
          <button onClick={handleNew} className="text-white btn btn-success min-h-0 h-10 px-4 leading-tight">
            New
          </button>
          <button
            onClick={handleRemoveAll}
            className="text-white btn btn-warning min-h-0 h-10 px-4 leading-tight"
            disabled={!availableData}
          >
            Remove All
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-8 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg transition-all">
            {notification}
          </div>
        )}
      </div>
    </>
  );
};

export default SectionHeader;
