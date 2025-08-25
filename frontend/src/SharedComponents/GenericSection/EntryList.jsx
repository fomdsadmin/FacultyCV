import GenericEntry from "../GenericEntry";
import { useGenericSection } from "./GenericSectionContext";

const EntryList = ({ entries }) => {
  const { fieldData, handleEdit, handleArchive, loading } = useGenericSection();
  const dataToRender = entries || fieldData;

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full">
        <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
      </div>
    );
  }

  if (dataToRender.length === 0) {
    return <p className="m-4">No data found</p>;
  }

  return (
    <div>
      {dataToRender.map((entry, index) => (
        <GenericEntry
          isArchived={false}
          key={index}
          onEdit={() => handleEdit(entry)}
          field1={entry.field1}
          field2={entry.field2}
          data_details={entry.data_details}
          onArchive={() => handleArchive(entry)}
          onRestore={undefined}
        />
      ))}
    </div>
  );
};

export default EntryList;
