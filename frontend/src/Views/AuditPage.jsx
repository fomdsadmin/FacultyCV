import React from 'react'
import { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import AdminMenu from '../Components/AdminMenu.jsx';
import FacultyAdminMenu from '../Components/FacultyAdminMenu.jsx';
import { Accordion } from '../SharedComponents/Accordion/Accordion';
import { AccordionItem } from '../SharedComponents/Accordion/AccordionItem';

import { getAuditViewData } from '../graphql/graphqlHelpers.js';
import { AUDIT_ACTIONS, ACTION_CATEGORIES } from '../Contexts/AuditLoggerContext';


const AuditPage = ({ getCognitoUser, userInfo, currentViewRole }) => {
    const [loading, setLoading] = useState(false);
    const [auditViewData, setAuditViewData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    // Determine which menu component to use based on the user role
    const getMenuComponent = () => {
        // Get the current role with fallback to empty string
        let role = userInfo?.role || '';

        // Use currentViewRole if available and different from user's role
        if (currentViewRole && currentViewRole !== role) {
            role = currentViewRole;
        }

        // Check if the role is for faculty admin
        return (role && role.startsWith('FacultyAdmin-')) ?
            FacultyAdminMenu :
            AdminMenu;
    };
    const MenuComponent = getMenuComponent();


    const PAGE_SIZE = 20;
    const [page_number, setPageNumber] = useState(1); // Current page number

    const [emailFilter, setEmailFilter] = useState('');
    const [firstNameFilter, setFirstNameFilter] = useState('');
    const [lastNameFilter, setLastNameFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const [actionCategory, setActionCategory] = useState('ALL');


    useEffect(() => {
        setPageNumber(1); // reset if filter change 
    }, [emailFilter, firstNameFilter, lastNameFilter, startDate, endDate, actionFilter]);

    useEffect(() => {
        fetchAuditViewData();
    }, [emailFilter, firstNameFilter, lastNameFilter, startDate, endDate, actionFilter, page_number]);

    async function fetchAuditViewData() {
        setLoading(true);
        try {

            // Start with proper date formatting for both start and end dates
            let formattedStartDate = startDate;
            let formattedEndDate = endDate;

            // Format start date if it exists
            if (startDate) {
                const startDateObj = new Date(startDate);
                // Set to beginning of day for start date
                startDateObj.setHours(0, 0, 0, 0);
                formattedStartDate = startDateObj.toISOString().split('.')[0]; // Remove milliseconds
                console.log("Formatted start date:", formattedStartDate);
            }

            // Format end date if it exists
            if (endDate) {
                const endDateObj = new Date(endDate);
                // Set to end of day for end date
                endDateObj.setHours(23, 59, 59, 999);
                formattedEndDate = endDateObj.toISOString().split('.')[0]; // Remove milliseconds
                console.log("Formatted end date:", formattedEndDate);
            }

            const response = await getAuditViewData({
                page_number,
                page_size: PAGE_SIZE,
                email: emailFilter,
                first_name: firstNameFilter,
                last_name: lastNameFilter,
                action: actionFilter,
                start_date: formattedStartDate,
                end_date: formattedEndDate,
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

    // Add handler to download CSV
    const handleDownloadCSV = () => {
        // Filter columns based on visibility
        const columns = pageViewColumns.filter(col => visibleColumns.includes(col));

        // Create CSV header row
        const csvRows = [columns.join(',')];

        // Add data rows (use filtered data to match what user is viewing)
        pageViewData.forEach(log => {
            const rowData = columns.map(col => {
                const val = log[col];
                if (val === null || val === undefined) return '';
                if (typeof val === "boolean") return String(val);
                if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
                return val;
            });
            csvRows.push(rowData.join(','));
        });

        // Generate and trigger download
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            // for debug
            // console.log("Original timestamp:", timestamp);
            // console.log("Parsed as UTC:", date.toISOString());
            // console.log("Local time:", date.toString());

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

    // Create a default set of visible columns that excludes log_view_id, assistant, and profile_record
    const defaultVisibleColumns = pageViewColumns.filter(col => col !== "log_view_id" && col !== "assistant" && col !== "profile_record");

    // Initialize state with the filtered columns
    const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);

    const pageViewData = auditViewData;
    // Pagination logic
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const pagedData = auditViewData;

    // column name map 
    const getColumnDisplayName = (columnName) => {
        const columnMap = {
            "ts": "Timestamp",
            "logged_user_first_name": "First Name",
            "logged_user_last_name": "Last Name",
            "logged_user_email": "Email",
            "logged_user_role": "Role",
            "page": "Page",
            "logged_user_action": "Action",
            "log_view_id": "ID",
            "logged_user_id": "User ID",
            "assistant": "Assistant",
            "profile_record": "Profile Record",
            "session_id": "Session ID",
            "ip": "IP Address",
            "browser_version": "Browser"
        };

        return columnMap[columnName] || columnName;
    };



    return (
        <PageContainer>
            <MenuComponent getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />

            <main className='px-12 mt-4 overflow-auto custom-scrollbar w-full mb-4'>
                <h1 className="text-left text-4xl font-bold text-zinc-600 mb-4">Activity Logs</h1>

                <Accordion>
                    {/* Filters Section */}
                    <AccordionItem title="Filters">
                        <div className="flex flex-wrap gap-4 p-4">
                            <input
                                type="text"
                                placeholder="Filter by Email"
                                className="border px-2 py-1 rounded"
                                value={emailFilter}
                                onChange={e => setEmailFilter(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Filter by First Name"
                                className="border px-2 py-1 rounded"
                                value={firstNameFilter}
                                onChange={e => setFirstNameFilter(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Filter by Last Name"
                                className="border px-2 py-1 rounded"
                                value={lastNameFilter}
                                onChange={e => setLastNameFilter(e.target.value)}
                            />
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
                            {/* Action category selector */}
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex gap-2">
                                    <select
                                        className="border px-2 py-1 rounded"
                                        value={actionCategory}
                                        onChange={e => {
                                            setActionCategory(e.target.value);
                                            setActionFilter(''); // Reset action filter when category changes
                                        }}
                                    >
                                        <option value="ALL">All Action Types</option>
                                        <option value="ADMIN_ACTIONS">Admin Actions</option>
                                        <option value="OTHER_ACTIONS">Other Actions</option>
                                    </select>

                                    <select
                                        className="border px-2 py-1 rounded flex-grow"
                                        value={actionFilter}
                                        onChange={e => setActionFilter(e.target.value)}
                                    >
                                        <option value="">
                                            {actionCategory === 'ADMIN_ACTIONS' ? 'All Admin Actions' :
                                                actionCategory === 'OTHER_ACTIONS' ? 'All Other Actions' :
                                                    'All Actions'}
                                        </option>
                                        {(actionCategory === 'ALL'
                                            ? Object.values(AUDIT_ACTIONS)
                                            : ACTION_CATEGORIES[actionCategory] || []
                                        ).map(action => (
                                            <option key={action} value={action}>
                                                {action}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                                        onClick={() => {
                                            setEmailFilter('');
                                            setFirstNameFilter('');
                                            setLastNameFilter('');
                                            setStartDate('');
                                            setEndDate('');
                                            setActionFilter('');
                                        }}
                                    >
                                        Clear Filters
                                    </button>
                                </div>


                            </div>
                        </div>
                    </AccordionItem>

                    {/* Column Visibility Section */}
                    <AccordionItem title="Column Visibility">
                        <div className="flex flex-wrap gap-2 p-4">
                            <label className="flex items-center gap-1 p-1 hover:bg-gray-200 rounded">
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.length === pageViewColumns.length}
                                    onChange={e => {
                                        setVisibleColumns(e.target.checked ? pageViewColumns : []);
                                    }}
                                />
                                <span>Select All</span>
                            </label>
                            {pageViewColumns.map(col => (
                                <label key={col} className="flex items-center gap-1 p-1 hover:bg-gray-200 rounded">
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
                    {/* Download CSV and Turn Off Audit */}
                    <button
                        className="btn btn-success text-white"
                        onClick={handleDownloadCSV}
                        disabled={loading || pageViewData.length === 0}
                    >
                        Download CSV
                    </button>
                </div>


                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow" style={{ maxHeight: 600, overflowY: 'auto' }}>
                        <table className="min-w-full table-fixed divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    {pageViewColumns.filter(col => visibleColumns.includes(col)).map(col => {
                                        // Define column widths based on content type
                                        let width = "30px";
                                        if (col === "ts") width = "30px";
                                        else if (col === "logged_user_action") width = "120px";
                                        else if (col === "logged_user_email") width = "200px";
                                        else if (col === "logged_user_first_name" || col === "logged_user_last_name") width = "40px";
                                        else if (col === "logged_user_role") width = "150px";
                                        else if (col === "log_view_id" || col === "logged_user_id" || col === "session_id") width = "50px";

                                        return (
                                            <th
                                                key={col}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                style={{ width }}
                                            >
                                                {getColumnDisplayName(col)}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pagedData.length > 0 ? (
                                    pagedData.map((log, idx) => (
                                        <tr key={log.log_view_id || idx} className="hover:bg-gray-50">
                                            {pageViewColumns.filter(col => visibleColumns.includes(col)).map(col => (
                                                <td
                                                    key={col}
                                                    className="px-6 py-4 text-sm text-gray-500"
                                                >
                                                    <div className="truncate" title={log[col] != null ? String(log[col]) : ""}>
                                                        {col === "ts"
                                                            ? formatTimestamp(log[col])
                                                            : log[col] || "-"}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={visibleColumns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No audit data found
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

export default AuditPage;