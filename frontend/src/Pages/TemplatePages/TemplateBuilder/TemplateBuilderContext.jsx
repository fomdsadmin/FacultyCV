import { getAllSections } from "graphql/graphqlHelpers";
import { createContext, useContext, useEffect, useState } from "react"
import { UserCvStore } from "Pages/ReportsPage/HtmlFunctions/UserCvTableBuilder/UserCvStore";

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

/**
 * Converts a class instance into a sectionsMap-compatible structure
 * @param {string} sectionName - The name of the section (data source)
 * @param {Object} classInstance - An instance of the class to convert
 * @returns {Object} A structure compatible with sectionsMap
 */
export const classToSectionMap = (sectionName, classInstance) => {
  // Use getAllGetters() method if it exists on the class, otherwise extract manually
  let getters = {};
  
  if (typeof classInstance.getAllGetters === 'function') {
    // Use the class's own getAllGetters method
    getters = classInstance.getAllGetters();
  } else {
    // Fallback: manually extract getters
    const proto = Object.getPrototypeOf(classInstance);
    
    for (const name of Object.getOwnPropertyNames(proto)) {
      // Skip constructor, reset method, and getAllGetters
      if (name === 'constructor' || name === 'reset' || name === 'getAllGetters') continue;
      
      // Check if it's a getter method (starts with 'get')
      if (name.startsWith('get') && typeof proto[name] === 'function') {
        // Convert 'getCurrentDate' to 'Current Date'
        const humanReadable = name
          .replace(/^get/, '')  // Remove 'get' prefix
          .replace(/([A-Z])/g, ' $1')  // Add space before capitals
          .trim()
          .replace(/^ /, '');  // Remove leading space if any
        
        // Store with human-readable name as key and method name as value
        getters[humanReadable] = name;
      }
    }
  }

  // Build attributes array and keys mapping
  const attributes = Object.entries(getters).map(
    ([attributeName, methodName]) =>
      buildAttributeObject(attributeName, methodName)
  );

  const attributeKeys = getters; // { "Human Name": "getMethodName", ... }

  // All attributes from a class are considered 'text' type (not dropdown)
  const attributes_type = {};
  Object.keys(attributeKeys).forEach((attrName) => {
    attributes_type[attrName] = 'text';
  });

  return {
    title: sectionName,
    attributes,
    attributeKeys,
    attributes_type,
    dropdownOptions: {}, // No dropdown options for class-based sections
  };
}


export const TemplateBuilderProvider = ({
  children,
  onBack,
  templateId,
  template,
  setTemplate,
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

      // Add UserCvStore as a section (class-based data source)
      const userCvStore = new UserCvStore({});
      sectionsMap["userCv"] = classToSectionMap("userCv", userCvStore);
      
      setSectionsMap(sectionsMap)
      console.log(sectionsMap);
    }
    helperFunction();
  }, []);

  const value = {
    // State
    sectionsMap,
    templateId,
    template,
    setTemplate,

    // onBack
    onBack,
  }

  return (
    <TemplateBuilderContext.Provider value={value}>
      {children}
    </TemplateBuilderContext.Provider>
  )
}