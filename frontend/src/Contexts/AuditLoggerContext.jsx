import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { addAuditView } from '../graphql/graphqlHelpers';

const AuditLoggerContext = createContext(null);

export const AUDIT_ACTIONS = {
    VIEW_PAGE: 'VIEW_PAGE',
    CREATE_PROFILE: 'Create profile',
    UPDATE_PROFILE: 'Update profile',
    CREATE_SECTION: 'Create section',
    UPDATE_SECTION: 'Update section',
    ADD_USER_DECLARATION: 'Add declaration',
    UPDATE_USER_DECLARATION: 'Update declaration',

    // TODO add more actions
};

export const AuditLoggerProvider = ({ children, userInfo }) => {
    const [ip, setIp] = useState('Unknown');
    const location = useLocation();

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

        return addAuditView(auditInput);
    };

    return (
        <AuditLoggerContext.Provider value={logAction}>
            {children}
        </AuditLoggerContext.Provider>
    );
};

export const useAuditLogger = () => useContext(AuditLoggerContext);