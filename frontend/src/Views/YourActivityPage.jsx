import React from 'react'
import { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import AdminMenu from '../Components/AdminMenu.jsx';
import { Accordion } from '../SharedComponents/Accordion/Accordion.jsx';
import { AccordionItem } from '../SharedComponents/Accordion/AccordionItem.jsx';
import { getAuditViewData } from '../graphql/graphqlHelpers.js';
import { AUDIT_ACTIONS } from '../Contexts/AuditLoggerContext.jsx';


const YourActivityPage = ({ userInfo, getCognitoUser}) => {
    const [loading, setLoading] = useState(false);
    const [auditViewData, setAuditViewData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    const PAGE_SIZE = 10;
    const [page_number, setPageNumber] = useState(1); // Current page number

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    useEffect(() => {
        setPageNumber(1);
    }, [startDate, endDate, actionFilter, page_number]);

    useEffect(() => {
        fetchAuditViewData();
    }, [startDate, endDate, actionFilter]);

    async function fetchAuditViewData() {
        setLoading(true);
        try {
            console.log("Fetching audit view data for user:", userInfo, userInfo.user_id, userInfo.email, "page:", page_number);

            const response = await getAuditViewData({
                email: userInfo.email, 
                page_number,
                page_size: PAGE_SIZE,
            });

            const data = Array.isArray(response) ? response : (response.records || []);
            data.sort((a, b) => new Date(b.ts) - new Date(a.ts));

            setAuditViewData(data);

            // This should be total results from backend
            setTotalCount(response.total_count ?? totalCount);
        } catch (error) {
            console.error("Error fetching audit view data:", error);
        }
        setLoading(false);
    }


    const handleRefresh = async () => {
        await fetchAuditViewData();
    };

    // Update the formatTimestamp function to adjust for UTC
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';

        try {
            // Parse the timestamp, assuming it's UTC and convert to local time
            // The format appears to be "2025-07-04 22:43:40.644432" (UTC)

            // standardize the timestamp format
            let parsedTimestamp = timestamp;

            // If the timestamp contains space and no 'T' (like "2025-07-04 22:43:40.644432")
            // Convert it to ISO format by replacing space with 'T' and adding 'Z' to indicate UTC
            if (typeof timestamp === 'string' && timestamp.includes(' ') && !timestamp.includes('T')) {
                parsedTimestamp = timestamp.replace(' ', 'T') + 'Z';
            }

            // Create date object - now properly interpreting as UTC
            const date = new Date(parsedTimestamp);

            // Format the date in local time
            let convertedDate = date.toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZoneName: 'short'
            });

            return convertedDate;
        } catch (error) {
            console.error("Error formatting timestamp:", error, timestamp);
            return timestamp; // Return the original if parsing fails
        }
    };

    const pageViewColumns = [
        "ts",
        "logged_user_first_name",
        "logged_user_last_name",
        "logged_user_email",
        "logged_user_role",
        "page",
        "logged_user_action",
    ];


    const pageViewData = auditViewData.filter(log => {
        const matchesAction = !actionFilter || log.logged_user_action === actionFilter;

        // Date/time filtering
        let matchesStart = true;
        let matchesEnd = true;
        if (startDate) {
            matchesStart = new Date(log.ts) >= new Date(startDate);
        }
        if (endDate) {
            matchesEnd = new Date(log.ts) <= new Date(endDate);
        }

        return  matchesStart && matchesEnd && matchesAction;

    });
    // Pagination logic
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const pagedData = auditViewData; 



    return (
        <PageContainer>
            <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />

            <main className='px-12 mt-4 overflow-auto custom-scrollbar w-full mb-4'>
                <h1 className="text-left text-4xl font-bold text-zinc-600 mb-4">Your Activity</h1>

                <Accordion>
                    {/* Filters Section */}
                    <AccordionItem title="Filters">
                        <div className="flex flex-wrap gap-4 p-4">
                            <div className="flex gap-2">
                                <input
                                    type="datetime-local"
                                    className="border px-2 py-1 rounded"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    placeholder="Start Date/Time"
                                />
                                <input
                                    type="datetime-local"
                                    className="border px-2 py-1 rounded"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    placeholder="End Date/Time"
                                />
                            </div>
                            <select
                                className="border px-2 py-1 rounded"
                                value={actionFilter}
                                onChange={e => setActionFilter(e.target.value)}
                            >
                                <option value="">All Actions</option>
                                {Object.values(AUDIT_ACTIONS).map(action => (
                                    <option key={action} value={action}>
                                        {action}
                                    </option>
                                ))}
                            </select>

                            <button
                                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                    setActionFilter('');
                                }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </AccordionItem>
                </Accordion>


                <div className="flex items-center gap-7 mt-4 mb-4 justify-end">
                    {/* Pagination Controls */}
                    <div className="flex gap-2 items-center">
                        <button
                            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                            onClick={() => setPageNumber(page_number - 1)}
                            disabled={page_number === 1}
                        >
                            Previous
                        </button>
                        <span>Page {page_number} of {totalPages}</span>
                        <span>Total Records: {totalCount}</span> 
                        <button
                            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                            onClick={() => setPageNumber(page_number + 1)}
                            disabled={page_number === totalPages}
                        >
                            Next
                        </button>
                    </div>
                    {/* Refresh Button */}
                    <button
                        className="btn btn-info text-white"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>


                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="overflow-x-auto" style={{ maxHeight: 600, minWidth: 500, overflowY: 'auto', overflowX: 'auto' }}>
                        <table className="min-w-full border text-xs">
                            <thead>
                                <tr>
                                    {pageViewColumns.map(col => (
                                        <th key={col}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pagedData.map((log, idx) => (
                                    <tr key={log.log_view_id || idx}>
                                        {pageViewColumns.map(col => (
                                            <td key={col}>
                                                {col === "ts"
                                                    ? formatTimestamp(log[col])
                                                    : typeof log[col] === "boolean"
                                                        ? String(log[col])
                                                        : log[col]}

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

export default YourActivityPage;