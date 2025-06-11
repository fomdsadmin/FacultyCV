import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getUserCVData,
  updateUserCVDataArchive,
  deleteUserCVSectionData,
} from "../../graphql/graphqlHelpers";
import { rankFields } from "../../utils/rankingUtils";
import { useApp } from "../../Contexts/AppContext";

// Create context
const GenericSectionContext = createContext(null);

// Custom hook to use the context

export const useGenericSection = () => {
  const context = useContext(GenericSectionContext);
  if (!context) {
    throw new Error(
      "useGenericSection must be used within a GenericSectionProvider"
    );
  }
  return context;
};

// Helper function to generate empty entry
const generateEmptyEntry = (attributes) => {
  const emptyEntry = {};
  for (const key of Object.keys(attributes)) {
    const newKey = key.toLowerCase().replace(/ /g, "_");
    emptyEntry[newKey] = "";
  }
  return emptyEntry;
};

// Provider component
export const GenericSectionProvider = ({ section, onBack, children }) => {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [fieldData, setFieldData] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(""); // <-- Add this

  const { userInfo } = useApp();

  // Fetch data function
  const fetchData = async () => {
    setLoading(true);
    try {
      const retrievedData = await getUserCVData(
        userInfo.user_id,
        section.data_section_id
      );
      // Parse the data_details field from a JSON string to a JSON object
      const parsedData = retrievedData.map((data) => ({
        ...data,
        data_details: JSON.parse(data.data_details),
      }));

      const filteredData = parsedData.filter((entry) => {
        const [field1, field2] = rankFields(entry.data_details);

        return (
          (field1 &&
            typeof field1 === "string" &&
            field1.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (field2 &&
            typeof field2 === "string" &&
            field2.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });

      const rankedData = filteredData.map((entry) => {
        const [field1, field2] = rankFields(entry.data_details);

        const findKeyForField = (field) => {
          return Object.keys(entry.data_details).find(
            (key) => entry.data_details[key] === field
          );
        };

        const key1 = findKeyForField(field1);
        const key2 = findKeyForField(field2);

        return { ...entry, field1, field2, key1, key2 };
      });

      const extractYear = (dateStr) => {
        if (!dateStr || typeof dateStr !== "string") return null;
        if (dateStr.toLowerCase().includes("current")) {
          return Number.POSITIVE_INFINITY; // Use Infinity to ensure "Current" is always sorted higher
        }
        const years = dateStr.match(/\b\d{4}\b/g);
        return years ? Number.parseInt(years[years.length - 1]) : null; // Use the last year in the string
      };

      rankedData.sort((a, b) => {
        const isDateOrYear = (key) =>
          key &&
          (key.toLowerCase().includes("dates") ||
            key.toLowerCase().includes("year"));

        const dateA = isDateOrYear(a.key1)
          ? extractYear(a.field1)
          : isDateOrYear(a.key2)
          ? extractYear(a.field2)
          : null;
        const dateB = isDateOrYear(b.key1)
          ? extractYear(b.field1)
          : isDateOrYear(b.key2)
          ? extractYear(b.field2)
          : null;

        if (dateA !== null && dateB !== null) {
          return dateB - dateA;
        } else if (dateA !== null) {
          return -1;
        } else if (dateB !== null) {
          return 1;
        }
        return 0;
      });

      setFieldData(rankedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  // Handler functions
  const handleArchive = async (entry) => {
    setLoading(true);
    setFieldData([]);
    try {
      await updateUserCVDataArchive(entry.user_cv_data_id, true);
    } catch (error) {
      console.error("Error archiving entry:", error);
    }
    await fetchData();
  };

  const handleRemoveAll = async () => {
    try {
      await deleteUserCVSectionData({
        user_id: userInfo.user_id, // or get user_id from props/context
        data_section_id: section.data_section_id,
      });
      await fetchData(); // Refresh data after toast disappears
      setNotification(`${section.title}'s data removed successfully!`);
      setTimeout(() => {
        setNotification("");
      }, 2500);
    } catch (error) {
      console.error("Error deleting section data:", error);
    }
  };

  const handleEdit = (entry) => {
    const newEntry = {
      fields: entry.data_details,
      data_id: entry.user_cv_data_id,
    };
    setIsNew(false);
    setSelectedEntry(newEntry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedEntry(null);
    setIsModalOpen(false);
  };

  const handleNew = () => {
    setIsNew(true);
    if (typeof section.attributes === "string") {
      section.attributes = JSON.parse(section.attributes);
    }
    const emptyEntry = generateEmptyEntry(section.attributes);
    const newEntry = { fields: emptyEntry, data_id: null };
    setSelectedEntry(newEntry);
    setIsModalOpen(true);
  };

  // Fetch data when search term or section changes
  useEffect(() => {
    setLoading(true);
    setFieldData([]);
    fetchData();
  }, [searchTerm, section.data_section_id]);

  // Context value
  const value = {
    // State
    searchTerm,
    setSearchTerm,
    fieldData,
    selectedEntry,
    isModalOpen,
    isNew,
    loading,
    notification, // <-- Provide notification

    // Section data
    section,

    // Functions
    fetchData,
    handleArchive,
    handleEdit,
    handleCloseModal,
    handleNew,
    handleRemoveAll,
    onBack,
  };

  return (
    <GenericSectionContext.Provider value={value}>
      {children}
    </GenericSectionContext.Provider>
  );
};
