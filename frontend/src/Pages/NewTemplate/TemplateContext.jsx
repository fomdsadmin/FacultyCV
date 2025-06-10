"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { getAllSections } from "../../graphql/graphqlHelpers"

const TemplateContext = createContext(null)

export const useTemplate = () => {
  const context = useContext(TemplateContext)
  if (!context) {
    throw new Error("useTemplate must be used within a TemplateProvider")
  }
  return context
}

export const TemplateProvider = ({ children, onBack }) => {

  const HIDDEN_GROUP_ID = "Hidden (Sections here will not be shown)";

  const SHOWN_ATTRIBUTE_GROUP_ID = "Shown (Attributes here will be shown)"
  const HIDDEN_ATTRIBUTE_GROUP_ID = "Hidden (Attributes here will be hidden)"

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

  const getGroupIdContainingPreparedSectionId = (preparedSectionId) => {
    return groups.find(group =>
      group.prepared_sections.some(preparedSection => preparedSection.data_section_id === preparedSectionId)
    ).id;
  };

  const fetchSections = async () => {
    const fetchedSections = await getAllSections()
    const sortedSections = fetchedSections
      .sort((a, b) => a.title.localeCompare(b.title))

    setSections(sortedSections)
    setLoading(false)
  }

  const value = {
    //Constants
    onBack,
    HIDDEN_GROUP_ID,
    SHOWN_ATTRIBUTE_GROUP_ID,
    HIDDEN_ATTRIBUTE_GROUP_ID,
    // State
    title,
    sections,
    loading,
    startYear,
    endYear,
    groups,
    // Setters
    setTitle,
    setStartYear,
    setEndYear,
    setGroups,
    // Helpers
    getGroupIdContainingPreparedSectionId
  }

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>
}
