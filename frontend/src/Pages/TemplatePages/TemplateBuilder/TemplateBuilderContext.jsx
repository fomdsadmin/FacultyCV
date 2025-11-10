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

export const buildAttributeObject = (attributeName, attributeKey) => {
  return {
    id: crypto.randomUUID(),
    type: "attribute",
    originalName: attributeName,
    rename: "",
    key: attributeKey,
    footnoteSettings: {
      footnoteSource: "",
      footnoteTarget: "",
    },
    children: [],
  }
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
      console.log(allSections)

      // Create sectionsMap with title as key and section as value
      const sectionsMap = {};
      allSections.forEach((section) => {
        const attributes = JSON.parse(section.attributes);
        const attributesType = JSON.parse(section.attributes_type);

        // invert attributes_type to get a mapping of attributeName -> type
        const invertedTypeMap = {};
        const dropdownOptions = {};

        for (const [type, attrs] of Object.entries(attributesType)) {
          for (const attrName of Object.keys(attrs)) {
            invertedTypeMap[attrName] = type;

            // Extract dropdown options: dropdown attribute name -> options array
            if (type === "dropdown" && Array.isArray(attrs[attrName])) {
              dropdownOptions[attrName] = attrs[attrName];
            }
          }
        }

        sectionsMap[section.title] = {
          ...section,
          attributes: Object.entries(attributes).map(
            ([attributeName, attributeKey]) =>
              buildAttributeObject(attributeName, attributeKey)
          ),
          attributeKeys: attributes,
          attributes_type: invertedTypeMap,
          dropdownOptions, // Dict: dropdown attribute name -> options array
        };
      });


      setSectionsMap(sectionsMap)
      console.log(sectionsMap);
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