import { useGenericSection } from "./GenericSectionContext"

const SectionDescription = () => {
    const { section } = useGenericSection()

    return <div className="m-4 flex">{section.description}</div>
}

export default SectionDescription
