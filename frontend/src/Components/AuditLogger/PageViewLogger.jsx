import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { addAuditView } from "../../graphql/graphqlHelpers.js";

const PageViewLogger = ({ userInfo }) => {
    const location = useLocation();
    const [ip, setIp] = useState("Unknown");

    const session_id = localStorage.getItem("session_id") || "Unknown";

    // get IP once
    useEffect(() => {
        fetch("https://api.ipify.org?format=json")
            .then(res => res.json())
            .then(data => setIp(data.ip))
            .catch(() => setIp("Unknown"));
    }, []);

    useEffect(() => {

        // Build your audit input (fill with real values as needed)
        const auditInput = {
            logged_user_first_name: userInfo.first_name || "Unknown",
            logged_user_last_name: userInfo.last_name || "Unknown",
            logged_user_role: userInfo.role || "Unknown",
            ip,
            browser_version: navigator.userAgent,
            page: location.pathname,
            session_id: localStorage.getItem("session_id") || "Unknown",
            assistant: userInfo?.role === "Assistant",
            profile_record: "TODO",
            logged_user_email: userInfo.email || "Unknown",
            logged_user_action: "Page View",
        };

        // console.log("Audit Input:", auditInput);
        addAuditView(auditInput).catch(err => {
            // Log the error as a string
            console.error("Audit log error:", err, JSON.stringify(err));
        });
    }, [location.pathname, ip, session_id, userInfo]);

    return null; // This component does not render anything
};

export default PageViewLogger;