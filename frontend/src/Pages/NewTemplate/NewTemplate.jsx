import { FaArrowLeft } from "react-icons/fa"
import { TemplateProvider, useTemplate } from "./TemplateContext"
import CreateTemplateButton from "./CreateTemplateButton"
import YearSelector from "./YearSelector"
import SelectionButtons from "./SelectionButtons"
import TemplateOrganizer from "./TemplateOrganizer/TemplateOrganizer"
import AddGroupButton from "./AddGroupButton/AddGroupButton"

const NewTemplateContent = () => {
  const { loading, title, setTitle, onBack, groups, setGroups } = useTemplate()

  return (
    <div className="">
      <button onClick={onBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 mt-5 leading-tight mr-4">
        <FaArrowLeft className="h-6 w-6 text-zinc-800" />
      </button>
      <div className="mt-5 leading-tight mr-4 ml-4">
        <h2 className="text-2xl font-bold mb-6">Create New Template</h2>
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <CreateTemplateButton />
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

            <YearSelector />

            <h2 className="text-sm font-medium text-gray-700 mt-6">
              Add or remove sections you want to include on the CV.
            </h2>
            <h2 className="text-sm font-medium text-gray-700">
              Drag and drop sections in the order you want them to appear on the CV.
            </h2>

            <div className="flex justify-end mb-4 space-x-2">
              <SelectionButtons />
              <AddGroupButton />
            </div>
            <TemplateOrganizer groups={groups} setGroups={setGroups} />
          </>
        )}
      </div>
    </div>
  )
}

const NewTemplate = ({ onBack, fetchTemplates }) => {
  return (
    <TemplateProvider onBack={onBack} fetchTemplates={fetchTemplates}>
      <NewTemplateContent />
    </TemplateProvider>
  )
}

export default NewTemplate
