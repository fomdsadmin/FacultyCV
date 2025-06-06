import React from 'react'
import { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import AdminMenu from '../Components/AdminMenu.jsx';

import { getAuditViewData } from '../graphql/graphqlHelpers.js';

const AuditPage = ({ getCognitoUser, userInfo }) => {
    const [loading, setLoading] = useState(false);
    const [auditViewData, setAuditViewData] = useState([]);
    const [activeTab, setActiveTab] = useState('pageView'); // 'pageView' or 'actionView'


    const [emailFilter, setEmailFilter] = useState('');
    const [firstNameFilter, setFirstNameFilter] = useState('');
    const [lastNameFilter, setLastNameFilter] = useState('');

    useEffect(() => {
        fetchAuditViewData();
    }, []);

    async function fetchAuditViewData() {
        setLoading(true);
        try {
            const auditViewData = await getAuditViewData();
            setAuditViewData(auditViewData);
        } catch (error) {
            console.error("Error fetching audit view data:", error);
        }
        setLoading(false);
    }



    const pageViewColumns = [
        "log_view_id",
        "ts",
        "logged_user_id",
        "logged_user_first_name",
        "logged_user_last_name",
        "logged_user_email",
        "logged_user_role",
        "assistant",
        "profile_record",
        "page",
        "session_id",
        "ip",
        "browser_version",
    ];


    const actionViewColumns = pageViewColumns; // Temporary, just for now


    const pageViewData = auditViewData.filter(log => {
        const matchesPage = log.page;
        const matchesEmail = log.logged_user_email?.toLowerCase().includes(emailFilter.toLowerCase());
        const matchesFirstName = log.logged_user_first_name?.toLowerCase().includes(firstNameFilter.toLowerCase());
        const matchesLastName = log.logged_user_last_name?.toLowerCase().includes(lastNameFilter.toLowerCase());
        return matchesPage && matchesEmail && matchesFirstName && matchesLastName;
    });
    

    const actionData = auditViewData.filter(log => log.profile_record); // or any other filter logic


    return (
        <PageContainer>
            <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />

            <main className='ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4'>
                <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Audit</h1>

                {/* Filters */}
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Filter by Email"
                        className="border px-2 py-1"
                        value={emailFilter}
                        onChange={e => setEmailFilter(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Filter by First Name"
                        className="border px-2 py-1"
                        value={firstNameFilter}
                        onChange={e => setFirstNameFilter(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Filter by Last Name"
                        className="border px-2 py-1"
                        value={lastNameFilter}
                        onChange={e => setLastNameFilter(e.target.value)}
                    />
                    <button
                        className="px-3 py-1 bg-gray-300 rounded"
                        onClick={() => {
                            setEmailFilter('');
                            setFirstNameFilter('');
                            setLastNameFilter('');
                        }}
                    >
                        Clear Filters
                    </button>

                </div>


                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        className={`px-4 py-2 rounded ${activeTab === 'pageView' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                        onClick={() => setActiveTab('pageView')}
                    >
                        Page View
                    </button>
                    <button
                        className={`px-4 py-2 rounded ${activeTab === 'actionView' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                        onClick={() => setActiveTab('actionView')}
                    >
                        Action View
                    </button>
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border text-xs">
                            <thead>
                                <tr>
                                    {(activeTab === 'pageView' ? pageViewColumns : actionViewColumns).map(col => (
                                        <th key={col} className="border px-2 py-1">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(activeTab === 'pageView' ? pageViewData : actionData).map((log, idx) => (
                                    <tr key={log.log_view_id || idx}>
                                        {(activeTab === 'pageView' ? pageViewColumns : actionViewColumns).map(col => (
                                            <td key={col} className="border px-2 py-1">
                                                {typeof log[col] === "boolean" ? String(log[col]) : log[col]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </PageContainer>
    )
}

export default AuditPage;