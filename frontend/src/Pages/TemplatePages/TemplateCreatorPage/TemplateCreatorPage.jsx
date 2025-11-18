import { FaArrowLeft } from "react-icons/fa"
import { useState, useEffect } from "react"
import { getAllSections } from "graphql/graphqlHelpers";
import { useApp } from "Contexts/AppContext";
import TemplateBuilder from "../TemplateBuilder/TemplateBuilder";

const TemplateCreatorPage = ({ onBack }) => {
  const [title, setTitle] = useState("")
  const [sections, setSections] = useState([])
  const [template, setTemplate] = useState({ groups: [] });
  const [loading, setLoading] = useState(true);
  const { currentViewRole } = useApp();
  const [createdWithRole, setCreatedWithRole] = useState(currentViewRole);
  const [showDeclaration, setShowDeclaration] = useState(false);
  const [showFomLogo, setShowFomLogo] = useState(false);
  const [showVisualNesting, setShowVisualNesting] = useState(false);
  const [sortAscending, setSortAscending] = useState(true);

  useEffect(() => {
    fetchSections()
  }, [])

  useEffect(() => {
    const initialData = {
      sort_ascending: true,
      created_with_role: createdWithRole,
      groups: [
        {
          id: "HIDDEN_GROUP_ID",
          title: "HIDDEN_GROUP_ID",
          prepared_sections: sections.map((section) => ({
            attributes_type: section.attributes_type,
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
                id: "HIDDEN_ATTRIBUTE_GROUP_ID",
                title: "HIDDEN_ATTRIBUTE_GROUP_ID",
                attributes: [],
              },
              {
                id: "SHOWN_ATTRIBUTE_GROUP_ID",
                title: "SHOWN_ATTRIBUTE_GROUP_ID",
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
  }, [sections, createdWithRole])

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
          <TemplateBuilder
            template={template}
            setTemplate={setTemplate}
            title={title}
            setTitle={setTitle}
            onBack={onBack}
            setCreatedWithRole={setCreatedWithRole}
            createdWithRole={createdWithRole}
            showDeclaration={showDeclaration}
            setShowDeclaration={setShowDeclaration}
            showVisualNesting={showVisualNesting}
            setShowVisualNesting={setShowVisualNesting}
            showFomLogo={showFomLogo}
            setShowFomLogo={setShowFomLogo}
            sortAscending={sortAscending}
            setSortAscending={setSortAscending}
          />
        )}
      </div>
    </div>
  )
}

export default TemplateCreatorPage
