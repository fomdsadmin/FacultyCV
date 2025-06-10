import { FaArrowLeft } from "react-icons/fa"
import { useState, useEffect } from "react"
import { getAllSections } from "../../../graphql/graphqlHelpers"
import TemplateModifier from "../SharedTemplatePageComponents/TemplateModifier/TemplateModifier";
import { HIDDEN_ATTRIBUTE_GROUP_ID, HIDDEN_GROUP_ID, SHOWN_ATTRIBUTE_GROUP_ID } from "../SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";

const NewTemplatePage = ({ onBack, fetchTemplates }) => {
  const [title, setTitle] = useState("")
  const [sections, setSections] = useState([])
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true)
  const [startYear, setStartYear] = useState("")
  const [endYear, setEndYear] = useState("")

  useEffect(() => {
    fetchSections()
  }, [])

  useEffect(() => {
    const initialData = [
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
          show_row_count: false
        })),
      }
    ];
    console.log(initialData)
    setGroups(initialData);
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
        
        <TemplateModifier
          groups={groups}
          setGroup={setGroups}
          title={title}
          setTitle={setTitle}
          endDate={endYear}
          setEndDate={setEndYear}
          startDate={startYear}
          setStartDate={setStartYear}
          loading={loading}
          onBack={onBack}
          fetchTemplates={fetchTemplates}
        />
      </div>
    </div>
  )
}

export default NewTemplatePage
