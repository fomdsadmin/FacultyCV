import { createContext, useContext, useState, useEffect } from "react"
import { getAllUniversityInfo, getAllSections, getOrcidSections, updateUser } from "../../graphql/graphqlHelpers.js"
import { toast } from "react-toastify"
import { useApp } from "../../Contexts/AppContext.jsx"

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
export const FacultyProvider = ({ children }) => {
  // Get values from AppContext
  const { userInfo, setUserInfo, getCognitoUser, getUserInfo, toggleViewMode } = useApp();

  // Will be used to check if any user info has been saved
  const [prevUserInfo, setPrevUserInfo] = useState(null);

  const CATEGORIES = Object.freeze({
    AFFILIATIONS: "Affiliations",
    EMPLOYMENT: "Employment",
    SERVICE: "Service",
    TEACHING: "Teaching",
    EDUCATION: "Education",
    AWARDS: "Awards",
    LINKAGES: "Linkages",
  })

  // User state
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
  const [activeTab, setActiveTab] = useState(CATEGORIES.AFFILIATIONS)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null)

    // This effect will ensure prevUserInfo is set only once
    useEffect(() => {
      if (userInfo && !prevUserInfo) {
        setPrevUserInfo(JSON.parse(JSON.stringify(userInfo)));
      }
    }, [userInfo, prevUserInfo]);
  
    // Compares the previous userInfo and the userInfo displayed on frontend to determine if a change was made
    useEffect(() => {
      const userInfoToCompare = JSON.stringify(userInfo);
      const prevUserInfoToCompare = JSON.stringify(prevUserInfo);

      if (userInfoToCompare !== prevUserInfoToCompare && prevUserInfo) {
        setChange(true);
      } else {
        setChange(false);
      }
    }, [userInfo, prevUserInfo])

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
        userInfo.scopus_id,
        userInfo.orcid_id,
      )
      // Update both local and app state
      getUserInfo(userInfo.email)
      setIsSubmitting(false)
      setPrevUserInfo(JSON.parse(JSON.stringify(userInfo)));
    } catch (error) {
      console.error("Error updating user:", error)
      setIsSubmitting(false)
    }
  }

  // Sanitize input
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

  const handleScopusLink = (newScopusId) => {
    if (!newScopusId) {
      return;
    }
    const updatedScopusId = userInfo.scopus_id ? `${userInfo.scopus_id},${newScopusId}` : newScopusId;
    setUserInfo((prev) => ({
      ...prev,
      scopus_id: updatedScopusId,
    }));
    setModalOpen(false);
  }

  const handleOrcidLink = (newOrcidId) => {
    setUserInfo((prev) => ({
      ...prev,
      orcid_id: newOrcidId,
    }));
    setModalOpen(false)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
  }

  // ORCID data fetching
  const getBio = async () => {
    try {
      const bio = await getOrcidSections(userInfo.orcid_id, "biography")
      if (bio && bio.bio) {
        setUserInfo((prevUserInfo) => ({
          ...prevUserInfo,
          bio: bio.bio,
        }))
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
      const keywords_output = await getOrcidSections(userInfo.orcid_id, "keywords")
      if (keywords_output && keywords_output.keywords) {
        setUserInfo((prevUserInfo) => ({
          ...prevUserInfo,
          keywords: keywords_output.keywords,
        }))
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
    change,
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
    //scopusId,
    //orcidId,

    // Functions
    handleScopusIdClick,
    handleOrcidIdClick,
    handleScopusLink,
    handleOrcidLink,
    handleCloseModal,
    getBio,
    getKeywords,
    //updateAppUserInfo,

    // External functions from AppContext
    getCognitoUser,
    toggleViewMode,

    // Categories
    CATEGORIES,
  }

  return <FacultyContext.Provider value={value}>{children}</FacultyContext.Provider>
}
