import EntryList from "./EntryList"
import EntryModalWrapper from "./EntryModalWrapper"
import { GenericSectionProvider } from "./GenericSectionContext"
import SearchInput from "./SearchInput"
import SectionDescription from "./SectionDescription"
import SectionHeader from "./SectionHeader/SectionHeader"

const GenericSectionContent = () => {
  return (
    <div>
      <SectionHeader />
      <SectionDescription />
      <SearchInput />
      <EntryList />
      <EntryModalWrapper />
    </div>
  )
}

const GenericSection = ({ section, onBack }) => {
  return (
    <GenericSectionProvider section={section} onBack={onBack}>
      <GenericSectionContent />
    </GenericSectionProvider>
  )
}

export default GenericSection
