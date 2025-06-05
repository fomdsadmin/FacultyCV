import { useTemplate } from "./TemplateContext"

const SelectionButtons = () => {
    const { selectAllSections, deselectAllSections } = useTemplate();

    const handleSelectAll = () => {
        selectAllSections()
    }

    const handleDeselectAll = () => {
        deselectAllSections()
    }

    return (
        <div className="flex justify-end mb-4 space-x-2">
            <button type="button" onClick={handleSelectAll} className="btn btn-secondary text-white px-2 py-1 text-sm">
                Select All
            </button>
            <button type="button" onClick={handleDeselectAll} className="btn btn-secondary text-white px-2 py-1 text-sm">
                Deselect All
            </button>
        </div>
    )
}

export default SelectionButtons