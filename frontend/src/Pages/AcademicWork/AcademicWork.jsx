import React, { useState, useEffect } from "react";
import PageContainer from "../../Views/PageContainer.jsx";
import FacultyMenu from "../../Components/FacultyMenu.jsx";
import WorkSection from "../../Components/WorkSection.jsx";
import "../../CustomStyles/scrollbar.css";
import GenericSection from "../../SharedComponents/GenericSection/GenericSection.jsx";
import SecureFundingSection from "../../Components/SecureFundingSection.jsx";
import PublicationsSection from "./Publications/PublicationsSection.jsx";
import PatentsSection from "../../Components/PatentsSection.jsx";
import { getAllSections } from "../../graphql/graphqlHelpers.js";
import { useNavigate, useParams } from "react-router-dom";
import { sectionTitleSort, naturalSort } from "../../utils/sectionUtils.js";

// Utility function to clean slugs with number prefixes
function cleanSlugPrefix(slug) {
  return slug.split("-")[0].match(/\d/)
    ? slug.split("-").slice(1).join("-")
    : slug;
}

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
      const found = dataSections.find((s) => slugify(s.title) === title);
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
      const categorySlug = slugify(selectedCategory);
      const categorySlugClean = cleanSlugPrefix(categorySlug);
      navigate(`/faculty/academic-work/${categorySlugClean}`);
    }
  };

  const getDataSections = async () => {
    const retrievedSections = await getAllSections();
    const parsedSections = retrievedSections.map((section) => ({
      ...section,
      attributes: JSON.parse(section.attributes),
    }));

    // Sort sections by title using natural sort
    parsedSections.sort((a, b) => naturalSort(a.title, b.title));

    // Filter out unwanted sections
    setDataSections(
      parsedSections.filter(
        (section) =>
          !section.data_type.includes("Education and Career") &&
          !section.data_type.includes("Leaves of Absence") &&
          !section.data_type.includes("Employment")
      )
    );
    setLoading(false);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // When user clicks a section, update the URL
  const handleManageClick = (value) => {
    const section = dataSections.find((section) => section.data_section_id === value);
    setActiveSection(section);
    if (section) {
      const categorySlug = slugify(section.data_type);
      const categorySlugClean = cleanSlugPrefix(categorySlug);
      const titleSlug = slugify(section.title);
      const titleSlugClean = cleanSlugPrefix(titleSlug);
      navigate(`/faculty/academic-work/${categorySlugClean}/${titleSlugClean}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  // Enhanced search: if no match in selected tab, show matches from other categories distinctly
  const search = searchTerm.toLowerCase();
  const matchesInTab = dataSections.filter((entry) => {
    const section = entry.title || "";
    const category = entry.data_type || "";
    const info = entry.info || "";
    const matchesSearch =
      section.toLowerCase().includes(search) ||
      category.toLowerCase().includes(search) ||
      info.toLowerCase().includes(search);
    const matchesFilter = !activeTab || category === activeTab;
    return matchesSearch && matchesFilter;
  });

  let searchedSections = matchesInTab;
  let otherCategorySections = [];
  if (searchTerm && activeTab && matchesInTab.length === 0) {
    // Show matches from other categories
    otherCategorySections = dataSections.filter((entry) => {
      const section = entry.title || "";
      const category = entry.data_type || "";
      const info = entry.info || "";
      const matchesSearch =
        section.toLowerCase().includes(search) ||
        category.toLowerCase().includes(search) ||
        info.toLowerCase().includes(search);
      return matchesSearch && category !== activeTab;
    });
  }

  // Use category from URL for filtering
  useEffect(() => {
    if (category) {
      // Find the original category name from slug
      const matched = filters.find((f) => {
        const fullSlug = slugify(f);
        const cleanedSlug = cleanSlugPrefix(fullSlug);
        return fullSlug === category || cleanedSlug === category;
      });
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
        <div className="flex flex-wrap gap-3 mb-4 max-w-full">
          <button
            className={`text-md font-bold px-5 py-2 rounded-lg transition-colors duration-200 min-w-max whitespace-nowrap ${
              activeFilter === null ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => onSelect(null)}
          >
            All
          </button>
          {[...filters].sort(naturalSort).map((filter) => (
            <button
              key={filter}
              className={`text-md font-bold px-5 py-2 rounded-lg transition-colors duration-200 min-w-max whitespace-nowrap ${
                activeFilter === filter
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => onSelect(filter)}
            >
              {filter.split(".")[1] ? filter.split(".")[1].trim() : filter}
            </button>
          ))}
        </div>
        {showDesc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-lg max-w-xl w-full p-6 relative">
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
      <FacultyMenu
        userName={userInfo.preferred_name || userInfo.first_name}
        getCognitoUser={getCognitoUser}
        toggleViewMode={toggleViewMode}
        userInfo={userInfo}
      />
      <main
        className="overflow-y-auto custom-scrollbar my-2 w-full relative"
      >
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <>
            {activeSection === null ? (
              <div className="!overflow-auto !h-full rounded-lg w-full mx-auto">
                <h1 className="text-left mb-2 text-4xl mt-2 font-bold text-zinc-600">Academic Work</h1>
                {/* Search bar for filtering sections */}
                <div className="mb-4 flex justify-start items-left">
                  <label className="input input-bordered flex items-left gap-2 flex-1">
                    <input
                      type="text"
                      className="grow"
                      placeholder="Search Academic Works descriptions only. CV data can be searched in the ‘Search CV’ section."
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
                {searchedSections.sort(sectionTitleSort).map((section) => (
                  <WorkSection
                    onClick={handleManageClick}
                    key={section.data_section_id}
                    id={section.data_section_id}
                    title={section.title}
                    category={section.data_type}
                    info={section.info}
                  />
                ))}
                {/* If no results in tab, show matches from other categories distinctly */}
                {searchTerm && activeTab && searchedSections.length === 0 && otherCategorySections.length > 0 && (
                  <div className="mt-6 px-2">
                    <div className="text-sm font-normal text-gray-600 mb-2 text-center py-2">No results found for search in selected category.</div>
                    <div className="text-md font-semibold text-gray-600 mb-2">Showing results from other categories:</div>
                    {otherCategorySections.sort(sectionTitleSort).map((section) => {
                      // Clean category name similar to tab cleaning
                      const cat = section.data_type;
                      const catParts = cat.split(".");
                      let cleanedCat = catParts[1] ? catParts[1].trim() : cat;
                      return (
                        <div
                          key={section.data_section_id}
                          className="border-l-4 border-yellow-400 bg-yellow-50 p-2 mb-2 rounded"
                        >
                          <div className="text-xs text-yellow-700 mb-1">{cleanedCat}</div>
                          <WorkSection
                            onClick={handleManageClick}
                            id={section.data_section_id}
                            title={section.title}
                            category={section.data_type}
                            info={section.info}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="!overflow-auto !h-full custom-scrollbar w-full mx-auto">
                {activeSection.title === "Journal Publications" && (
                  <PublicationsSection user={userInfo} section={activeSection} onBack={handleBack} />
                )}
                {activeSection.title.includes("Patents") && (
                  <PatentsSection user={userInfo} section={activeSection} onBack={handleBack} />
                )}
                {activeSection.title.includes("Research or Equivalent Grants") && (
                  <SecureFundingSection user={userInfo} section={activeSection} onBack={handleBack} />
                )}
                {!(
                  activeSection.title === "Journal Publications" ||
                  activeSection.title.includes("Patents") ||
                  activeSection.title.includes("Research or Equivalent Grants")
                ) && <GenericSection user={userInfo} section={activeSection} onBack={handleBack} />}
              </div>
            )}
          </>
        )}
      </main>
    </PageContainer>
  );
};

function slugify(str) {
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export default AcademicWork;
