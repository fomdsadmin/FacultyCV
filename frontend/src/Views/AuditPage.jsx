import React from 'react'
import { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import AdminMenu from '../Components/AdminMenu.jsx';

import { getAuditViewData } from '../graphql/graphqlHelpers.js';

const AuditPage = ({ getCognitoUser, userInfo }) => {
    const [loading, setLoading] = useState(false);
    const [auditViewData, setAuditViewData] = useState([]);
    
    const PAGE_SIZE = 20; 
    const [page, setPage] = useState(1); // Current page number


    const [emailFilter, setEmailFilter] = useState('');
    const [firstNameFilter, setFirstNameFilter] = useState('');
    const [lastNameFilter, setLastNameFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    


    useEffect(() => {
        fetchAuditViewData();
    }, [page]);

    async function fetchAuditViewData() {
        setLoading(true);
        try {
            const auditViewData = await getAuditViewData();
            auditViewData.sort((a, b) => new Date(b.ts) - new Date(a.ts)); // Sort by timestamp descending
            setAuditViewData(auditViewData);
        } catch (error) {
            console.error("Error fetching audit view data:", error);
        }
        setLoading(false);
    }

    const handleRefresh = async () => {
        await fetchAuditViewData();
    };

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
        "logged_user_action",
        "session_id",
        "ip",
        "browser_version",
    ];
    
    const [visibleColumns, setVisibleColumns] = useState(pageViewColumns); 

    const pageViewData = auditViewData.filter(log => {
        const matchesPage = log.page;
        const matchesEmail = log.logged_user_email?.toLowerCase().includes(emailFilter.toLowerCase());
        const matchesFirstName = log.logged_user_first_name?.toLowerCase().includes(firstNameFilter.toLowerCase());
        const matchesLastName = log.logged_user_last_name?.toLowerCase().includes(lastNameFilter.toLowerCase());

        // Date/time filtering
        let matchesStart = true;
        let matchesEnd = true;
        if (startDate) {
            matchesStart = new Date(log.ts) >= new Date(startDate);
        }
        if (endDate) {
            matchesEnd = new Date(log.ts) <= new Date(endDate);
        }

        return matchesPage && matchesEmail && matchesFirstName && matchesLastName && matchesStart && matchesEnd;
        
    });
    // Pagination logic
    const totalPages = Math.ceil(pageViewData.length / PAGE_SIZE);
    const pagedData = pageViewData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


    return (
        <PageContainer>
            <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />

            <main className='ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4'>
                <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Audit</h1>

                <button
                    className="btn btn-info text-white m-4"
                    onClick={handleRefresh}
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-4">
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
                    <div className="flex gap-2">
                        <input
                            type="datetime-local"
                            className="border px-2 py-1"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            placeholder="Start Date/Time"
                        />
                        <input
                            type="datetime-local"
                            className="border px-2 py-1"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            placeholder="End Date/Time"
                        />

                    </div>

                    <button
                        className="px-3 py-1 bg-gray-300 rounded"
                        onClick={() => {
                            setEmailFilter('');
                            setFirstNameFilter('');
                            setLastNameFilter('');
                            setStartDate('');
                            setEndDate('');
                        }}
                    >
                        Clear Filters
                    </button>

                    {/* Column visibility controls */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        Show Columns:
                        <label className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={visibleColumns.length === pageViewColumns.length}
                                onChange={e => {
                                    if (e.target.checked) {
                                        setVisibleColumns(pageViewColumns);
                                    } else {
                                        setVisibleColumns([]);
                                    }
                                }}
                            />
                            Select All
                        </label>

                        {pageViewColumns.map(col => (
                            <label key={col} className="flex items-center gap-1">
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.includes(col)}
                                    onChange={() => {
                                        setVisibleColumns(prev =>
                                            prev.includes(col)
                                                ? prev.filter(c => c !== col)
                                                : [...prev, col]
                                        );
                                    }}
                                />
                                {col}
                            </label>
                        ))}
                    </div>
                    
                   

                </div>

                {/* Pagination Controls */}
                <div className="flex gap-2 mb-2 items-center">
                    <button
                        className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                        className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                        <div className="overflow-x-auto" style={{ maxHeight: 600, minWidth: 500, overflowY: 'auto' , overflowX: 'auto' }}>
                        <table className="min-w-full border text-xs">
                            <thead>
                                <tr>
                                        {pageViewColumns.filter(col => visibleColumns.includes(col)).map(col => (
                                            <th key={col}>{col}</th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody>
                                    {pagedData.map((log, idx) => (
                                    <tr key={log.log_view_id || idx}>
                                            {pageViewColumns.filter(col => visibleColumns.includes(col)).map(col => (
                                                <td key={col}>{typeof log[col] === "boolean" ? String(log[col]) : log[col]}</td>
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