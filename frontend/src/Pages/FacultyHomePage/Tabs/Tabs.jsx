import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import EducationSection from "../../../Components/EducationSection";
import EmploymentSection from "../../../Components/EmploymentSection";
import { useApp } from "../../../Contexts/AppContext";
import GenericSection from "../../../SharedComponents/GenericSection/GenericSection";
import { useFaculty } from "../FacultyContext";
import Affiliations from "../Affiliations/Affiliations";
import Profile from "../Profile/Profile";

// WorkSection component for Education and Employment sections
const WorkSection = ({ onClick, title, category, info }) => {
  const handleClick = () => {
    onClick(title);
  };

  const arr = title.split(".");
  const name = arr[arr.length - 1];

  return (
    <div className="bg-base-100 my-2 mx-1 p-3 shadow-glow rounded-lg">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex flex-col justify-center">
          <h3 className="card-title">{name ? name.trim() : title}</h3>
          <p className="text-sm text-gray-600">{info}</p>
        </div>
        <div className="card-actions flex flex-row gap-2 self-end md:self-auto">
          <button onClick={handleClick} className="text-white bg-blue-600 hover:bg-blue-700 btn min-h-0 h-8 leading-tight border-none">
            Manage
          </button>
        </div>
      </div>
    </div>
  );
};

const Tabs = ({ tab }) => {
  const { academicSections } = useFaculty();

  const CATEGORIES = Object.freeze({
    PROFILE: "Profile",
    AFFILIATIONS: "Affiliations",
    EDUCATION: "Education",
    EMPLOYMENT: "Employment",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { sectionTitle } = useParams();

  const [activeTab, setActiveTab] = useState(CATEGORIES.PROFILE);
  const [activeSection, setActiveSection] = useState(null);

  // Set active tab based on prop or pathname
  useEffect(() => {
    if (tab) {
      setActiveTab(tab.charAt(0).toUpperCase() + tab.slice(1));
    } else if (location.pathname === "/faculty/home") {
      setActiveTab(CATEGORIES.PROFILE);
    } else if (location.pathname === "/faculty/home/affiliations") {
      setActiveTab(CATEGORIES.AFFILIATIONS);
    } else if (location.pathname.includes("/faculty/home/employment")) {
      setActiveTab(CATEGORIES.EMPLOYMENT);
    } else if (location.pathname.includes("/faculty/home/education")) {
      setActiveTab(CATEGORIES.EDUCATION);
    }
  }, [location.pathname, tab]);

  // Handle section parameter from URL
  useEffect(() => {
    if (sectionTitle && academicSections.length > 0) {
      // Convert URL slug back to section title and find the section
      const decodedTitle = decodeURIComponent(sectionTitle).replace(/-/g, ' ');
      const section = academicSections.find((s) => 
        s.title.toLowerCase().includes(decodedTitle.toLowerCase()) ||
        slugify(s.title).includes(sectionTitle)
      );
      if (section) {
        setActiveSection(section);
      }
    } else {
      setActiveSection(null);
    }
  }, [sectionTitle, academicSections]);

  const { userInfo } = useApp();

  // Handle manage click for sections - navigate to section URL
  const handleManageClick = (sectionTitle) => {
    const section = academicSections.find((s) => s.title.includes(sectionTitle));
    if (section) {
      const titleSlug = slugify(sectionTitle);
      if (activeTab.includes("Education")) {
        navigate(`/faculty/home/education/${titleSlug}`);
      } else if (activeTab.includes("Employment")) {
        navigate(`/faculty/home/employment/${titleSlug}`);
      }
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (activeTab.includes("Education")) {
      navigate("/faculty/home/education");
    } else if (activeTab.includes("Employment")) {
      navigate("/faculty/home/employment");
    }
    setActiveSection(null);
  };

  // Slugify function to convert strings to URL-friendly format
  function slugify(str) {
    return str
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  }

  const getTitlesForCategory = (category) => {
    if (category.includes("Education")) {
      return [
        "5a. Post-Secondary Education",
        "5c. Continuing Education or Training",
        "5d. Continuing Medical Education",
        "5e. Professional Qualifications, Certifications and Licenses",
        "5b. Dissertations",
      ];
    }
    if (category.includes("Employment")) {
      return ["Employment Record", "Leaves of Absence"];
    }

    return [];
  };

  const getSection = (category, index) => {
    // Only show section cards when no active section is selected
    return (
      <>
        {activeTab.includes(category) && !activeSection && (
          <div key={index}>
            {/* Show WorkSection cards for Education and Employment */}
            {(activeTab.includes("Education") || activeTab.includes("Employment")) && (
              <div className="space-y-2">
                {getTitlesForCategory(category).map((title) => {
                  const section = academicSections.find((s) => s.title.includes(title));
                  if (!section) return null;
                  
                  return (
                    <WorkSection
                      key={title}
                      onClick={handleManageClick}
                      title={title}
                      category={activeTab}
                      info={section.description || ""}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  const renderActiveSection = () => {
    if (!activeSection) return null;

    if (activeSection.title.includes("Post-Secondary Education")) {
      return (
        <EducationSection
          key={activeSection.data_section_id}
          user={userInfo}
          section={activeSection}
          onBack={handleBack}
        />
      );
    } else if (activeSection.title.includes("Employment Record")) {
      return (
        <EmploymentSection
          key={activeSection.data_section_id}
          user={userInfo}
          section={activeSection}
          onBack={handleBack}
        />
      );
    } else {
      return (
        <GenericSection
          key={activeSection.data_section_id}
          user={userInfo}
          section={activeSection}
          onBack={handleBack}
        />
      );
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4 mb-4">
        {Object.values(CATEGORIES).map((title) => (
          <button
            key={title}
            className={`text-md xl:text-lg font-bold px-5 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap ${
              activeTab === title ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => {
              setActiveTab(title);
              if (title === CATEGORIES.PROFILE) {
                navigate("/faculty/home");
              } else if (title === CATEGORIES.AFFILIATIONS) {
                navigate("/faculty/home/affiliations");
              } else if (title === CATEGORIES.EMPLOYMENT) {
                navigate("/faculty/home/employment");
              } else if (title === CATEGORIES.EDUCATION) {
                navigate("/faculty/home/education");
              }
            }}
          >
            {title}
          </button>
        ))}
      </div>

      <div className="border border-gray-200 rounded-md bg-white p-4 w-full">
        {/* If we have an active section, show only that section */}
        {activeSection ? (
          <div className="w-full">
            {renderActiveSection()}
          </div>
        ) : (
          /* Otherwise show the normal tab content */
          <div className="w-full">
            {Object.values(CATEGORIES).map((category, index) => getSection(category, index))}
            {activeTab === "Affiliations" && <Affiliations />}
            {activeTab === "Profile" && <Profile />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;
