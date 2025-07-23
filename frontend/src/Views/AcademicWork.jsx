import React, { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import FacultyMenu from "../Components/FacultyMenu";
import WorkSection from "../Components/WorkSection";
import "../CustomStyles/scrollbar.css";
import GenericSection from "../SharedComponents/GenericSection/GenericSection.jsx";
import SecureFundingSection from "../Components/SecureFundingSection.jsx";
import PublicationsSection from "../Components/PublicationsSection.jsx";
import PatentsSection from "../Components/PatentsSection.jsx";
import { getAllSections } from "../graphql/graphqlHelpers.js";
import { useNavigate, useParams } from "react-router-dom";

// Natural sort function for titles/categories with leading numbers
function naturalSort(a, b) {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);
  const hasNumA = !isNaN(numA);
  const hasNumB = !isNaN(numB);

  if (hasNumA && hasNumB) {
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  }
  if (hasNumA) return -1;
  if (hasNumB) return 1;
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function parseSectionTitle(title) {
  // Match: 8a., 8b.1., 8[f-i]., 8., etc.
  // Groups: [number][letter][subnumber][bracket]
  const match = title.match(/^(\d+)([a-z])?(?:\.([0-9]+))?(?:\[(.*?)\])?/i);
  let num = match ? parseInt(match[1], 10) : null;
  let letter = match && match[2] ? match[2] : "";
  let subnum = match && match[3] ? parseInt(match[3], 10) : null;
  let bracket = match && match[4] ? match[4] : "";

  // If bracket, get the start letter (e.g. 'f' from 'f-i')
  let letterIndex = "";
  if (bracket) {
    letterIndex = bracket.split("-")[0].trim();
  }

  return { num, letter, subnum, bracket, letterIndex, raw: title };
}

function sectionTitleSort(a, b) {
  const A = parseSectionTitle(a.title);
  const B = parseSectionTitle(b.title);

  // 1. Sort by number
  if (A.num !== null && B.num !== null) {
    if (A.num !== B.num) return A.num - B.num;

    // 2. If both have brackets, sort by start letter
    if (A.bracket && B.bracket) {
      return A.letterIndex.localeCompare(B.letterIndex);
    }

    // 3. If one has bracket and the other is a single letter
    if (A.bracket && B.letter) {
      // If B.letter is in A.bracket range, bracket comes first
      const [start, end] = A.bracket.split("-").map((s) => s.trim());
      if (B.letter >= start && (!end || B.letter <= end)) return -1;
      // Otherwise, sort by letter
      return A.letterIndex.localeCompare(B.letter);
    }
    if (A.letter && B.bracket) {
      const [start, end] = B.bracket.split("-").map((s) => s.trim());
      if (A.letter >= start && (!end || A.letter <= end)) return 1;
      return A.letter.localeCompare(B.letterIndex);
    }

    // 4. If both are single letters, sort alphabetically
    if (A.letter && B.letter) {
      if (A.letter !== B.letter) return A.letter.localeCompare(B.letter);
    }

    // 5. Subnumber
    if ((A.subnum || 0) !== (B.subnum || 0)) return (A.subnum || 0) - (B.subnum || 0);

    // 6. Fallback
    return A.raw.localeCompare(B.raw, undefined, { sensitivity: "base" });
  }

  // Numbered comes before non-numbered
  if (A.num !== null) return -1;
  if (B.num !== null) return 1;
  return A.raw.localeCompare(B.raw, undefined, { sensitivity: "base" });
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
      let categorySlugClean = "";
      // 12-scholarly-and-professional-activities -> scholarly-and-professional-activities
      // publications-and-patents -> publications-and-patents
      if (categorySlug.split("-")[0].match(/\d/)) {
        // Category slug with number prefix
        categorySlugClean = categorySlug.split("-").slice(1).join("-");
      } else {
        // Category slug without number prefix
        categorySlugClean = categorySlug;
      }
      // fix for categories that have a number prefix
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
      let categorySlugClean = "";
      if (categorySlug.split("-")[0].match(/\d/)) {
        // Category slug with number prefix
        categorySlugClean = categorySlug.split("-").slice(1).join("-");
      } else {
        // Category slug without number prefix
        categorySlugClean = categorySlug;
      }
      const titleSlug = slugify(section.title);
      let titleSlugClean = "";
      if (titleSlug.split("-")[0].match(/\d/)) {
        // Title slug with number prefix (e.g., 8a, 8c-d, 8)
        titleSlugClean = titleSlug.split("-").slice(1).join("-");
      } else {
        // Title slug without number prefix
        titleSlugClean = titleSlug;
      }
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

  const searchedSections = dataSections.filter((entry) => {
    const section = entry.title || "";
    const category = entry.data_type || "";
    const info = entry.info || "";
    const search = searchTerm.toLowerCase();
    const matchesSearch = section.toLowerCase().includes(search) || 
                         category.toLowerCase().includes(search) || 
                         info.toLowerCase().includes(search);
    const matchesFilter = !activeTab || category === activeTab;
    return matchesSearch && matchesFilter;
  });

  // Use category from URL for filtering
  useEffect(() => {
    if (category) {
      // Find the original category name from slug
      const matched = filters.find((f) => {
        const fullSlug = slugify(f);
        const cleanedSlug = fullSlug.split("-")[0].match(/\d/) 
          ? fullSlug.split("-").slice(1).join("-") 
          : fullSlug;
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
        <div className="flex flex-wrap gap-4 mb-6 px-4 max-w-full">
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
      <FacultyMenu
        userName={userInfo.preferred_name || userInfo.first_name}
        getCognitoUser={getCognitoUser}
        toggleViewMode={toggleViewMode}
        userInfo={userInfo}
      />
      <main
        className="px-[1vw] xs:px-[1vw] sm:px-[2vw] md:px-[2vw] lg:px-[2vw] 
                       xl:px-[5vw] 2xl:px-[8vw] overflow-y-auto custom-scrollbar
                       mt-4 w-full mb-4 relative"
      >
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <>
            {activeSection === null ? (
              <div className="!overflow-auto !h-full rounded-lg w-full mx-auto">
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
                {[...searchedSections].sort(sectionTitleSort).map((section) => (
                  <WorkSection
                    onClick={handleManageClick}
                    key={section.data_section_id}
                    id={section.data_section_id}
                    title={section.title}
                    category={section.data_type}
                    info={section.info}
                  />
                ))}
              </div>
            ) : (
              <div className="!overflow-auto !h-full custom-scrollbar max-w-6xl w-full mx-auto">
                {activeSection.title === "Publications" && (
                  <PublicationsSection user={userInfo} section={activeSection} onBack={handleBack} />
                )}
                {activeSection.title.includes("Patents") && (
                  <PatentsSection user={userInfo} section={activeSection} onBack={handleBack} />
                )}
                {activeSection.title.includes("Research or Equivalent Grants") && (
                  <SecureFundingSection user={userInfo} section={activeSection} onBack={handleBack} />
                )}
                {!(
                  activeSection.title === "Publications" ||
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
