import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useApp } from "./AppContext.jsx";
import {
  getAllSections,
  getAllTemplates,
  getAllUsers,
  getDepartmentAffiliations,
  getDepartmentCVData,
} from "../graphql/graphqlHelpers.js";

// Create the context
const AdminContext = createContext(null);

// Custom hook to use the context
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

// Provider component
export const AdminProvider = ({ children, isAdmin, role }) => {
  const [totalCVsGenerated, setTotalCVsGenerated] = useState(0);
  const { userInfo } = useApp();
  const [loading, setLoading] = useState(true);

  const [allUsers, setAllUsers] = useState([]);
  const [allUsersCount, setAllUsersCount] = useState({
    total_count: 0,
    faculty_count: 0,
    assistant_count: 0,
    dept_admin_count: 0,
    admin_count: 0,
    faculty_admin_count: 0,
  });
  const [departmentAffiliations, setDepartmentAffiliations] = useState([]);
  const [allDataSections, setAllDataSections] = useState([]);
  const [allUserCVData, setAllUserCVData] = useState({
    publications: [],
    otherPublications: [],
    grants: [],
    patents: [],
    grantMoneyRaised: [],
  });
  const [allTemplates, setAllTemplates] = useState([]);

  // Fetch all sections
  useEffect(() => {
    setLoading(true);
    if (isAdmin) {
      getAllSections().then((sections) => {
        setAllDataSections(sections);
        setLoading(false);
      });
    }
  }, []);

  // Fetch number of generated CVs
  useEffect(() => {
    if (isAdmin) {
      fetchGeneratedCVs();
    }
  }, []);

  // Fetch all user cv data
  useEffect(() => {
    setLoading(true);
    let department;
    if (isAdmin) {
      if (role.startsWith("Admin-")) {
        department = role.split("-")[1].trim();
      } else if (role === "Admin") {
        department = "All";
      }
      fetchAllUserCVData(allDataSections, department);
    }

    setLoading(false);
  }, [allDataSections]);

  // Fetch all users
  useEffect(() => {
    setLoading(true);
    if (isAdmin) {
      fetchAllUsers();
    }

    setLoading(false);
  }, []);

  // Fetch all templates
  useEffect(() => {
    setLoading(true);
    if (isAdmin) {
      getAllTemplates().then((templates) => {
        setAllTemplates(templates);
        setLoading(false);
      });
    }

    setLoading(false);
  }, []);

  // Fetch all Faculty Rank Distribution per Department
  useEffect(() => {
    setLoading(true);
    if (isAdmin) {
      fetchDepartmentAffiliations();
    }
    setLoading(false);
  }, []);

  async function fetchAllUsers() {
    try {
      const users = await getAllUsers();
      setAllUsers(users);

      // loop over users once, count all roles, set user counts
      let counts = {
        total_count: users.length,
        faculty_count: 0,
        assistant_count: 0,
        dept_admin_count: 0,
        admin_count: 0,
        faculty_admin_count: 0,
      };
      if (role.startsWith("Admin-")) {
        const department = role.split("-")[1].trim();
        // filter by department
        for (let user of users) {
          if (user.primary_department === department) {
            let role = user.role;
            if (role.startsWith("Admin-")) {
              role = "Department Admin";
            } else if (role.startsWith("FacultyAdmin-")) {
              role = "Faculty Admin";
            }
            switch (role) {
              case "Faculty":
                counts.faculty_count++;
                break;
              case "Assistant":
                counts.assistant_count++;
                break;
              case "Department Admin":
                counts.dept_admin_count++;
                break;
              case "Faculty Admin":
                counts.faculty_admin_count++;
                break;
              case "Admin":
                counts.admin_count++;
                break;
              default:
                break;
            }
          }
        }
        setAllUsersCount(counts);
        // if admin, count by roles since dept = 'all'
      } else if (role === "Admin") {
        for (let user of users) {
          let role = user.role;
          if (role.startsWith("Admin-")) {
            role = "Department Admin";
          } else if (role.startsWith("FacultyAdmin-")) {
            role = "Faculty Admin";
          }
          switch (role) {
            case "Faculty":
              counts.faculty_count++;
              break;
            case "Assistant":
              counts.assistant_count++;
              break;
            case "Department Admin":
              counts.dept_admin_count++;
              break;
            case "Faculty Admin":
              counts.faculty_admin_count++;
              break;
            case "Admin":
              counts.admin_count++;
              break;
            default:
              break;
          }
        }
        setAllUsersCount(counts);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchDepartmentAffiliations() {
    try {
      if (role.startsWith("Admin-")) {
        const department = role.split("-")[1].trim();
        const affiliations = await getDepartmentAffiliations(department);
        setDepartmentAffiliations(affiliations);
      } else if (role === "Admin") {
        const affiliations = await getDepartmentAffiliations("All");
        setDepartmentAffiliations(affiliations);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Fetch all CV data for dashboard (single call, store in context)
  async function fetchAllUserCVData(dataSections, department) {
    try {
      let publicationSectionId = null;
      let otherPublicationSectionId = null;
      let secureFundingSectionId = null;
      let patentSectionId = null;
      for (const section of dataSections) {
        if (section.title.includes("Publication")) {
          if (section.title.includes("Other")) {
            otherPublicationSectionId = section.data_section_id;
          } else {
            publicationSectionId = section.data_section_id;
          }
        } else if (section.title.includes("Research or Equivalent Grants and Contracts")) {
          secureFundingSectionId = section.data_section_id;
        } else if (section.title.includes("Patent")) {
          patentSectionId = section.data_section_id;
        }
      }
      const promises = [];
      if (publicationSectionId) {
        promises.push(
          getDepartmentCVData(publicationSectionId, department, "Publication")
            .then((response) => ({ type: "publication", data: response.data }))
            .catch(() => ({ type: "publication", data: [] }))
        );
      }
      if (otherPublicationSectionId) {
        promises.push(
          getDepartmentCVData(otherPublicationSectionId, department, "Other")
            .then((response) => ({ type: "otherPublication", data: response.data }))
            .catch(() => ({ type: "otherPublication", data: [] }))
        );
      }
      if (secureFundingSectionId) {
        promises.push(
          getDepartmentCVData(secureFundingSectionId, department, "Grant")
            .then((response) => ({ type: "grant", data: response.data }))
            .catch(() => ({ type: "grant", data: [] }))
        );
      }
      if (patentSectionId) {
        promises.push(
          getDepartmentCVData(patentSectionId, department, "Patent")
            .then((response) => ({ type: "patent", data: response.data }))
            .catch(() => ({ type: "patent", data: [] }))
        );
      }
      const results = await Promise.all(promises);
      const publicationsData = [];
      const otherPublicationsData = [];
      const grantsData = [];
      const patentsData = [];
      results.forEach((result) => {
        switch (result.type) {
          case "publication":
            publicationsData.push(
              ...result.data.map((item) => ({
                data_section_id: item.data_section_id,
                data_details:
                  typeof item.data_details === "string" ? item.data_details : JSON.stringify(item.data_details),
              }))
            );
            break;
          case "otherPublication":
            otherPublicationsData.push(
              ...result.data.map((item) => ({
                data_section_id: item.data_section_id,
                data_details:
                  typeof item.data_details === "string" ? item.data_details : JSON.stringify(item.data_details),
              }))
            );
            break;
          case "grant":
            grantsData.push(
              ...result.data.map((item) => ({
                data_section_id: item.data_section_id,
                data_details:
                  typeof item.data_details === "string" ? item.data_details : JSON.stringify(item.data_details),
              }))
            );
            break;
          case "patent":
            patentsData.push(
              ...result.data.map((item) => ({
                data_section_id: item.data_section_id,
                data_details:
                  typeof item.data_details === "string" ? item.data_details : JSON.stringify(item.data_details),
              }))
            );
            break;
        }
      });
      // Grant money processing
      const processedGrantMoney = [];
      for (const data of grantsData) {
        try {
          const dataDetails = JSON.parse(data.data_details);
          if (dataDetails.dates && dataDetails.amount) {
            const amount = parseFloat(dataDetails.amount);
            let year;
            const dateString = dataDetails.dates.trim();
            if (dateString.includes(" - ")) {
              const endDate = dateString.split(" - ")[1].trim();
              if (endDate.includes(",")) {
                year = endDate.split(",")[1].trim();
              } else {
                const yearMatch = endDate.match(/\d{4}/);
                year = yearMatch ? yearMatch[0] : null;
              }
            } else {
              if (dateString.includes(",")) {
                year = dateString.split(",")[1].trim();
              } else {
                const yearMatch = dateString.match(/\d{4}/);
                year = yearMatch ? yearMatch[0] : null;
              }
            }
            if (!isNaN(amount) && year && !isNaN(year) && amount > 0) {
              processedGrantMoney.push({
                amount: amount,
                years: parseInt(year),
              });
            }
          }
        } catch (error) {
          // ignore
        }
      }
      setAllUserCVData({
        publications: publicationsData,
        otherPublications: otherPublicationsData,
        grants: grantsData,
        patents: patentsData,
        grantMoneyRaised: processedGrantMoney,
      });
    } catch (error) {
      console.error("Error fetching CV data:", error);
    }
  }

  async function fetchGeneratedCVs() {
    setLoading(true);
    try {
      let department = undefined;
      if (isAdmin) {
        if (role.startsWith("Admin-")) {
          department = role.split("-")[1].trim();
        } else if (role === "Admin") {
          department = "All";
        }
      }
      // getNumberOfGeneratedCVs expects department
      const generatedCVs = await import("../graphql/graphqlHelpers.js").then((m) =>
        m.getNumberOfGeneratedCVs(department)
      );
      setTotalCVsGenerated(await generatedCVs);
    } catch (error) {}
    setLoading(false);
  }

  // Graph calculations
  const totalGrantMoneyRaised = useMemo(() => {
    const total = allUserCVData.grantMoneyRaised.reduce((sum, grant) => {
      const amount = Number(grant.amount);
      return sum + (isNaN(amount) || amount <= 0 ? 0 : amount);
    }, 0);
    if (total >= 1000000) {
      return `$${(total / 1000000).toFixed(1)}M`;
    } else if (total >= 1000) {
      return `$${(total / 1000).toFixed(0)}K`;
    }
    return `$${total.toLocaleString()}`;
  }, [allUserCVData.grantMoneyRaised]);

  const grantMoneyGraphData = useMemo(() => {
    const data = [];
    const yearlyDataMap = new Map();
    allUserCVData.grantMoneyRaised.forEach((grant) => {
      if (grant.amount && grant.years && !isNaN(grant.amount) && !isNaN(grant.years) && grant.amount > 0) {
        const year = grant.years;
        if (yearlyDataMap.has(year)) {
          yearlyDataMap.get(year).GrantFunding += grant.amount;
        } else {
          yearlyDataMap.set(year, {
            date: year.toString(),
            GrantFunding: grant.amount,
          });
        }
      }
    });
    yearlyDataMap.forEach((value) => {
      data.push(value);
    });
    data.sort((a, b) => parseInt(a.date) - parseInt(b.date));
    return data;
  }, [allUserCVData.grantMoneyRaised]);

  const yearlyPublicationsGraphData = useMemo(() => {
    const data = [];
    const yearlyDataMap = new Map();
    allUserCVData.publications.forEach((publication) => {
      try {
        const dataDetails = JSON.parse(publication.data_details);
        if (dataDetails.end_date) {
          let year;
          const endDateString = dataDetails.end_date.trim();
          if (endDateString.includes(" ")) {
            const parts = endDateString.split(" ");
            const yearPart = parts[parts.length - 1];
            year = parseInt(yearPart);
          } else {
            year = parseInt(endDateString);
          }
          if (!isNaN(year)) {
            const yearStr = year.toString();
            if (yearlyDataMap.has(yearStr)) {
              yearlyDataMap.get(yearStr).Publications += 1;
            } else {
              yearlyDataMap.set(yearStr, {
                year: yearStr,
                Publications: 1,
              });
            }
          }
        }
      } catch (error) {
        // ignore
      }
    });
    yearlyDataMap.forEach((value) => {
      data.push(value);
    });
    data.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    return data;
  }, [allUserCVData.publications]);

  const yearlyPatentsGraphData = useMemo(() => {
    const data = [];
    const yearlyDataMap = new Map();
    allUserCVData.patents.forEach((patent) => {
      try {
        const dataDetails = JSON.parse(patent.data_details);
        if (dataDetails.end_date) {
          let year;
          const endDateString = dataDetails.end_date.trim();
          if (endDateString.includes(" ")) {
            const parts = endDateString.split(" ");
            const yearPart = parts[parts.length - 1];
            year = parseInt(yearPart);
          } else {
            year = parseInt(endDateString);
          }
          if (!isNaN(year)) {
            const yearStr = year.toString();
            if (yearlyDataMap.has(yearStr)) {
              yearlyDataMap.get(yearStr).Patents += 1;
            } else {
              yearlyDataMap.set(yearStr, {
                year: yearStr,
                Patents: 1,
              });
            }
          }
        }
      } catch (error) {
        // ignore
      }
    });
    yearlyDataMap.forEach((value) => {
      data.push(value);
    });
    data.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    return data;
  }, [allUserCVData.patents]);

  // Always provide context, let consumers handle loading state
  const value = {
    allUsers,
    allUsersCount,
    departmentAffiliations,
    allDataSections,
    allUserCVData,
    fetchAllUserCVData,
    fetchAllUsers,
    totalGrantMoneyRaised,
    grantMoneyGraphData,
    yearlyPublicationsGraphData,
    yearlyPatentsGraphData,
    allTemplates,
    totalCVsGenerated,
    loading,
    setLoading,
  };

  if (!isAdmin) return children;

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
