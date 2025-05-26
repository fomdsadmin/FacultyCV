"use client"

import { Accordion } from "../../../SharedComponents/Accordion/Accordion"
import { AccordionItem } from "../../../SharedComponents/Accordion/AccordionItem"
import GenericSection from "../../../SharedComponents/GenericSection/GenericSection"
import { useFaculty } from "../FacultyContext"
import InstitutionInfo from "../Profile/InstitutionInfo"
import Linkages from "../Profile/Linkages/Linkages"

const Tabs = () => {
    const { activeTab, setActiveTab, academicSections, CATEGORIES } = useFaculty()

    const getTitlesForCategory = (category) => {
        switch (category) {
            case CATEGORIES.EMPLOYMENT:
                return ["Prior Employment", "Present Employment", "Leaves of Absence"]

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
                ]

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
                    "Continuing Education or Training",
                    "Continuing Medical Education",
                    "Visiting Lecturer",
                ]

            case CATEGORIES.EDUCATION:
                return [
                    "Post-Secondary Education",
                    "Continuing Education or Training",
                    "Continuing Medical Education",
                    "Professional Qualifications, Certifications and Licenses",
                    "Dissertations",
                ]

            case CATEGORIES.AWARDS:
                return ["Teaching Awards", "Service Awards", "Research Awards", "Other Awards", "Scholarships"]

            default:
                return []
        }
    }

    const getSection = (category, index) => {
        return (
            <>
                {activeTab === category && (
                    <Accordion key={index}>
                        {getTitlesForCategory(category).map((title, innerIndex) => (
                            <AccordionItem key={index + "" + innerIndex} title={title}>
                                <GenericSection
                                    key={innerIndex}
                                    section={academicSections.filter((s) => s.title === title)[0]}
                                    onBack={null}
                                />
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </>
        )
    }

    return (
        <div className="mt-12 pr-5">
            <div className="flex space-x-4 mb-4 overflow-x-auto max-w-[100%]">
                {Object.values(CATEGORIES).map((title) => (
                    <button
                        key={title}
                        className={`text-lg font-bold px-5 py-2 rounded-lg transition-colors duration-200 ${activeTab === title ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        onClick={() => setActiveTab(title)}
                    >
                        {title}
                    </button>
                ))}
            </div>

            <div className="border border-gray-200 rounded-md bg-white p-4">
                {Object.values(CATEGORIES).map((category, index) => getSection(category, index))}
                {activeTab === "Affiliations" && <InstitutionInfo />}
                {activeTab === "Linkages" && <Linkages />}
            </div>
        </div>
    )
}

export default Tabs
