import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import CoursesTaughtSection from "../../../Components/CoursesTaughtSection"
import EducationSection from "../../../Components/EducationSection"
import EmploymentSection from "../../../Components/EmploymentSection"
import { useApp } from "../../../Contexts/AppContext"
import { Accordion } from "../../../SharedComponents/Accordion/Accordion"
import { AccordionItem } from "../../../SharedComponents/Accordion/AccordionItem"
import GenericSection from "../../../SharedComponents/GenericSection/GenericSection"
import { useFaculty } from "../FacultyContext"
import Affiliations from "../Affiliations";
import Profile from "../Profile/Profile";

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
    switch (category) {
      case CATEGORIES.EMPLOYMENT:
        return ["Employment History", "Leaves of Absence"];

      // case CATEGORIES.SERVICE:
      //   return [
      //     "Consultant",
      //     "Editorships",
      //     "External Examiner",
      //     "Memberships on Community Committees",
      //     "Memberships on Community Societies",
      //     "Memberships on Hospital Committees",
      //     "Memberships on University Committees",
      //     "Other University Service",
      //     "Other Hospital Service",
      //     "Other Service",
      //     "Reviewer",
      //   ];

      // case CATEGORIES.TEACHING:
      //   return [
      //     "Teaching Interests",
      //     "Courses Taught",
      //     "Other Teaching",
      //     "Undergraduate Students Supervised",
      //     "Graduate Students Supervised",
      //     "Graduate Students Supervisory Committee",
      //     "Postgraduate Students Supervised",
      //     "Students Supervised - Other",
      //     "Continuing Education Activities",
      //     "Visiting Lecturer",
      //   ];

      // case CATEGORIES.AWARDS:
      //   return [
      //     "Teaching Awards",
      //     "Service Awards",
      //     "Research Awards",
      //     "Other Awards",
      //     "Scholarships",
      //   ];

      case CATEGORIES.EDUCATION:
        return [
          "Post-Secondary Education",
          "Continuing Education or Training",
          "Continuing Medical Education",
          "Professional Qualifications, Certifications and Licenses",
          "Dissertations",
        ];

      default:
        return [];
    }
  };

  const getSection = (category, index) => {
    return (
      <>
        {activeTab === category && (
          <Accordion key={index}>
            {/* Filter out the sections which use custom modals from the list */}
            {getTitlesForCategory(category)
              .filter(
                (title) =>
                  title !== "Courses Taught" &&
                  title !== "Post-Secondary Education" &&
                  title !== "Employment History"
              )
              .map((title, innerIndex) => (
                // send remaining sections to GenericSection
                <AccordionItem key={index + "" + innerIndex} title={title}>
                  <GenericSection
                    key={innerIndex}
                    section={
                      academicSections.filter((s) => s.title === title)[0]
                    }
                    onBack={null}
                  />
                </AccordionItem>
              ))}
            {activeTab === "Education" && (
              <AccordionItem
                key="Post-Secondary Education"
                title={"Post-Secondary Education"}
              >
                <EducationSection
                  user={userInfo}
                  section={
                    academicSections.filter(
                      (s) => s.title === "Post-Secondary Education"
                    )[0]
                  }
                  onBack={undefined}
                ></EducationSection>
              </AccordionItem>
            )}
            {activeTab === "Employment" && (
              <AccordionItem
                key="Employment History"
                title={"Employment History"}
              >
                <EmploymentSection
                  user={userInfo}
                  section={
                    academicSections.filter(
                      (s) => s.title === "Employment History"
                    )[0]
                  }
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
              activeTab === title
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
        {Object.values(CATEGORIES).map((category, index) =>
          getSection(category, index)
        )}
        {activeTab === "Affiliations" && <Affiliations />}
        {activeTab === "Profile" && <Profile />}
      </div>
    </div>
  );
};

export default Tabs
