import { useApp } from "../../Contexts/AppContext";
import EntryModal from "../EntryModal/EntryModal";
import { useGenericSection } from "./GenericSectionContext"

const EntryModalWrapper = () => {
    const { isModalOpen, selectedEntry, isNew, section, fetchData, handleCloseModal, titleWithoutSectionNumbers } = useGenericSection();

    if (!isModalOpen || !selectedEntry) return null

    if (isNew) {
        return (
            <EntryModal
                isNew={true}
                section={section}
                fields={selectedEntry.fields}
                user_cv_data_id={selectedEntry.data_id}
                entryType={titleWithoutSectionNumbers}
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
            entryType={titleWithoutSectionNumbers}
            fetchData={fetchData}
            onClose={handleCloseModal}
        />
    )
}

export default EntryModalWrapper
