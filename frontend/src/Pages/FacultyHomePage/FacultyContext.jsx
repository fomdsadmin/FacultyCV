import { createContext, useContext, useState, useEffect } from "react"
import { getAllUniversityInfo, getAllSections, getOrcidSections, updateUser } from "../../graphql/graphqlHelpers.js"
import { toast } from "react-toastify"

// Create the context
const FacultyContext = createContext(null)

// Custom hook to use the context
export const useFaculty = () => {
  const context = useContext(FacultyContext)
  if (!context) {
    throw new Error("useFaculty must be used within a FacultyProvider")
  }
  return context
}

// Provider component
export const FacultyProvider = ({ children, initialUserInfo, getUser, getCognitoUser, toggleViewMode }) => {

  const CATEGORIES = Object.freeze({
    AFFILIATIONS: "Affiliations",
    EMPLOYMENT: "Employment",
    SERVICE: "Service",
    TEACHING: "Teaching",
    EDUCATION: "Education",
    AWARDS: "Awards",
    LINKAGES: "Linkages"
  });

  // User state
  const [userInfo, setUserInfo] = useState(initialUserInfo)
  const [change, setChange] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Institution state
  const [departments, setDepartments] = useState([])
  const [affiliations, setAffiliations] = useState([])
  const [faculties, setFaculties] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [campuses, setCampuses] = useState([])
  const [ranks, setRanks] = useState([])
  const [loading, setLoading] = useState(true)

  // Academic sections state
  const [academicSections, setAcademicSections] = useState([])

  // UI state
  const [activeTab, setActiveTab] = useState("Education and Career")
  const [modalOpen, setModalOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null)

  // IDs state
  const [scopusId, setScopusId] = useState(initialUserInfo.scopus_id || "")
  const [orcidId, setOrcidId] = useState(initialUserInfo.orcid_id || "")

  // Fetch academic sections
  useEffect(() => {
    const fetchSections = async () => {
      const sections = await getAllSections()
      const parsed = sections.map((s) => ({
        ...s,
        attributes: JSON.parse(s.attributes),
      }))
      setAcademicSections(parsed)
    }
    fetchSections()
  }, [])

  // Fetch university info when userInfo changes
  useEffect(() => {
    sortUniversityInfo()
  }, [userInfo])

  // Sort university info
  const sortUniversityInfo = () => {
    getAllUniversityInfo().then((result) => {
      const depts = []
      const facs = []
      const camps = []
      const rnks = []
      const affils = []
      const insts = []

      result.forEach((element) => {
        if (element.type === "Department") {
          depts.push(element.value)
        } else if (element.type === "Faculty") {
          facs.push(element.value)
        } else if (element.type === "Campus") {
          camps.push(element.value)
        } else if (element.type === "Rank") {
          rnks.push(element.value)
        } else if (element.type === "Affiliation") {
          affils.push(element.value)
        } else if (element.type === "Institution") {
          insts.push(element.value)
        }
      })

      setDepartments(depts.sort())
      setFaculties(facs.sort())
      setCampuses(camps.sort())
      setRanks(rnks.sort())
      setAffiliations(affils.sort())
      setInstitutions(insts.sort())
      setLoading(false)
    })
  }

  // Handle input changes
  const handleInputChange = (event) => {
    const { name, value } = event.target
    setUserInfo((prevUserInfo) => ({
      ...prevUserInfo,
      [name]: value,
    }))
    setChange(true)
  }

  // Handle form submission
  const handleSubmit = async (event) => {
    if (event) event.preventDefault()
    setIsSubmitting(true)

    try {
      const sanitizedBio = sanitizeInput(userInfo.bio || "")
      await updateUser(
        userInfo.user_id,
        userInfo.first_name,
        userInfo.last_name,
        userInfo.preferred_name,
        userInfo.email,
        userInfo.role,
        sanitizedBio,
        userInfo.rank,
        userInfo.institution,
        userInfo.primary_department,
        userInfo.secondary_department,
        userInfo.primary_faculty,
        userInfo.secondary_faculty,
        userInfo.primary_affiliation,
        userInfo.secondary_affiliation,
        userInfo.campus,
        userInfo.keywords,
        userInfo.institution_user_id,
        scopusId,
        orcidId,
      )
      getUser(userInfo.email)
      setIsSubmitting(false)
      setChange(false)
    } catch (error) {
      console.error("Error updating user:", error)
      setIsSubmitting(false)
    }
  }

  // Sanitize input (this should be removed because graphql should take any input if done correctly)
  const sanitizeInput = (input) => {
    return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")
  }

  // Scopus and ORCID handlers
  const handleScopusIdClick = () => {
    setActiveModal("Scopus")
    setModalOpen(true)
  }

  const handleOrcidIdClick = () => {
    setActiveModal("Orcid")
    setModalOpen(true)
  }

  const handleClearScopusId = () => {
    setScopusId("")
    setChange(true)
  }

  const handleClearOrcidId = () => {
    setOrcidId("")
    setChange(true)
  }

  const handleScopusLink = (newScopusId) => {
    const updatedScopusId = scopusId ? `${scopusId},${newScopusId}` : newScopusId
    setScopusId(updatedScopusId)
    setModalOpen(false)
    setChange(true)
  }

  const handleOrcidLink = (newOrcidId) => {
    setOrcidId(newOrcidId)
    setModalOpen(false)
    setChange(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
  }

  // ORCID data fetching
  const getBio = async () => {
    try {
      const bio = await getOrcidSections(orcidId, "biography")
      if (bio && bio.bio) {
        setUserInfo((prevUserInfo) => ({
          ...prevUserInfo,
          bio: bio.bio,
        }))
        setChange(true)
        toast.success("Bio imported successfully!", { autoClose: 3000 })
      } else {
        toast.error("Failed to fetch the bio from ORCID.", { autoClose: 3000 })
      }
    } catch (error) {
      toast.error("An error occurred while fetching the bio.", { autoClose: 3000 })
    }
  }

  const getKeywords = async () => {
    try {
      const keywords_output = await getOrcidSections(orcidId, "keywords")
      if (keywords_output && keywords_output.keywords) {
        setUserInfo((prevUserInfo) => ({
          ...prevUserInfo,
          keywords: keywords_output.keywords,
        }))
        setChange(true)
        toast.success("Keywords imported successfully!", { autoClose: 3000 })
      } else {
        toast.error("Failed to fetch the keywords from ORCID.", { autoClose: 3000 })
      }
    } catch (error) {
      toast.error("An error occurred while fetching the keywords.", { autoClose: 3000 })
    }
  }

  // Provide all values and functions to children
  const value = {
    // User state
    userInfo,
    setUserInfo,
    change,
    setChange,
    isSubmitting,
    handleInputChange,
    handleSubmit,

    // Institution state
    departments,
    affiliations,
    faculties,
    institutions,
    campuses,
    ranks,
    loading,

    // Academic sections
    academicSections,

    // UI state
    activeTab,
    setActiveTab,
    modalOpen,
    setModalOpen,
    activeModal,
    setActiveModal,

    // IDs state
    scopusId,
    orcidId,

    // Functions
    handleScopusIdClick,
    handleOrcidIdClick,
    handleClearScopusId,
    handleClearOrcidId,
    handleScopusLink,
    handleOrcidLink,
    handleCloseModal,
    getBio,
    getKeywords,

    // External functions
    getCognitoUser,
    toggleViewMode,

    // Categories
    CATEGORIES
  }

  return <FacultyContext.Provider value={value}>{children}</FacultyContext.Provider>
}
