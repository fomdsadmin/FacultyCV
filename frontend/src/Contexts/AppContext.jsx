"use client"
import { createContext, useContext, useState, useEffect } from "react"
import { fetchUserAttributes, signOut, fetchAuthSession } from "aws-amplify/auth"
import { getUser } from "../graphql/graphqlHelpers.js"
import { Navigate } from "react-router-dom"

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
    const [loading, setLoading] = useState(false)
    const [userGroup, setUserGroup] = useState(null)
    const [viewMode, setViewMode] = useState("department-admin") // 'department-admin' or 'faculty'

    // Toggle view mode function
    const toggleViewMode = () => {
        setViewMode((prevMode) => (prevMode === "department-admin" ? "faculty" : "department-admin"))
    }

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
            console.error("Error getting user info:", error)
            setLoading(false)
        }
    }

    // Get Cognito user
    async function getCognitoUser() {
        try {
            setLoading(true)
            const attributes = await fetchUserAttributes()
            const currentUser = attributes.email
            setUser(currentUser)
            await getUserInfo(currentUser)
            getUserGroup().then((group) => setUserGroup(group))
            return <Navigate to="/home" />;
        } catch (error) {
            console.error("Error getting Cognito user:", error)
            setUser(null)
            setUserInfo({})
            setAssistantUserInfo({})
            signOut()
            setLoading(false)
            return <Navigate to="/auth" />;
        }
    }

    // Initialize user on component mount
    useEffect(() => {
        getCognitoUser()
    }, [])

    // Get department from role
    const getDepartment = () => {
        return userInfo && userInfo.role && userInfo.role.startsWith("Admin-") ? userInfo.role.split("-")[1] : ""
    }

    // Determine user role type
    const getUserRoleType = () => {
        if (!userInfo || !userInfo.role) return null
        if (userInfo.role === "Admin") return "admin"
        if (userInfo.role.startsWith("Admin-")) return "department-admin"
        if (userInfo.role === "Faculty") return "faculty"
        return null
    }

    // Check if user is authenticated
    const isAuthenticated = () => {
        return !!user
    }

    // Check if user info is loaded
    const isUserInfoLoaded = () => {
        return Object.keys(userInfo).length > 0 || Object.keys(assistantUserInfo).length > 0
    }

    // Context value
    const value = {
        // State
        user,
        userInfo,
        setUserInfo,
        assistantUserInfo,
        setAssistantUserInfo,
        loading,
        userGroup,
        viewMode,

        // Functions
        toggleViewMode,
        getUserInfo,
        getCognitoUser,
        getDepartment,
        getUserRoleType,
        isAuthenticated,
        isUserInfoLoaded,
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
