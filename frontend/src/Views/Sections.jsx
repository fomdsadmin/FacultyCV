import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageContainer from "./PageContainer.jsx";
import AdminMenu from "../Components/AdminMenu.jsx";
import { getAllSections } from "../graphql/graphqlHelpers.js";
import Filters from "../Components/Filters.jsx";
import WorkSection from "../Components/WorkSection.jsx";
import ManageSection from "../Components/ManageSection.jsx";
import NewSection from "../Components/NewSection.jsx";

const Sections = ({ getCognitoUser, userInfo }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [dataSections, setDataSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNewSection, setOpenNewSection] = useState(false);
  const navigate = useNavigate();
  const { category, title } = useParams();
  const location = useLocation();

  useEffect(() => {
    getDataSections();
  }, []);

  const getDataSections = async () => {
    setDataSections([]);
    const retrievedSections = await getAllSections();

    const parsedSections = retrievedSections.map((section) => ({
      ...section,
      attributes: JSON.parse(section.attributes),
      attributes_type: JSON.parse(section.attributes_type || "{}"),
    }));

    parsedSections.sort((a, b) => a.title.localeCompare(b.title));

    setDataSections(parsedSections);
    setLoading(false);
  };

  // Open section if URL param is present
  useEffect(() => {
    if (title && dataSections.length > 0) {
      const found = dataSections.find((s) => slugify(s.title) === title && slugify(s.data_type) === category);
      if (found) setActiveSection(found);
    }
  }, [title, category, dataSections]);

  const filters = Array.from(new Set(dataSections.map((section) => section.data_type)));
  // Set active tab from URL param
  useEffect(() => {
    if (category && filters.length > 0) {
      const matched = filters.find((f) => slugify(f) === category);
      setActiveTab(matched || null);
    } else if (!category) {
      setActiveTab(null);
    }
    if (!title) setActiveSection(null);
  }, [category, filters, title]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };


  // Tab bar for categories
  const SectionTabs = ({ filters, activeFilter, onSelect }) => (
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
            activeFilter === filter ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => onSelect(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );

  // When user clicks a tab, update the URL and filter
  const handleTabSelect = (selectedCategory) => {
    setActiveTab(selectedCategory);
    setActiveSection(null);
    if (!selectedCategory) {
      navigate("/sections");
    } else {
      const categorySlug = slugify(selectedCategory);
      navigate(`/sections/${categorySlug}`);
    }
  };

  // When user clicks a section, update the URL
  const handleManageClick = (value) => {
    const section = dataSections.find((section) => section.data_section_id == value);
    setActiveSection(section);
    if (section) {
      const categorySlug = slugify(section.data_type);
      const titleSlug = slugify(section.title);
      navigate(`/sections/${categorySlug}/${titleSlug}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const searchedSections = dataSections.filter((entry) => {
    const section = entry.title || "";
    const category = entry.data_type || "";
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      section.toLowerCase().includes(search) ||
      category.toLowerCase().includes(search);

    const matchesFilter =
      (!activeTab || category === activeTab) &&
      (activeFilters.length === 0 || !activeFilters.includes(category));

    return matchesSearch && matchesFilter;
  });

  // When user clicks back, return to /sections/:category if tab is selected, else /sections
  const handleBack = () => {
    setActiveSection(null);
    if (activeTab) {
      const categorySlug = slugify(activeTab);
      navigate(`/sections/${categorySlug}`);
    } else {
      navigate("/sections");
    }
  };

  const handleAddNewSection = () => {
    setOpenNewSection(true);
    navigate("/sections/manage");
  };

  const handleBackFromNewSection = () => {
    setOpenNewSection(false);
    if (activeTab) {
      const categorySlug = slugify(activeTab);
      navigate(`/sections/${categorySlug}`);
    } else {
      navigate("/sections");
    }
  };

  // Close new section drawer if navigated away
  useEffect(() => {
    if (location.pathname === "/sections/manage") {
      setOpenNewSection(true);
    } else {
      setOpenNewSection(false);
    }
  }, [location.pathname]);

  function slugify(str) {
    return str
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  }

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
    const match = title.match(/^(\d+)([a-z])?(?:\.([0-9]+))?(?:\[(.*?)\])?/i);
    let num = match ? parseInt(match[1], 10) : null;
    let letter = match && match[2] ? match[2] : "";
    let subnum = match && match[3] ? parseInt(match[3], 10) : null;
    let bracket = match && match[4] ? match[4] : "";
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
        const [start, end] = A.bracket.split("-").map(s => s.trim());
        if (B.letter >= start && (!end || B.letter <= end)) return -1;
        // Otherwise, sort by letter
        return A.letterIndex.localeCompare(B.letter);
      }
      if (A.letter && B.bracket) {
        const [start, end] = B.bracket.split("-").map(s => s.trim());
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

  return (
    <PageContainer>
      <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className="px-12 mt-4 overflow-auto custom-scrollbar w-full mb-4">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <>
            {openNewSection ? (
              <NewSection onBack={handleBackFromNewSection} getDataSections={getDataSections} sections={dataSections} />
            ) : activeSection === null ? (
              <div className="!overflow-auto !h-full custom-scrollbar">
                <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Manage Faculty Sections</h1>
                <button className="btn btn-info text-white m-4" onClick={handleAddNewSection}>
                  Add New Section
                </button>
                <div className="m-4 flex">
                  <label className="input input-bordered flex items-center gap-2 flex-1">
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
                      className="h-4 w-4 opacity-70"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </label>
                </div>
                <SectionTabs filters={filters} activeFilter={activeTab} onSelect={handleTabSelect} />
                {/* <Filters
                  activeFilters={activeFilters}
                  onFilterChange={setActiveFilters}
                  filters={filters}
                /> */}
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
              <div className="!overflow-auto !h-full custom-scrollbar">
                <ManageSection section={activeSection} onBack={handleBack} getDataSections={getDataSections} />
              </div>
            )}
          </>
        )}
      </main>
    </PageContainer>
  );
};

export default Sections;
