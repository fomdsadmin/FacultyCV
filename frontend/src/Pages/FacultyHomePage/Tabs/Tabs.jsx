import { useState } from "react"
import CoursesTaughtSection from "../../../Components/CoursesTaughtSection"
import EducationSection from "../../../Components/EducationSection"
import EmploymentSection from "../../../Components/EmploymentSection"
import { useApp } from "../../../Contexts/AppContext"
import { Accordion } from "../../../SharedComponents/Accordion/Accordion"
import { AccordionItem } from "../../../SharedComponents/Accordion/AccordionItem"
import GenericSection from "../../../SharedComponents/GenericSection/GenericSection"
import { useFaculty } from "../FacultyContext"
import InstitutionInfo from "../Profile/InstitutionInfo";
import Profile from "../Profile/Profile";

const Tabs = () => {
  const { academicSections } = useFaculty();

  const CATEGORIES = Object.freeze({
    PROFILE: "Profile",
    AFFILIATIONS: "Affiliations",
    EMPLOYMENT: "Employment",
    SERVICE: "Service",
    TEACHING: "Teaching",
    EDUCATION: "Education",
    AWARDS: "Awards",
  });

  const [activeTab, setActiveTab] = useState(CATEGORIES.PROFILE);

  const { userInfo } = useApp();

  const getTitlesForCategory = (category) => {
    switch (category) {
      case CATEGORIES.EMPLOYMENT:
        return ["Prior Employment", "Present Employment", "Leaves of Absence"];

      case CATEGORIES.SERVICE:
        return [
          "Consultant",
          "Editorships",
          "External Examiner",
          "Memberships on Community Committees",
          "Memberships on Community Societies",
          "Memberships on Hospital Committees",
          "Memberships on University Committees",
          "Other University Service",
          "Other Hospital Service",
          "Other Service",
          "Reviewer",
        ];

      case CATEGORIES.TEACHING:
        return [
          "Teaching Interests",
          "Courses Taught",
          "Other Teaching",
          "Undergraduate Students Supervised",
          "Graduate Students Supervised",
          "Graduate Students Supervisory Committee",
          "Postgraduate Students Supervised",
          "Students Supervised - Other",
          "Continuing Education Activities",
          "Visiting Lecturer",
        ];

      case CATEGORIES.EDUCATION:
        return [
          "Post-Secondary Education",
          "Continuing Education or Training",
          "Continuing Medical Education",
          "Professional Qualifications, Certifications and Licenses",
          "Dissertations",
        ];

      case CATEGORIES.AWARDS:
        return [
          "Teaching Awards",
          "Service Awards",
          "Research Awards",
          "Other Awards",
          "Scholarships",
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
            {getTitlesForCategory(category)
              .filter(
                (title) =>
                  title !== "Courses Taught" &&
                  title !== "Post-Secondary Education" &&
                  title !== "Prior Employment"
              )
              .map((title, innerIndex) => (
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
              <AccordionItem key="Courses Taught" title={"Courses Taught"}>
                <CoursesTaughtSection
                  userInfo={userInfo}
                  section={
                    academicSections.filter(
                      (s) => s.title === "Courses Taught"
                    )[0]
                  }
                  onBack={undefined}
                ></CoursesTaughtSection>
              </AccordionItem>
            )}
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
              <AccordionItem key="Prior Employment" title={"Prior Employment"}>
                <EmploymentSection
                  user={userInfo}
                  section={
                    academicSections.filter(
                      (s) => s.title === "Prior Employment"
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
            onClick={() => setActiveTab(title)}
          >
            {title}
          </button>
        ))}
      </div>

      <div className="border border-gray-200 rounded-md bg-white p-4">
        {Object.values(CATEGORIES).map((category, index) =>
          getSection(category, index)
        )}
        {activeTab === "Affiliations" && <InstitutionInfo />}
        {activeTab === "Profile" && <Profile />}
      </div>
    </div>
  );
};

export default Tabs
