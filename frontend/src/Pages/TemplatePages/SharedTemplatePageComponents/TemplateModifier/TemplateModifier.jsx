import { TemplateModifierProvider } from "./TemplateModifierContext"
import YearSelector from "./YearSelector"
import TemplateOrganizer from "./TemplateOrganizer/TemplateOrganizer"
import AddGroupButton from "./AddGroupButton/AddGroupButton"
import SaveTemplateButton from "./SaveTemplateButton"

const TemplateModifier = ({
    groups,
    setGroup,
    title,
    setTitle,
    endDate,
    setEndDate,
    startDate,
    setStartDate,
    onBack,
    templateId = null
}) => {

    return <>
        <TemplateModifierProvider
            groups={groups}
            setGroups={setGroup}
            title={title}
            setTitle={setTitle}
            endDate={endDate}
            setEndDate={setEndDate}
            startDate={startDate}
            setStartDate={setStartDate}
            onBack={onBack}
        >
            <div className="flex justify-end mb-4">
                <SaveTemplateButton templateId={templateId}></SaveTemplateButton>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Title</label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Enter template title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            <YearSelector 
                startYear={startDate}
                setStartYear={setStartDate}
                endYear={endDate}
                setEndYear={setEndDate}
            />

            <h2 className="text-sm font-medium text-gray-700 mt-6">
                Add or remove sections you want to include on the CV.
            </h2>
            <h2 className="text-sm font-medium text-gray-700">
                Drag and drop sections in the order you want them to appear on the CV.
            </h2>

            <div className="flex justify-end mb-4 space-x-2">
                <AddGroupButton/>
            </div>

            <TemplateOrganizer />
        </TemplateModifierProvider>
    </>
}

export default TemplateModifier