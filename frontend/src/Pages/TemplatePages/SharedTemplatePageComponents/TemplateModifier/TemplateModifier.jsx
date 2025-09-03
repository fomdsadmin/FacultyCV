import { TemplateModifierProvider } from "./TemplateModifierContext"
import TemplateOrganizer from "./TemplateOrganizer/TemplateOrganizer"
import AddGroupButton from "./AddGroupButton/AddGroupButton"
import SaveTemplateButton from "./SaveTemplateButton"
import SortButton from "./SortButton"

const TemplateModifier = ({
    template,
    setTemplate,
    title,
    setTitle,
    onBack,
    templateId=null,
    setCreatedWithRole,
    createdWithRole
}) => {

    const setGroups = (newGroupsOrUpdater) => {
        setTemplate(prevTemplate => {
            // Check if newGroupsOrUpdater is a function
            if (typeof newGroupsOrUpdater === 'function') {
                // Call the function with the previous groups
                const updatedGroups = newGroupsOrUpdater(prevTemplate.groups);
                return {
                    ...prevTemplate,
                    groups: updatedGroups
                };
            } else {
                // It's a direct value
                return {
                    ...prevTemplate,
                    groups: newGroupsOrUpdater
                };
            }
        });
    };

    const setSortAscending = (ascending) => {
        setTemplate((prevTemplate) => ({
            ...prevTemplate,
            sort_ascending: ascending
        }))
    }

    return <>
        <TemplateModifierProvider
            groups={template.groups}
            setGroups={setGroups}
            title={title}
            setTitle={setTitle}
            onBack={onBack}
            sortAscending={template.sort_ascending}
            setSortAscending={setSortAscending}
            setCreatedWithRole={setCreatedWithRole}
            createdWithRole={createdWithRole}
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

            <h2 className="text-sm font-medium text-gray-700 mt-6">
                Add or remove sections you want to include on the CV.
            </h2>
            <h2 className="text-sm font-medium text-gray-700">
                Drag and drop sections in the order you want them to appear on the CV.
            </h2>

            <div className="flex justify-end mb-4 space-x-2">
                <SortButton />
                <AddGroupButton />
            </div>

            <TemplateOrganizer />
        </TemplateModifierProvider>
    </>
}

export default TemplateModifier