"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { fetchUserAttributes, fetchAuthSession, getCurrentUser } from "aws-amplify/auth"
import { getUser } from "../graphql/graphqlHelpers.js"

// Create the context
const AppContext = createContext(null)

// Custom hook to use the context
export const useApp = () => {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error("useApp must be used within an AppProvider")
    }
    return context
}

// Provider component
export const AppProvider = ({ children }) => {
    // User state
    const [user, setUser] = useState(null)
    const [userInfo, setUserInfo] = useState({})
    const [assistantUserInfo, setAssistantUserInfo] = useState({})
    const [loading, setLoading] = useState(true) // Start with loading true
    const [userGroup, setUserGroup] = useState(null)
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [userExistsInSqlDatabase, setUserExistsInSqlDatabase] = useState(false);
    const [isUserPending, setIsUserPending] = useState(false);
    const [isUserApproved, setIsUserApproved] = useState(false);
    
    // Role management state
    const [actualRole, setActualRole] = useState("") // User's actual assigned role (permissions)
    const [currentViewRole, setCurrentViewRole] = useState("") // Current active view role

    // Initialize actual role when userInfo changes
    useEffect(() => {
      console.log('userinfo: ', userInfo)
        if (userInfo && userInfo.role) {
            setActualRole(userInfo.role);
            // Only set currentViewRole initially if not already set
            if (!currentViewRole) {
                setCurrentViewRole(userInfo.role);
            }
        }
    }, [userInfo, currentViewRole]);

    // Get user group from Cognito
    async function getUserGroup() {
        try {
            const session = await fetchAuthSession()
            const groups = session.tokens.idToken.payload["cognito:groups"]
            return groups ? groups[0] : null
        } catch (error) {
            console.error("Error getting user group:", error)
            return null
        }
    }

    // Get user info from database
    async function getUserInfo(email) {
        try {
            const userInformation = await getUser(email)
            if (userInformation.role === "Assistant") {
                setAssistantUserInfo(userInformation)
            } else {
                setUserInfo(userInformation)
            }
            setLoading(false)
        } catch (error) {
          console.log("user info failed to set")
            setLoading(false)
            console.error("Error fetching user info:", error)
        }
    }

    // Get Cognito user
    async function getCognitoUser() {
        try {
            setLoading(true)
            const userData = await getCurrentUser()
            setUser(userData)
            
            const attributes = await fetchUserAttributes()
            const email = attributes.email
            
            const userGroup = await getUserGroup()
            setUserGroup(userGroup)
            
            try {
              await getUserInfo(email)
            } catch {
                const { given_name } = await fetchUserAttributes();
                // Set basic user info for header display
                setUserInfo({
                    first_name: given_name,
                });
            }
            console.log("Get user info ran")
        } catch (error) {
            setLoading(false)
            console.error("Error getting Cognito user:", error)
        }
    }

    // Initialize user on component mount
    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
            try {
                // Step 1: Check authentication session
                const session = await fetchAuthSession();
                const token = session.tokens?.idToken?.toString();

                if (!token) {
                    // User is not logged in
                    setIsUserLoggedIn(false);
                    setUserExistsInSqlDatabase(false);
                    setIsUserPending(false);
                    setIsUserApproved(false);
                    setLoading(false);
                    return;
                } else {
                  getCognitoUser();
                }

                // User is logged in with Cognito
                setIsUserLoggedIn(true);

                // Step 2: Get user attributes to check email
                const { email } = await fetchUserAttributes();

                if (!email) {
                    setUserExistsInSqlDatabase(false);
                    setIsUserPending(false);
                    setIsUserApproved(false);
                    setLoading(false);
                    return;
                }

                // Step 3: Check if user exists in SQL database
                try {
                    const userData = await getUser(email);
                    setUserExistsInSqlDatabase(true);
                    setIsUserPending(userData.pending);
                    setIsUserApproved(userData.approved);
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    // User does not exist in SQL database
                    setUserExistsInSqlDatabase(false);
                    setIsUserPending(false);
                    setIsUserApproved(false);
                }

            } catch (error) {
                console.error("Error checking auth session:", error);
                setIsUserLoggedIn(false);
                setUserExistsInSqlDatabase(false);
                setIsUserPending(false);
                setIsUserApproved(false);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, [])

    // Get available roles based on user's permission level
    const getAvailableRoles = () => {
        if (!userInfo || !userInfo.role) return [];
        
        const isAdmin = userInfo.role === "Admin";
        const isDepartmentAdmin = userInfo.role.startsWith("Admin-");
        const isFacultyAdmin = userInfo.role.startsWith("FacultyAdmin-");
        const department = isDepartmentAdmin ? userInfo.role.split("Admin-")[1] : "";
        const faculty = isFacultyAdmin ? userInfo.role.split("FacultyAdmin-")[1] : "";
        
        if (isAdmin) {
            return [
                { label: "Admin", value: "Admin", route: "/admin/home" },
                { label: `Department Admin - ${department || "All"}`, value: `Admin-${department || "All"}`, route: "/department-admin/home" },
                { label: `Faculty Admin - ${faculty || "All"}`, value: `FacultyAdmin-${faculty || "All"}`, route: "/faculty-admin/home" },
                { label: "Faculty", value: "Faculty", route: "/faculty/home" },
            ];
        } else if (isDepartmentAdmin) {
            return [
                { label: `Department Admin - ${department}`, value: `Admin-${department}`, route: "/department-admin/home" },
                { label: "Faculty", value: "Faculty", route: "/faculty/home" }
            ];
        } else if (isFacultyAdmin) {
            return [
                { label: `Faculty Admin - ${faculty}`, value: `FacultyAdmin-${faculty}`, route: "/faculty-admin/home" },
                { label: "Faculty", value: "Faculty", route: "/faculty/home" }
            ];
        } else {
            return [{ 
                label: userInfo.role, 
                value: userInfo.role, 
                route: userInfo.role === "Faculty" ? "/faculty/home" : "/assistant/home" 
            }];
        }
    };

    // Get department from role
    const getDepartment = () => {
        return userInfo && userInfo.role && userInfo.role.startsWith("Admin-") 
            ? userInfo.role.split("-")[1] 
            : ""
    }

    // Toggle between admin view and faculty view
    const toggleViewMode = () => {
        const availableRoles = getAvailableRoles();
        if (availableRoles.length > 1) {
            // Find the next role to switch to
            const currentIndex = availableRoles.findIndex(role => role.value === currentViewRole);
            const nextIndex = (currentIndex + 1) % availableRoles.length;
            const nextRole = availableRoles[nextIndex];
            
            setCurrentViewRole(nextRole.value);
            // Navigate to the new role's route
            window.location.href = nextRole.route;
        }
    }

    // Context value
    const value = {
        // User state
        user,
        userInfo,
        setUserInfo,
        assistantUserInfo,
        setAssistantUserInfo,
        loading,
        userGroup,
        setLoading,
        setIsUserLoggedIn,
        isUserLoggedIn,
        userExistsInSqlDatabase,
        setUserExistsInSqlDatabase,
        isUserPending,
        setIsUserPending,
        isUserApproved,
        setIsUserApproved,
        
        // Role management
        actualRole,
        currentViewRole,
        setCurrentViewRole,
        getAvailableRoles,

        // Functions
        getUserInfo,
        getCognitoUser,
        getDepartment,
        toggleViewMode,
        setUser,
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
