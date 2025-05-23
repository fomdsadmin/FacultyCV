import EntryList from "./EntryList/EntryList"
import EntryModalWrapper from "./EntryModalWrapper/EntryModalWrapper"
import { GenericSectionProvider } from "./GenericSectionContext"
import SearchInput from "./SearchInput/SearchInput"
import SectionDescription from "./SectionDescription/SectionDescription"
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

const GenericSection = ({ user, section, onBack }) => {
  return (
    <GenericSectionProvider user={user} section={section} onBack={onBack}>
      <GenericSectionContent />
    </GenericSectionProvider>
  )
}

export default GenericSection
