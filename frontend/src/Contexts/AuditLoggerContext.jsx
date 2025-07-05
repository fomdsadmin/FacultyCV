import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { addAuditView } from '../graphql/graphqlHelpers';

const AuditLoggerContext = createContext(null);

export const AUDIT_ACTIONS = {
    VIEW_PAGE: 'View page',
    CREATE_PROFILE: 'Create profile',
    UPDATE_PROFILE: 'Update profile',
    CREATE_SECTION: 'Create section',
    UPDATE_SECTION: 'Update section',
    ADD_USER_DECLARATION: 'Add declaration',
    UPDATE_USER_DECLARATION: 'Update declaration',
    ADD_CV_SECTION: 'Add CV section',
    UPDATE_CV_SECTION: 'Update CV section',
    

    // TODO add more actions
};

export const AuditLoggerProvider = ({ children, userInfo }) => {
    const [ip, setIp] = useState('Unknown');
    const location = useLocation();
    const previousPath = useRef(null);

    // Log page views automatically
    useEffect(() => {
        const logPageView = async () => {
            // Skip logging for certain paths or if userInfo is not available
            if (!userInfo || !userInfo.email) {
                console.log("Page view logging skipped - no user info available");
                return;
            }

            if (location.pathname !== previousPath.current) {
                previousPath.current = location.pathname;

                await logAction(AUDIT_ACTIONS.VIEW_PAGE);
                console.log(`Logged page view: ${location.pathname}`);
            }
        };

        logPageView();
    }, [location.pathname, userInfo]);

    useEffect(() => {
        // Get IP once
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setIp(data.ip))
            .catch(() => setIp('Unknown'));

        // Set session_id once
        if (!localStorage.getItem('session_id')) {
            localStorage.setItem('session_id', crypto.randomUUID());
        }
    }, []);

    const logAction = async (actionType, profileRecord = '', extra = {}) => {
        if (!userInfo) {
            console.warn("Cannot log action - no user info available");
            return;
        }


        const auditInput = {
            logged_user_first_name: userInfo?.first_name || 'Unknown',
            logged_user_last_name: userInfo?.last_name || 'Unknown',
            logged_user_role: userInfo?.role || 'Unknown',
            ip,
            browser_version: navigator.userAgent,
            page: location.pathname,
            session_id: localStorage.getItem('session_id') || 'Unknown',
            assistant: userInfo?.role === 'Assistant',
            profile_record: profileRecord,
            logged_user_email: userInfo?.email || 'Unknown',
            logged_user_action: actionType,
            
        };

        console.log('Audit Log Action:', actionType, auditInput);
        try {
            return await addAuditView(auditInput);
        } catch (error) {
            console.error("Failed to log audit action:", error);
        }

        // return addAuditView(auditInput);
    };

    const contextValue = {
        logAction,
    };

    return (
        <AuditLoggerContext.Provider value={logAction}>
            {children}
        </AuditLoggerContext.Provider>
    );
};



export const useAuditLogger = () => {
    const context = useContext(AuditLoggerContext);
    if (!context) {
        throw new Error('useAuditLogger must be used within an AuditLoggerProvider');
    }
    return context;
};

export { AuditLoggerContext };