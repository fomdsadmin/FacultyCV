import BackButton from "./BackButton"
import NewButton from "./NewButton"
import SectionTitle from "./SectionTitle"
import { useGenericSection } from "../GenericSectionContext";

const SectionHeader = () => {
  const { fieldData, handleRemoveAll } = useGenericSection();
  let availableData = false;
  if (fieldData.length != 0) {
    availableData = true;
  }
  return (
    <>
      <BackButton />
      <div className="m-4 flex items-center">
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
      </div>
    </>
  );
};

export default SectionHeader
