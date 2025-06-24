import React, { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import FacultyMenu from "../Components/FacultyMenu";
import WorkSection from "../Components/WorkSection";
import "../CustomStyles/scrollbar.css";
import GenericSection from "../SharedComponents/GenericSection/GenericSection.jsx";
import SecureFundingSection from "../Components/SecureFundingSection.jsx";
import PublicationsSection from "../Components/PublicationsSection.jsx";
import PatentsSection from "../Components/PatentsSection.jsx";
import InvitedPresentationSection from "../Components/InvitedPresentationSection.jsx";
import { getAllSections } from "../graphql/graphqlHelpers.js";
import EntryModal from "../SharedComponents/EntryModal/EntryModal.jsx";
import { useNavigate, useParams } from "react-router-dom";

const AcademicWork = ({ getCognitoUser, userInfo, toggleViewMode }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [dataSections, setDataSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDesc, setShowDesc] = useState(null);
  const navigate = useNavigate();
  const { category, title } = useParams();

  useEffect(() => {
    getDataSections();
  }, []);

  // Open section if URL param is present
  useEffect(() => {
    if (title && dataSections.length > 0) {
      const found = dataSections.find((s) => s.title.replace(/\s+/g, "-").toLowerCase() === title);
      if (found) setActiveSection(found);
    }
  }, [title, dataSections]);

  // When user clicks a category tab, update the URL
  const handleTabSelect = (selectedCategory) => {
    setActiveTab(selectedCategory);
    setActiveSection(null);
    if (!selectedCategory) {
      navigate("/faculty/academic-work");
    } else {
      const categorySlug = selectedCategory.replace(/\s+/g, "-").toLowerCase();
      navigate(`/faculty/academic-work/${categorySlug}`);
    }
  };

  const getDataSections = async () => {
    const retrievedSections = await getAllSections();
    const parsedSections = retrievedSections.map((section) => ({
      ...section,
      attributes: JSON.parse(section.attributes),
    }));
    parsedSections.sort((a, b) => a.title.localeCompare(b.title));

    // Don't filter out service sections here!
    setDataSections(
      parsedSections.filter(
        (section) =>
          section.data_type !== "Education and Career" &&
          section.data_type !== "Leaves of Absence" &&
          section.data_type !== "Employment"
      )
    );
    setLoading(false);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // When user clicks a section, update the URL
  const handleManageClick = (value) => {
    const section = dataSections.filter((section) => section.data_section_id == value);
    setActiveSection(section[0]);
    if (section[0]) {
      const category = section[0].data_type.replace(/\s+/g, "-").toLowerCase();
      const title = section[0].title.replace(/\s+/g, "-").toLowerCase();
      navigate(`/faculty/academic-work/${category}/${title}`);
      window.scrollTo({ top: 0, behavior: "smooth" }); // <-- Add this line
    }
  };

  // When user clicks back, return to /academic-work/category
  const handleBack = () => {
    setActiveSection(null);
      if (category) {
    navigate(`/faculty/academic-work/${category}`);
  } else {
    navigate("/faculty/academic-work");
  }
  };

  const filters = Array.from(new Set(dataSections.map((section) => section.data_type)));
  const sectionDescriptions = {};
  dataSections.forEach((section) => {
    sectionDescriptions[section.data_type] = section.description;
  });

  const searchedSections = dataSections.filter((entry) => {
    const section = entry.title || "";
    const category = entry.data_type || "";
    const matchesSearch =
      section.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      category.toLowerCase().startsWith(searchTerm.toLowerCase());
    const matchesFilter = !activeTab || category === activeTab;
    return matchesSearch && matchesFilter;
  });

  // Use category from URL for filtering
  useEffect(() => {
    if (category) {
      // Find the original category name from slug
      const matched = filters.find((f) => f.replace(/\s+/g, "-").toLowerCase() === category);
      setActiveTab(matched || null);
    } else {
      setActiveTab(null);
    }
    // Reset section view if only category is present
    if (!title) setActiveSection(null);
  }, [category, filters, title]);

  const SectionTabs = ({ filters, activeFilter, onSelect, sectionDescriptions }) => {
    return (
      <>
        <div className="flex flex-wrap gap-4 mb-6 px-4 max-w-full">
          <button
            className={`text-md font-bold px-5 py-2 rounded-lg transition-colors duration-200 min-w-max whitespace-nowrap ${
              activeFilter === null ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => onSelect(null)}
          >
            All
          </button>
          {[...filters]
            .sort((a, b) => a.localeCompare(b))
            .map((filter) => (
              <button
                key={filter}
                className={`text-md font-bold px-5 py-2 rounded-lg transition-colors duration-200 min-w-max whitespace-nowrap ${
                  activeFilter === filter
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => onSelect(filter)}
              >
                {filter}
              </button>
            ))}
        </div>
        {showDesc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 relative">
              <button
                className="absolute top-3 right-4 text-xl text-gray-500 hover:text-gray-800"
                onClick={() => setShowDesc(null)}
              >
                ×
              </button>
              <h2 className="text-xl font-semibold mb-4">{showDesc}</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {sectionDescriptions[showDesc] || "No description available."}
              </p>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <PageContainer>
      <FacultyMenu userName={userInfo.preferred_name || userInfo.first_name} getCognitoUser={getCognitoUser}
        toggleViewMode={toggleViewMode} userInfo={userInfo}/>
      <main className="sm:px-[1vw] md:px-[2vw] lg:px-[3vw] flex flex-col items-center w-full max-w-7xl min-h-screen mb-2 py-6 mx-auto">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <>
            {activeSection === null ? (
              <div className="!overflow-auto !h-full rounded-lg max-w-7xl w-full mx-auto">
                <h1 className="text-left mb-4 text-4xl font-bold text-zinc-600 p-2 ml-2">Academic Work</h1>
                {/* Search bar for filtering sections */}
                <div className="mb-4 flex justify-start items-left ml-4">
                  <label className="input input-bordered flex items-left gap-2 flex-1 max-w-xl">
                    <input
                      type="text"
                      className="grow"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="h-4 w-4 opacity-70 mt-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </label>
                </div>
                <SectionTabs
                  filters={filters}
                  activeFilter={activeTab}
                  onSelect={handleTabSelect}
                  sectionDescriptions={sectionDescriptions}
                />
                {searchedSections.map((section) => (
                  <WorkSection
                    onClick={handleManageClick}
                    key={section.data_section_id}
                    id={section.data_section_id}
                    title={section.title}
                    category={section.data_type}
                  />
                ))}
              </div>
            ) : (
              <div className="!overflow-auto !h-full custom-scrollbar max-w-6xl w-full mx-auto">
                {activeSection.title === "Publications" && (
                  <PublicationsSection user={userInfo} section={activeSection} onBack={handleBack} />
                )}
                {activeSection.title === "Patents" && (
                  <PatentsSection user={userInfo} section={activeSection} onBack={handleBack} />
                )}
                {activeSection.title === "Research or Equivalent Grants" && (
                  <SecureFundingSection user={userInfo} section={activeSection} onBack={handleBack} />
                )}
                {/* {activeSection.title === "Invited Presentations" && (
                  <InvitedPresentationSection
                    user={userInfo}
                    section={activeSection}
                    onBack={handleBack}
                  />
                )} */}
                {!["Publications", "Patents", "Research or Equivalent Grants"].includes(activeSection.title) && (
                  <GenericSection user={userInfo} section={activeSection} onBack={handleBack} />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </PageContainer>
  );
};

export default AcademicWork;
