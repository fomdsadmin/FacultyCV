import { useApp } from "../../Contexts/AppContext";
import EntryModal from "../EntryModal"
import { useGenericSection } from "./GenericSectionContext"

const EntryModalWrapper = () => {
    const { isModalOpen, selectedEntry, isNew, section, fetchData, handleCloseModal } = useGenericSection();

    if (!isModalOpen || !selectedEntry) return null

    if (isNew) {
        return (
            <EntryModal
                isNew={true}
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
