import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CoursesTaughtSection from "../../../Components/CoursesTaughtSection";
import EducationSection from "../../../Components/EducationSection";
import EmploymentSection from "../../../Components/EmploymentSection";
import { useApp } from "../../../Contexts/AppContext";
import { Accordion } from "../../../SharedComponents/Accordion/Accordion";
import { AccordionItem } from "../../../SharedComponents/Accordion/AccordionItem";
import GenericSection from "../../../SharedComponents/GenericSection/GenericSection";
import { useFaculty } from "../FacultyContext";
import Affiliations from "../Affiliations/Affiliations";
import Profile from "../Profile/Profile";
import { get } from "aws-amplify/api";

const Tabs = () => {
  const { academicSections } = useFaculty();

  const CATEGORIES = Object.freeze({
    PROFILE: "Profile",
    AFFILIATIONS: "Affiliations",
    EDUCATION: "Education",
    EMPLOYMENT: "Employment",
  });

  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(CATEGORIES.PROFILE);

  useEffect(() => {
    if (location.pathname === "/faculty/home") {
      setActiveTab(CATEGORIES.PROFILE);
    } else if (location.pathname === "/faculty/home/affiliations") {
      setActiveTab(CATEGORIES.AFFILIATIONS);
    } else if (location.pathname === "/faculty/home/employment") {
      setActiveTab(CATEGORIES.EMPLOYMENT);
    } else if (location.pathname === "/faculty/home/education") {
      setActiveTab(CATEGORIES.EDUCATION);
    }
  }, [location.pathname]);

  const { userInfo } = useApp();

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
    return (
      <>
        {activeTab.includes(category) && (
          <Accordion key={index}>
            {/* Filter out the sections which use custom modals from the list */}
            {activeTab.includes("Employment") && (
              <AccordionItem key="Employment Record" title={"6. Employment Record"}>
                <EmploymentSection
                  user={userInfo}
                  section={academicSections.filter((s) => s.title.includes("Employment Record"))[0]}
                  onBack={undefined}
                ></EmploymentSection>
              </AccordionItem>
            )}
            {activeTab.includes("Education") && (
              <AccordionItem key="Post-Secondary Education" title={"5a. Post-Secondary Education"}>
                <EducationSection
                  user={userInfo}
                  section={academicSections.filter((s) => s.title.includes("Post-Secondary Education"))[0]}
                  onBack={undefined}
                ></EducationSection>
              </AccordionItem>
            )}
            {getTitlesForCategory(category)
              .filter(
                (title) =>
                  title !== "Courses Taught" &&
                  !title.includes("Post-Secondary Education") &&
                  !title.includes("Employment Record")
              )
              .sort((a, b) => {
                // Extract the prefix (e.g., "5a.", "5b.") and compare
                const getPrefix = (str) => {
                  const match = str.match(/^(\d+[a-z]?)/i);
                  return match ? match[1] : str;
                };
                return getPrefix(a).localeCompare(getPrefix(b), undefined, { numeric: true });
              })
              .map((title, innerIndex) => {
                // send remaining sections to GenericSection
                if (title.includes("Leaves of Absence")) {
                  return (
                    <AccordionItem key={title} title={"7. Leaves of Absence"}>
                      <GenericSection
                        section={academicSections.filter((s) => s.title.includes(title))[0]}
                        onBack={null}
                      />
                    </AccordionItem>
                  );
                } else {
                  return (
                    <AccordionItem key={title} title={title}>
                      <GenericSection
                        section={academicSections.filter((s) => s.title.includes(title))[0]}
                        onBack={null}
                      />
                    </AccordionItem>
                  );
                }
              })}
          </Accordion>
        )}
      </>
    );
  };

  return (
    <div className="w-full">
      <div className="flex space-x-4 mb-4 overflow-x-auto">
        {Object.values(CATEGORIES).map((title) => (
          <button
            key={title}
            className={`text-md xl:text-lg font-bold px-5 py-2 rounded-lg transition-colors duration-200 ${
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
        {Object.values(CATEGORIES).map((category, index) => getSection(category, index))}
        {activeTab === "Affiliations" && <Affiliations />}
        {activeTab === "Profile" && <Profile />}
      </div>
    </div>
  );
};

export default Tabs;
