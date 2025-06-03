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
  const [addingTemplate, setAddingTemplate] = useState(false)
  const [title, setTitle] = useState("")
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [startYear, setStartYear] = useState("")
  const [endYear, setEndYear] = useState("")

  useEffect(() => {
    fetchSections()
  }, [])

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
    // State
    addingTemplate,
    title,
    sections,
    loading,
    errorMessage,
    startYear,
    endYear,
    // Setters
    setTitle,
    setStartYear,
    setEndYear,
    setErrorMessage,
    // Actions
    createTemplate,
    toggleSection,
    selectAllSections,
    deselectAllSections,
    reorderSections,
    onBack,
  }

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>
}
