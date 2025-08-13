import React from 'react'
import { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';

import FacultyMenu from '../Components/FacultyMenu.jsx';
import FacultyAdminMenu from '../Components/FacultyAdminMenu.jsx';
import DepartmentAdminMenu from '../Components/DepartmentAdminMenu.jsx';


import { Accordion } from '../SharedComponents/Accordion/Accordion.jsx';
import { AccordionItem } from '../SharedComponents/Accordion/AccordionItem.jsx';
import { getAuditViewData } from '../graphql/graphqlHelpers.js';
import { AUDIT_ACTIONS } from '../Contexts/AuditLoggerContext.jsx';


const YourActivityPage = ({ userInfo, getCognitoUser, currentViewRole }) => {
    const [loading, setLoading] = useState(false);
    const [auditViewData, setAuditViewData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    const PAGE_SIZE = 10;
    const [page_number, setPageNumber] = useState(1); // Current page number

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    // Determine which menu component to use based on the user role
    const getMenuComponent = () => {
        let role = userInfo?.role || '';
        if (currentViewRole !== role) {
            role = currentViewRole;
        }

        if (role.startsWith('Admin-')) {
            return DepartmentAdminMenu;
        } else if (role.startsWith('FacultyAdmin-')) {
            return FacultyAdminMenu;
        } else {
            return FacultyMenu;
        }
    };

    const MenuComponent = getMenuComponent();

    useEffect(() => {
        setPageNumber(1);
    }, [startDate, endDate, actionFilter]);

    useEffect(() => {
        fetchAuditViewData();
    }, [startDate, endDate, actionFilter, page_number]);

    async function fetchAuditViewData() {
        setLoading(true);
        try {
            console.log("Fetching audit view data for user:", userInfo, userInfo.user_id, userInfo.email, "page:", page_number);

            const response = await getAuditViewData({
                email: userInfo.email,
                page_number,
                page_size: PAGE_SIZE,
                action: actionFilter || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined
            });

            const data = Array.isArray(response) ? response : (response.records || []);
            data.sort((a, b) => new Date(b.ts) - new Date(a.ts));

            setAuditViewData(data);

            // This should be total results from backend
            setTotalCount(response.total_count ?? data.length);
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

    // Filter the data directly on the client side for any filters not handled by the API
    const filteredData = auditViewData.filter(log => {
        let matchesStart = true;
        let matchesEnd = true;
        let matchesAction = true;

        // Only apply client-side filtering if we're not sending these filters to the API
        if (startDate && !fetchAuditViewData.toString().includes('start_date')) {
            matchesStart = new Date(log.ts) >= new Date(startDate);
        }

        if (endDate && !fetchAuditViewData.toString().includes('end_date')) {
            matchesEnd = new Date(log.ts) <= new Date(endDate);
        }

        if (actionFilter && !fetchAuditViewData.toString().includes('action')) {
            matchesAction = log.logged_user_action === actionFilter;
        }

        return matchesStart && matchesEnd && matchesAction;
    });

    // Use the filtered data for display
    const pagedData = filteredData;

    // Calculate total pages based on filtered data if no API pagination
    const calculatedTotalPages = Math.ceil(filteredData.length / PAGE_SIZE);
    const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : calculatedTotalPages;

    return (
        <PageContainer>
            <MenuComponent getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />


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
                            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                            onClick={() => setPageNumber(page_number - 1)}
                            disabled={page_number === 1}
                        >
                            Previous
                        </button>
                        <span>Page {page_number} of {totalPages || 1}</span>
                        <span>Total Records: {filteredData.length}</span>
                        <button
                            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                            onClick={() => setPageNumber(page_number + 1)}
                            disabled={page_number === totalPages || filteredData.length === 0}
                        >
                            Next
                        </button>
                    </div>
                    {/* Refresh Button */}
                    <button
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>


                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow" style={{ maxHeight: 600, minWidth: 500, overflowY: 'auto', overflowX: 'auto' }}>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    {pageViewColumns.map(col => (
                                        <th
                                            key={col}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {col === "ts" ? "Timestamp" :
                                                col === "logged_user_first_name" ? "First Name" :
                                                    col === "logged_user_last_name" ? "Last Name" :
                                                        col === "logged_user_email" ? "Email" :
                                                            col === "logged_user_role" ? "Role" :
                                                                col === "page" ? "Page" :
                                                                    col === "logged_user_action" ? "Action" : col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pagedData.length > 0 ? (
                                    pagedData.map((log, idx) => (
                                        <tr key={log.log_view_id || idx} className="hover:bg-gray-50">
                                            {pageViewColumns.map(col => (
                                                <td
                                                    key={col}
                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                                >
                                                    {col === "ts"
                                                        ? formatTimestamp(log[col])
                                                        : col === "logged_user_action"
                                                            ? <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                {log[col]}
                                                            </span>
                                                            : typeof log[col] === "boolean"
                                                                ? String(log[col])
                                                                : log[col] || "-"}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={pageViewColumns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No activity data found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </PageContainer>
    )
}

export default YourActivityPage;