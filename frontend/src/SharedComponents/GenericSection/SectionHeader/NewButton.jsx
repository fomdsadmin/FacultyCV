import { useGenericSection } from "../GenericSectionContext"

const NewButton = () => {
    const { handleNew } = useGenericSection()

    return (
        <button onClick={handleNew} className="ml-auto text-white btn btn-success min-h-0 h-8 leading-tight">
            New
        </button>
    )
}

export default NewButton
