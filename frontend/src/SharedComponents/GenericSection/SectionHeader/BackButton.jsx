import { FaArrowLeft } from "react-icons/fa"
import { useGenericSection } from "../GenericSectionContext"

const BackButton = () => {
    const { onBack } = useGenericSection()

    if (!onBack) return null

    return (
        <button onClick={onBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 mt-5 leading-tight mr-4">
            <FaArrowLeft className="h-6 w-6 text-zinc-800" />
        </button>
    )
}

export default BackButton
