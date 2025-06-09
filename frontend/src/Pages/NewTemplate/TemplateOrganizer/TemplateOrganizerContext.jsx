"use client"

import { createContext, useContext } from "react"

const TemplateOrganizerContext = createContext(null)

export const useTemplateOrganizer = () => {
  const context = useContext(TemplateOrganizerContext)
  if (!context) {
    throw new Error("useTemplateOrganizer must be used within a TemplateOrganizerProvider")
  }
  return context
}

export const TemplateOrganizerProvider = ({ children, groups, setGroups }) => {
  
  // Constants (never change)
  const HIDDEN_GROUP_ID = "Hidden (Sections here will not be shown)"
  const SHOWN_ATTRIBUTE_GROUP_ID = "Shown (Attributes here will be shown)"
  const HIDDEN_ATTRIBUTE_GROUP_ID = "Hidden (Attributes here will be hidden)"

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
    
    // Helpers
    getGroupIdContainingPreparedSectionId
  }

  return (
    <TemplateOrganizerContext.Provider value={value}>
      {children}
    </TemplateOrganizerContext.Provider>
  )
}