import { getAllSections } from "graphql/graphqlHelpers";
import { createContext, useContext, useEffect, useState } from "react"

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
  setSortAscending,
  createdWithRole,
  setCreatedWithRole,
  showDeclaration,
  setShowDeclaration
}) => {

  const getGroupIdContainingPreparedSectionId = (preparedSectionId) => {
    const group = groups.find(group =>
      group.prepared_sections?.some(preparedSection => preparedSection.data_section_id === preparedSectionId)
    );
    return group?.id;
  };

  const [sectionsMap, setSectionsMap] = useState(null);

  useEffect(() => {
    const helperFunction = async () => {
      const allSections = await getAllSections();

      // Create sectionsMap with data_section_id as key and section as value
      const sectionsMap = {};
      allSections.forEach((section) => {
        sectionsMap[section.title] = section;
      });

      setSectionsMap(sectionsMap)
    }
    helperFunction();
  }, []);

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
    sectionsMap,
    setCreatedWithRole,
    createdWithRole,
    showDeclaration,
    setShowDeclaration,

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