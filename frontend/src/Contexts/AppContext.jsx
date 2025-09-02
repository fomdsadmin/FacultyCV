"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { fetchUserAttributes, fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { addToUserGroup, getUser, getUserProfileMatches, changeUsername } from "../graphql/graphqlHelpers.js";
import { use } from "react";

// Create the context
const AppContext = createContext(null);

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

// Provider component
export const AppProvider = ({ children }) => {
  // User state
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [assistantUserInfo, setAssistantUserInfo] = useState({});
  const [loading, setLoading] = useState(true); // Start with loading true
  const [userGroup, setUserGroup] = useState(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userExistsInSqlDatabase, setUserExistsInSqlDatabase] = useState(false);
  const [isUserPending, setIsUserPending] = useState(false);
  const [isUserApproved, setIsUserApproved] = useState(false);
  const [isUserActive, setIsUserActive] = useState(true);
  const [doesUserNeedToReLogin, setDoesUserNeedToReLogin] = useState(false);
  const [userProfileMatches, setUserProfileMatches] = useState([]);
  const [doesUserHaveAProfileInDatabase, setDoesUserHaveAProfileInDatabase] = useState(false);

  // Role management state
  const [actualRole, setActualRole] = useState(""); // User's actual assigned role (permissions)
  const [currentViewRole, setCurrentViewRole] = useState(""); // Current active view role
  const [previousViewRole, setPreviousViewRole] = useState(""); // Previous view role before switching

  // Delegate management state
  const [managedUser, setManagedUser] = useState(null); // User being managed by delegate
  const [isManagingUser, setIsManagingUser] = useState(false); // Flag for when delegate is managing someone
  const [originalUserInfo, setOriginalUserInfo] = useState(null); // Store original delegate info
  const [hasActiveConnections, setHasActiveConnections] = useState(false); // Track if delegate has active connections

  // Initialize actual role when userInfo changes
  useEffect(() => {
    // console.log('userinfo: ', userInfo)
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
      const session = await fetchAuthSession();
      const groups = session.tokens.idToken.payload["cognito:groups"];
      return groups ? groups[0] : null;
    } catch (error) {
      console.error("Error getting user group:", error);
      return null;
    }
  }

  // Get user info from database
  async function getUserInfo(username) {
    try {
      if (username && username !== "") {
        const userInformation = await getUser(username);
        // console.log("User info fetched:", userInformation)
        if (userInformation.role === "Assistant") {
          // For delegates, only set assistantUserInfo
          setAssistantUserInfo(userInformation);
          // Don't set userInfo for delegates initially
        } else {
          setUserInfo(userInformation);
        }
        setLoading(false);
      }
    } catch (error) {
      console.log("user info failed to set", error);
      setLoading(false);
    }
  }

  // Get Cognito user
  async function getCognitoUser() {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);

      const attributes = await fetchUserAttributes();
      const username = attributes.name;

      const userGroup = await getUserGroup();
      setUserGroup(userGroup);

      try {
        await getUserInfo(username);
      } catch {
        const { given_name } = attributes;
        // Set basic user info for header display
        setUserInfo({
          first_name: given_name,
        });
      }
      // console.log("Get user info ran")
    } catch (error) {
      setLoading(false);
      console.error("Error getting Cognito user:", error);
    }
  }

  // Initialize user on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Step 1: Check authentication session
        const session = await fetchAuthSession();
        // ("Filter: Authentication session fetrched")
        const token = session.tokens?.idToken?.toString();
        // console.log("Filter: Token: ", token)

        if (!token) {
          // User is not logged in
          console.log("Filter: User not logged in");
          setIsUserLoggedIn(false);
          setUserExistsInSqlDatabase(false);
          setIsUserPending(false);
          setIsUserApproved(false);
          setLoading(false);
          return;
        }

        // console.log("Filter: User logged in");

        // User has a valid token - set up user
        setIsUserLoggedIn(true);

        // Get user attributes to check username
        const { name: username } = await fetchUserAttributes();

        if (!username) {
          console.log("Filter: Username not able to be fetched from user attributes");
          setUserExistsInSqlDatabase(false);
          setIsUserPending(false);
          setIsUserApproved(false);
          setIsUserActive(true);
          setLoading(false);
          return;
        }
        console.log("Filter: Username fetched:", username);

        // Check if user exists in SQL database
        try {
          const userData = await getUser(username);
          setUserExistsInSqlDatabase(true);
          setIsUserPending(userData.pending);
          setIsUserApproved(userData.approved);
          setIsUserActive(userData.active !== false); // Default to true if active is not explicitly false

          // If user is approved and active, set up full user context
          if (userData.approved && !userData.pending && userData.active !== false) {
            // Set up full user context (inline getCognitoUser logic)
            try {
              const userData = await getCurrentUser();
              setUser(userData);

              const attributes = await fetchUserAttributes();
              const username = attributes.name;

              const userGroup = await getUserGroup();
              setUserGroup(userGroup);

              try {
                await getUserInfo(username);
              } catch {
                const { given_name } = attributes;
                // Set basic user info for header display
                setUserInfo({
                  first_name: given_name,
                });
              }
              // console.log("User context setup completed");
            } catch (error) {
              console.error("Error setting up user context:", error);
            }
          }

          // Add user to Cognito group if they are approved and active if not already a member
          if (userData.approved && !userData.pending && userData.active !== false) {
            if (userData.role && userData.role !== "") {
              console.log("Username: ", username, "Role: ", userData.role);
              let result;
              if (userData.role.startsWith("Admin-")) {
                result = await addToUserGroup(username, "DepartmentAdmin");
              } else if (userData.role.startsWith("FacultyAdmin-")) {
                result = await addToUserGroup(username, "FacultyAdmin");
              } else {
                result = await addToUserGroup(username, userData.role);
              }

              console.log(result);
              if (result.includes("SUCCESS")) {
                setDoesUserNeedToReLogin(true);
                setIsUserApproved(false);
                setIsUserPending(true);
                console.log("Added cognito group membership", result);
              }
            }
          }
        } catch (error) {
          console.log("Filter: User does not exist in SQL database");
          // User does not exist in SQL database
          setUserExistsInSqlDatabase(false);
          setIsUserPending(false);
          setIsUserApproved(false);
          setIsUserActive(true);

          // Still set up basic user info for header display
          const { given_name, family_name, email, name } = await fetchUserAttributes();
          setUserInfo({
            first_name: given_name || "",
            last_name: family_name || "",
            email: email || "",
            username: name || "",
          });

          console.log("User info set for new user:", {
            first_name: given_name || "",
            last_name: family_name || "",
            email: email || "",
            username: name || "",
          });

          const result = await getUserProfileMatches(given_name, family_name);
          console.log("User profile matches:", result);

          if (result && Array.isArray(result) && result.length > 0) {
            setUserProfileMatches(result);
            setDoesUserHaveAProfileInDatabase(true);
          } else {
            setUserProfileMatches([]);
            setDoesUserHaveAProfileInDatabase(false);
          }
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
        setIsUserLoggedIn(false);
        setUserExistsInSqlDatabase(false);
        setIsUserPending(false);
        setIsUserApproved(false);
        setIsUserActive(true);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Get available roles based on user's permission level
  const getAvailableRoles = () => {
    // For delegates, use assistantUserInfo when not managing, userInfo when managing
    const effectiveUser =
      assistantUserInfo && assistantUserInfo.role === "Assistant" && !isManagingUser ? assistantUserInfo : userInfo;

    if (!effectiveUser || !effectiveUser.role) return [];

    const isAdmin = effectiveUser.role === "Admin";
    const isDepartmentAdmin = effectiveUser.role.startsWith("Admin-");
    const isFacultyAdmin = effectiveUser.role.startsWith("FacultyAdmin-");
    const department = isDepartmentAdmin ? effectiveUser.role.split("Admin-")[1] : "";
    const faculty = isFacultyAdmin ? effectiveUser.role.split("FacultyAdmin-")[1] : "";

    let roles = [];

    if (isAdmin) {
      roles = [
        { label: "Admin", value: "Admin", route: "/admin/home" },
        {
          label: `Department Admin - ${department || "All"}`,
          value: `Admin-${department || "All"}`,
          route: "/department-admin/dashboard",
        },
        {
          label: `Faculty Admin - ${faculty || "All"}`,
          value: `FacultyAdmin-${faculty || "All"}`,
          route: "/faculty-admin/home",
        },
        { label: "Faculty", value: "Faculty", route: "/faculty/home" },
        { label: "Delegate", value: "Assistant", route: "/delegate/home" },
      ];
    } else if (isDepartmentAdmin) {
      roles = [
        {
          label: `Department Admin - ${department}`,
          value: `Admin-${department}`,
          route: "/department-admin/dashboard",
        },
        { label: "Faculty", value: "Faculty", route: "/faculty/home" },
      ];
    } else if (isFacultyAdmin) {
      roles = [
        { label: `Faculty Admin - ${faculty}`, value: `FacultyAdmin-${faculty}`, route: "/faculty-admin/home" },
        { label: "Faculty", value: "Faculty", route: "/faculty/home" },
      ];
    } else {
      roles = [
        {
          label: effectiveUser.role === "Assistant" ? "Delegate" : effectiveUser.role,
          value: effectiveUser.role,
          route:
            effectiveUser.role === "Faculty"
              ? "/faculty/home"
              : effectiveUser.role === "Assistant"
              ? "/delegate/home"
              : "/home",
        },
      ];
    }

    // If delegate is managing someone, add Faculty View option
    if (assistantUserInfo && assistantUserInfo.role === "Assistant" && (isManagingUser || hasActiveConnections)) {
      if (isManagingUser && managedUser) {
        roles.push({
          label: `Faculty View - ${managedUser.first_name} ${managedUser.last_name}`,
          value: "Faculty",
          route: "/faculty/home",
          isManaging: true,
        });
      } else if (hasActiveConnections && !isManagingUser) {
        roles.push({
          label: "Faculty View",
          value: "Faculty",
          route: "/faculty/home",
          isManaging: false,
        });
      }
    }

    return roles;
  };

  // Get department from role
  const getDepartment = () => {
    return userInfo && userInfo.role && userInfo.role.startsWith("Admin-") ? userInfo.role.split("-")[1] : "";
  };

  // Toggle between admin view and faculty view
  const toggleViewMode = () => {
    const availableRoles = getAvailableRoles();
    if (availableRoles.length > 1) {
      // Find the next role to switch to
      const currentIndex = availableRoles.findIndex((role) => role.value === currentViewRole);
      const nextIndex = (currentIndex + 1) % availableRoles.length;
      const nextRole = availableRoles[nextIndex];

      setCurrentViewRole(nextRole.value);
      // Navigate to the new role's route
      window.location.href = nextRole.route;
    }
  };

  // Start managing a user (for delegates)
  const startManagingUser = (userToManage) => {
    // Store the original user info and role for any role
    setOriginalUserInfo({ ...userInfo });
    setManagedUser(userToManage);
    setIsManagingUser(true);
    setUserInfo(userToManage);
    setPreviousViewRole(currentViewRole);
    setCurrentViewRole("Faculty");
  };

  // Stop managing a user (return to delegate view)
  const stopManagingUser = () => {
    if (isManagingUser && originalUserInfo) {
      setIsManagingUser(false);
      setManagedUser(null);
      setOriginalUserInfo(null);
      setUserInfo(originalUserInfo);
      return previousViewRole
    }
  };

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
    isUserActive,
    setIsUserActive,

    // Role management
    actualRole,
    currentViewRole,
    setCurrentViewRole,
    getAvailableRoles,

    // Delegate management
    managedUser,
    isManagingUser,
    originalUserInfo,
    hasActiveConnections,
    setHasActiveConnections,
    startManagingUser,
    stopManagingUser,

    // Functions
    getUserInfo,
    getCognitoUser,
    getDepartment,
    toggleViewMode,
    setUser,

    // Re-login state for group memberships
    doesUserNeedToReLogin,
    setDoesUserNeedToReLogin,

    doesUserHaveAProfileInDatabase,
    setDoesUserHaveAProfileInDatabase,
    userProfileMatches,
    setUserProfileMatches,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
