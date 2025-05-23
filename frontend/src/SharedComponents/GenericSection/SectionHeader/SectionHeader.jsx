import BackButton from "./BackButton/BackButton"
import NewButton from "./NewButton/NewButton"
import SectionTitle from "./SectionTitle/SectionTitle"

const SectionHeader = () => {
    return (
        <>
            <BackButton />
            <div className="m-4 flex items-center">
                <SectionTitle />
                <NewButton />
            </div>
        </>
    )
}

export default SectionHeader
