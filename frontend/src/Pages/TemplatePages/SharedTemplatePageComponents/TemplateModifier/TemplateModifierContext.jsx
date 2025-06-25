"use client"

import { createContext, useContext } from "react"

const TemplateModifierContext = createContext(null);

// Constants (never change)
export const HIDDEN_GROUP_ID = "Hidden (Sections here will not be shown)"
export const SHOWN_ATTRIBUTE_GROUP_ID = "Shown (Attributes here will be shown)"
export const HIDDEN_ATTRIBUTE_GROUP_ID = "Hidden (Attributes here will be hidden)"

export const useTemplateModifier = () => {
  const context = useContext(TemplateModifierContext)
  if (!context) {
    throw new Error("useTemplateModifier must be used within a TemplateModifierProvider")
  }
  return context
}

export const TemplateModifierProvider = ({
  children,
  groups,
  setGroups,
  sortAscending,
  title,
  setTitle,
  onBack,
  setSortAscending
}) => {

  const getGroupIdContainingPreparedSectionId = (preparedSectionId) => {
    const group = groups.find(group =>
      group.prepared_sections?.some(preparedSection => preparedSection.data_section_id === preparedSectionId)
    );
    return group?.id;
  };

  const value = {
    // Constants
    HIDDEN_GROUP_ID,
    SHOWN_ATTRIBUTE_GROUP_ID,
    HIDDEN_ATTRIBUTE_GROUP_ID,

    // State
    groups,
    setGroups,
    title,
    setTitle,
    sortAscending,
    setSortAscending,

    // onBack
    onBack,

    // Helpers
    getGroupIdContainingPreparedSectionId
  }

  return (
    <TemplateModifierContext.Provider value={value}>
      {children}
    </TemplateModifierContext.Provider>
  )
}