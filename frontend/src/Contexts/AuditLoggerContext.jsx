import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { addAuditView } from '../graphql/graphqlHelpers';
import { ADD_USER, UPDATE_USER_AFFILIATIONS } from 'graphql/mutations';
import { reject } from 'bcrypt/promises';

const AuditLoggerContext = createContext(null);

export const AUDIT_ACTIONS = {
    VIEW_PAGE: 'View page',
    SIGN_UP: 'Sign up',
    UPDATE_PROFILE: 'Update profile',
    UPDATE_AFFILIATIONS: 'Update affiliations',

    
    FORM_CONNECTION: 'Form connection',
    

    ADD_USER_DECLARATION: 'Add declaration',
    UPDATE_USER_DECLARATION: 'Update declaration',
    DELETE_USER_DECLARATION: 'Delete declaration',

    ADD_CV_DATA: 'Add CV data',
    UPDATE_CV_DATA: 'Update CV data',
    DELETE_CV_DATA: 'Delete all CV data',
    ARCHIVE_CV_DATA: 'Archive CV data',
    RETRIEVE_EXTERNAL_DATA: 'Retrieve external data',

    GENERATE_REPORT: 'Generate report', // TODO 
    DOWNLOAD_REPORT: 'Download report', // TODO
    // TODO add more actions

    // admin actions
    EDIT_SECTION_DETAILS: 'Update section details',
    UPDATE_SECTION_ATTRIBUTES: 'Update section attributes',
    ARCHIVE_SECTION: 'Archive section',
    DELETE_SECTION_DATA: 'Delete section Data',

    SEND_CONNECTION_INVITE: 'Send connection invite',
    DELETE_CONNECTION: 'Delete connection',
    ACCEPT_CONNECTION: 'Accept connection',

    CHANGE_USER_ROLE: 'Change role',
    EDIT_CV_TEMPLATE: 'Edit CV template',
    ADD_NEW_TEMPLATE: 'Add new template',
    DELETE_CV_TEMPLATE: 'Delete CV template', 
    EDIT_REPORT_FORMAT: 'Edit report format', 
    ADD_USER: 'Add user',
    UPDATE_USER_PROFILE: 'Update user profile', 
    IMPORT_USER: 'Import user',
    APPROVE_USER: 'Approve user',
    REJECT_USER: 'Reject user', 
    ACCEPT_USER: 'Accept user'


};

export const ACTION_CATEGORIES = {
    ADMIN_ACTIONS: [
        AUDIT_ACTIONS.EDIT_SECTION_DETAILS,
        AUDIT_ACTIONS.UPDATE_SECTION_ATTRIBUTES,
        AUDIT_ACTIONS.ARCHIVE_SECTION,
        AUDIT_ACTIONS.DELETE_SECTION_DATA,
        AUDIT_ACTIONS.SEND_CONNECTION_INVITE,
        AUDIT_ACTIONS.DELETE_CONNECTION,
        AUDIT_ACTIONS.ACCEPT_CONNECTION,
        AUDIT_ACTIONS.CHANGE_USER_ROLE,
        AUDIT_ACTIONS.EDIT_CV_TEMPLATE,
        AUDIT_ACTIONS.ADD_NEW_TEMPLATE,
        AUDIT_ACTIONS.EDIT_REPORT_FORMAT,
        AUDIT_ACTIONS.ADD_USER,
        AUDIT_ACTIONS.UPDATE_USER_PROFILE,
        AUDIT_ACTIONS.IMPORT_USER,
        AUDIT_ACTIONS.APPROVE_USER,
        AUDIT_ACTIONS.REJECT_USER
    ],

};

// All actions that aren't admin actions
ACTION_CATEGORIES.OTHER_ACTIONS = Object.values(AUDIT_ACTIONS).filter(
    action => !ACTION_CATEGORIES.ADMIN_ACTIONS.includes(action)
);

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
                // console.log(`Logged page view: ${location.pathname}`);
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
        // Convert profileRecord to string if it's an object
        let recordValue = profileRecord;
        if (typeof profileRecord === 'object') {
            try {
                recordValue = JSON.stringify(profileRecord);
            } catch (e) {
                recordValue = String(profileRecord);
            }
        }

        const auditInput = {
            logged_user_id: userInfo?.user_id || 'Unknown',
            logged_user_first_name: userInfo?.first_name || 'Unknown',
            logged_user_last_name: userInfo?.last_name || 'Unknown',
            logged_user_role: userInfo?.role || 'Unknown',
            ip,
            browser_version: navigator.userAgent,
            page: location.pathname,
            session_id: localStorage.getItem('session_id') || 'Unknown',
            assistant: userInfo?.role === 'Assistant' ? "true" : "false",
            profile_record: recordValue,
            logged_user_email: userInfo?.email || 'Unknown',
            logged_user_action: actionType,

        };

        // console.log('Audit Log Action:', actionType, auditInput);
        try {
            await addAuditView(auditInput);
        } catch (error) {
            console.error("Failed to log audit action:", error);
        }
        return;
    };

    const contextValue = {
        logAction,
    };

    return (
        <AuditLoggerContext.Provider value={contextValue}>
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