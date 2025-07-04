import BackButton from "./BackButton"
import NewButton from "./NewButton"
import SectionTitle from "./SectionTitle"
import { useGenericSection } from "../GenericSectionContext";

const SectionHeader = () => {
  const { fieldData, handleRemoveAll, notification } = useGenericSection();
  let availableData = false;
  if (fieldData.length != 0) {
    availableData = true;
  }
  return (
    <>
      <BackButton />
      <div className="m-4 flex items-center pr-4">
        <SectionTitle />
        <NewButton />
        <div className="mx-4 my-1 flex items-center">
          <button
            onClick={handleRemoveAll}
            className="text-white btn btn-warning min-h-0 h-8 leading-tight"
            disabled={availableData ? false : true}
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

export default SectionHeader
