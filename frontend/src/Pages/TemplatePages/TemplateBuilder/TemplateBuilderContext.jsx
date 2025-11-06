import { getAllSections } from "graphql/graphqlHelpers";
import { createContext, useContext, useEffect, useState } from "react"

const TemplateBuilderContext = createContext(null);

export const useTemplateBuilder = () => {
  const context = useContext(TemplateBuilderContext);
  if (!context) {
    throw new Error("useTemplateBuilder must be used within a TemplateBuilderProvider")
  }
  return context
}

export const TemplateBuilderProvider = ({
  children,
  sortAscending,
  title,
  setTitle,
  onBack,
  setSortAscending,
  createdWithRole,
  setCreatedWithRole,
  showDeclaration,
  setShowDeclaration,
  templateId
}) => {

  const [sectionsMap, setSectionsMap] = useState(null);

  useEffect(() => {
    const helperFunction = async () => {
      const allSections = await getAllSections();

      // Create sectionsMap with title as key and section as value
      const sectionsMap = {};
      allSections.forEach((section) => {
        sectionsMap[section.title] = section;
      });

      setSectionsMap(sectionsMap)
    }
    helperFunction();
  }, []);

  const value = {
    // State
    title,
    setTitle,
    sortAscending,
    setSortAscending,
    sectionsMap,
    setCreatedWithRole,
    createdWithRole,
    showDeclaration,
    setShowDeclaration,
    templateId,

    // onBack
    onBack,
  }

  return (
    <TemplateBuilderContext.Provider value={value}>
      {children}
    </TemplateBuilderContext.Provider>
  )
}