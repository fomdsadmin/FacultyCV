"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { addTemplate, getAllSections } from "../../graphql/graphqlHelpers"

const TemplateContext = createContext(null)

export const useTemplate = () => {
  const context = useContext(TemplateContext)
  if (!context) {
    throw new Error("useTemplate must be used within a TemplateProvider")
  }
  return context
}

export const TemplateProvider = ({ children, onBack, fetchTemplates }) => {

  const HIDDEN_GROUP_ID = "Hidden (Sections here will not be shown)";

  const SHOWN_ATTRIBUTE_GROUP_ID = "Shown (Attributes here will be shown)"
  const HIDDEN_ATTRIBUTE_GROUP_ID = "Hidden (Attributes here will be hidden)"

  const [addingTemplate, setAddingTemplate] = useState(false)
  const [title, setTitle] = useState("")
  const [sections, setSections] = useState([])
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
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
          ...section,
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
    const sectionsWithToggle = fetchedSections
      .map((section) => ({
        ...section,
        showMinus: true,
      }))
      .sort((a, b) => a.title.localeCompare(b.title))

    setSections(sectionsWithToggle)
    setLoading(false)
  }

  const createTemplate = async () => {
    if (!title.trim()) {
      setErrorMessage("Template title cannot be blank.")
      return
    }

    if (!startYear || !endYear) {
      setErrorMessage("You must choose a start and end year.")
      return
    }

    if (endYear !== "Current" && Number.parseInt(endYear) <= Number.parseInt(startYear)) {
      setErrorMessage("End year must be after start year.")
      return
    }

    const selectedSectionIds = sections.filter((section) => section.showMinus).map((section) => section.data_section_id)

    if (selectedSectionIds.length === 0) {
      setErrorMessage("At least one section must be selected.")
      return
    }

    const selectedSectionIdsString = selectedSectionIds.join(",")

    setAddingTemplate(true)
    try {
      await addTemplate(title, selectedSectionIdsString, startYear, endYear)
      await fetchTemplates()
      onBack()
    } catch (error) {
      console.error("Error creating template:", error)
      setErrorMessage("Failed to create template. Please try again.")
    }
    setAddingTemplate(false)
  }

  const toggleSection = (index) => {
    const newSections = [...sections]
    newSections[index].showMinus = !newSections[index].showMinus
    setSections(newSections)
  }

  const selectAllSections = () => {
    const newSections = sections.map((section) => ({
      ...section,
      showMinus: true,
    }))
    setSections(newSections)
  }

  const deselectAllSections = () => {
    const newSections = sections.map((section) => ({
      ...section,
      showMinus: false,
    }))
    setSections(newSections)
  }

  const reorderSections = (result) => {
    if (!result.destination) return
    const newSections = Array.from(sections)
    const [movedSection] = newSections.splice(result.source.index, 1)
    newSections.splice(result.destination.index, 0, movedSection)
    setSections(newSections)
  }

  const value = {
    //Constants
    HIDDEN_GROUP_ID,
    SHOWN_ATTRIBUTE_GROUP_ID,
    HIDDEN_ATTRIBUTE_GROUP_ID,
    // State
    addingTemplate,
    title,
    sections,
    loading,
    errorMessage,
    startYear,
    endYear,
    groups,
    // Setters
    setTitle,
    setStartYear,
    setEndYear,
    setErrorMessage,
    setGroups,
    // Actions
    createTemplate,
    toggleSection,
    selectAllSections,
    deselectAllSections,
    reorderSections,
    onBack,
    // Helpers
    getGroupIdContainingPreparedSectionId
  }

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>
}
