import { createContext, useContext, useState, useEffect } from "react";
import { getAllUniversityInfo, getAllSections, updateUser } from "../../graphql/graphqlHelpers.js";
import { useApp } from "../../Contexts/AppContext.jsx";

// Create the context
const FacultyContext = createContext(null);

// Custom hook to use the context
export const useFaculty = () => {
  const context = useContext(FacultyContext);
  if (!context) {
    throw new Error("useFaculty must be used within a FacultyProvider");
  }
  return context;
};

// Provider component
export const FacultyProvider = ({ children }) => {
  // Get values from AppContext
  const { userInfo, setUserInfo, getUserInfo, toggleViewMode } = useApp();

  // Will be used to check if any user info has been saved
  const [prevUserInfo, setPrevUserInfo] = useState(null);

  // User state
  const [change, setChange] = useState(false);

  // Institution state
  const [departments, setDepartments] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [authoritiesMap, setAuthoritiesMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Academic sections state
  const [academicSections, setAcademicSections] = useState([]);

  // useEffect(() => {
  //   // get latest user info on render
  //   if (userInfo?.email || userInfo?.username) {
  //     getUserInfo(userInfo.username || userInfo.email);
  //   }
  // }, [userInfo]);

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
  }, [userInfo, prevUserInfo]);

  // Fetch academic sections
  useEffect(() => {
    const fetchSections = async () => {
      const sections = await getAllSections();
      const parsed = sections.map((s) => ({
        ...s,
        attributes: JSON.parse(s.attributes),
      }));
      setAcademicSections(parsed);
    };
    fetchSections();
  }, []);

  // Fetch university info when userInfo changes
  useEffect(() => {
    sortUniversityInfo();
  }, [userInfo]);

  // Sort university info
  const sortUniversityInfo = () => {
    getAllUniversityInfo().then((result) => {
      const depts = [];
      const facs = [];
      const camps = [];
      const rnks = [];
      const affils = [];
      const insts = [];
      const authrts = [];
      const authorityMap = {};

      result.forEach((element) => {
        if (element.type === "Department") {
          depts.push(element.value);
        } else if (element.type === "Faculty") {
          facs.push(element.value);
        } else if (element.type === "Campus") {
          camps.push(element.value);
        } else if (element.type === "Rank") {
          rnks.push(element.value);
        } else if (element.type === "Affiliation") {
          affils.push(element.value);
        } else if (element.type === "Institution") {
          insts.push(element.value);
        } else if (element.type === "Authority") {
          authrts.push(element.value);
          authorityMap[element.value] = []; // Initialize with empty array
        } else if (element.type.startsWith("Authority - ")) {
          // Example: element.type = "Authority - Fraser Health"
          const authorityName = element.type.split('-')[1].trim();
          if (authorityMap[authorityName]) {
            authorityMap[authorityName].push(element.value);
          } else {
            authorityMap[authorityName] = [element.value];
          }
        }
      });
      setDepartments(depts.sort());
      setFaculties(facs.sort());
      setCampuses(camps.sort());
      setRanks(rnks.sort());
      setAffiliations(affils.sort());
      setInstitutions(insts.sort());
      setAuthorities(authrts.sort());
      setAuthoritiesMap(authorityMap);
      setLoading(false);
    });
  };

  // Handle input changes
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUserInfo((prevUserInfo) => ({
      ...prevUserInfo,
      [name]: value,
    }));
  };

  // Provide all values and functions to children
  const value = {
    // User state
    userInfo,
    change,
    handleInputChange,

    // Institution state
    departments,
    affiliations,
    faculties,
    institutions,
    campuses,
    ranks,
    authorities,
    authoritiesMap,
    loading,

    // Academic sections
    academicSections,

    // External functions from AppContext
    toggleViewMode,
  };

  return <FacultyContext.Provider value={value}>{children}</FacultyContext.Provider>;
};
