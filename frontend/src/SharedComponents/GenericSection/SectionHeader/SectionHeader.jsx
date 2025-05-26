import BackButton from "./BackButton"
import NewButton from "./NewButton"
import SectionTitle from "./SectionTitle"

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
