import { useGenericSection } from "../GenericSectionContext"

const SectionTitle = () => {
    const { section } = useGenericSection()

    return <h2 className="text-left text-4xl font-bold text-zinc-600 pr-8">{section.title}</h2>
}

export default SectionTitle
