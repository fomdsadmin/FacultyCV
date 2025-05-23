import EntryModal from "../../EntryModal/EntryModal"
import { useGenericSection } from "../GenericSectionContext"

const EntryModalWrapper = () => {
    const { isModalOpen, selectedEntry, isNew, user, section, fetchData, handleCloseModal } = useGenericSection()

    if (!isModalOpen || !selectedEntry) return null

    if (isNew) {
        return (
            <EntryModal
                isNew={true}
                user={user}
                section={section}
                fields={selectedEntry.fields}
                user_cv_data_id={selectedEntry.data_id}
                entryType={section.title}
                fetchData={fetchData}
                onClose={handleCloseModal}
            />
        )
    }

    return (
        <EntryModal
            isNew={false}
            user={user}
            section={section}
            fields={selectedEntry.fields}
            user_cv_data_id={selectedEntry.data_id}
            entryType={section.title}
            fetchData={fetchData}
            onClose={handleCloseModal}
        />
    )
}

export default EntryModalWrapper
