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
import Affiliations from "../Affiliations";
import Profile from "../Profile/Profile";
import { get } from "aws-amplify/api";


const Tabs = () => {
  const { academicSections } = useFaculty();

  const CATEGORIES = Object.freeze({
    PROFILE: "Profile",
    AFFILIATIONS: "Affiliations",
    EMPLOYMENT: "Employment",
    EDUCATION: "Education",
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
    if (category.includes("Employment")) {
      return ["Employment Record", "Leaves of Absence"];
    }
    if (category.includes("Education")) {
      return [
        "Post-Secondary Education",
        "Continuing Education or Training",
        "Continuing Medical Education",
        "Professional Qualifications, Certifications and Licenses",
        "Dissertations",
      ];
    }

    return [];

  };

  const getSection = (category, index) => {
    return (
      <>
        {activeTab.includes(category) && (
          <Accordion key={index}>
            {/* Filter out the sections which use custom modals from the list */}
            {getTitlesForCategory(category)
              .filter(
                (title) =>
                  title !== "Courses Taught" &&
                  title !== "Post-Secondary Education" &&
                  title !== "Employment Record"
              )
              .map((title, innerIndex) => (
                // send remaining sections to GenericSection
                <AccordionItem key={title} title={title}>
                  <GenericSection section={academicSections.filter((s) => s.title.includes(title))[0]} onBack={null} />
                </AccordionItem>
              ))}
            {activeTab.includes("Education") && (
              <AccordionItem key="Post-Secondary Education" title={"Post-Secondary Education"}>
                <EducationSection
                  user={userInfo}
                  section={academicSections.filter((s) => s.title.includes("Post-Secondary Education"))[0]}
                  onBack={undefined}
                ></EducationSection>
              </AccordionItem>
            )}
            {activeTab.includes("Employment") && (
              <AccordionItem key="Employment Record" title={"Employment Record"}>
                <EmploymentSection
                  user={userInfo}
                  section={academicSections.filter((s) => s.title.includes("Employment Record"))[0]}
                  onBack={undefined}
                ></EmploymentSection>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </>
    );
  };

  return (
    <div className="mt-6 pr-5">
      <div className="flex space-x-4 mb-4 overflow-x-auto max-w-[100%]">
        {Object.values(CATEGORIES).map((title) => (
          <button
            key={title}
            className={`text-lg font-bold px-5 py-2 rounded-lg transition-colors duration-200 ${
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

      <div className="border border-gray-200 rounded-md bg-white p-4">
        {Object.values(CATEGORIES).map((category, index) => getSection(category, index))}
        {activeTab === "Affiliations" && <Affiliations />}
        {activeTab === "Profile" && <Profile />}
      </div>
    </div>
  );
};

export default Tabs;
