import { createContext, useContext, useState, useEffect } from "react";
import { useApp } from "./AppContext.jsx";
import { getAllSections, getAllUsers, getDepartmentAffiliations } from "../graphql/graphqlHelpers.js";

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

  // Fetch all users
  useEffect(() => {
    setLoading(true);
    if (isAdmin) {
      fetchAllUsers();
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

  // Always provide context, let consumers handle loading state
  const value = {
    allUsers,
    allUsersCount,
    departmentAffiliations,
    allDataSections,
    loading,
    setLoading,
  };

  if (!isAdmin) return children;

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
