import EntryList from "./EntryList"
import EntryModalWrapper from "./EntryModalWrapper"
import {
  GenericSectionProvider,
  useGenericSection,
} from "./GenericSectionContext";
import SearchInput from "./SearchInput";
import SectionDescription from "./SectionDescription";
import SectionHeader from "./SectionHeader/SectionHeader";

const GenericSectionContent = () => {
  const { notification } = useGenericSection(); // <-- Get notification
  return (
    <div>
      <SectionHeader />
      <SectionDescription />
      <SearchInput />
      <EntryList />
      <EntryModalWrapper />
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-8 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg transition-all">
          {notification}
        </div>
      )}
    </div>
  );
};

const GenericSection = ({ section, onBack }) => {
  return (
    <GenericSectionProvider section={section} onBack={onBack}>
      <GenericSectionContent />
    </GenericSectionProvider>
  );
};

export default GenericSection
