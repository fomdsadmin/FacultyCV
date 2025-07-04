import { FaArrowLeft } from "react-icons/fa"
import { useState, useEffect } from "react"
import { getAllSections } from "../../graphql/graphqlHelpers"
import TemplateModifier from "./SharedTemplatePageComponents/TemplateModifier/TemplateModifier";
import { HIDDEN_ATTRIBUTE_GROUP_ID, HIDDEN_GROUP_ID, SHOWN_ATTRIBUTE_GROUP_ID } from "./SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";

const NewTemplatePage = ({ onBack }) => {
  const [title, setTitle] = useState("")
  const [sections, setSections] = useState([])
  const [template, setTemplate] = useState({groups: []});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections()
  }, [])

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

  useEffect(() => {
    const initialData = {
      sort_ascending: true,
      groups: [
        {
          id: HIDDEN_GROUP_ID,
          title: HIDDEN_GROUP_ID,
          prepared_sections: sections.map((section) => ({
            data_section_id: section.data_section_id,
            data_type: section.data_type,
            title: section.title,
            sort: {
              numerically: false, // if not it will be sorted alphabetically
              ascending: true,
              selected_attribute: "",
            },
            count_rows: false,
            attribute_groups: [
              {
                id: HIDDEN_ATTRIBUTE_GROUP_ID,
                title: HIDDEN_ATTRIBUTE_GROUP_ID,
                attributes: [],
              },
              {
                id: SHOWN_ATTRIBUTE_GROUP_ID,
                title: SHOWN_ATTRIBUTE_GROUP_ID,
                attributes: Object.keys(JSON.parse(section.attributes)),
              },
            ],
            attribute_rename_map: {}, // For the backend, shows what columns to rename
            renamed_section_title: null,
            show_row_count: false,
            include_row_number_column: false,
            merge_visible_attributes: false
          })),
        }
      ]
    };
    console.log(initialData)
    setTemplate(initialData);
  }, [sections])

  const fetchSections = async () => {
    const fetchedSections = await getAllSections()
    const sortedSections = fetchedSections
      .sort((a, b) => a.title.localeCompare(b.title))

    setSections(sortedSections)
    setLoading(false)
  }

  return (
    <div className="">
      <button onClick={onBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 mt-5 leading-tight mr-4">
        <FaArrowLeft className="h-6 w-6 text-zinc-800" />
      </button>
      <div className="mt-5 leading-tight mr-4 ml-4">
        <h2 className="text-2xl font-bold mb-6">New Template</h2>

        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <TemplateModifier
            template={template}
            setTemplate={setTemplate}
            title={title}
            setTitle={setTitle}
            onBack={onBack}
          />
        )}
      </div>
    </div>
  )
}

export default NewTemplatePage
