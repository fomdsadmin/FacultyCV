import React from 'react'
import { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import AdminMenu from '../Components/AdminMenu.jsx';
import { Accordion } from '../SharedComponents/Accordion/Accordion';
import { AccordionItem } from '../SharedComponents/Accordion/AccordionItem';

import { getAuditViewData } from '../graphql/graphqlHelpers.js';
import { AUDIT_ACTIONS } from '../Contexts/AuditLoggerContext';

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
    const [actionFilter, setActionFilter] = useState('');

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
                // Handle different data types and escape quotes/commas for CSV
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

            console.log("Original timestamp:", timestamp);
            console.log("Parsed as UTC:", date.toISOString());
            console.log("Local time:", date.toString());

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

    // Create a default set of visible columns that excludes log_view_id
    const defaultVisibleColumns = pageViewColumns.filter(col => col !== "log_view_id");

    // Initialize state with the filtered columns
    const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);

    const pageViewData = auditViewData.filter(log => {
        const matchesPage = log.page;
        const matchesEmail = log.logged_user_email?.toLowerCase().includes(emailFilter.toLowerCase());
        const matchesFirstName = log.logged_user_first_name?.toLowerCase().includes(firstNameFilter.toLowerCase());
        const matchesLastName = log.logged_user_last_name?.toLowerCase().includes(lastNameFilter.toLowerCase());
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

        return matchesPage && matchesEmail && matchesFirstName && matchesLastName && matchesStart && matchesEnd && matchesAction;

    });
    // Pagination logic
    const totalPages = Math.ceil(pageViewData.length / PAGE_SIZE);
    const pagedData = pageViewData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);



    return (
        <PageContainer>
            <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />

            <main className='px-12 mt-4 overflow-auto custom-scrollbar w-full mb-4'>
                <h1 className="text-left text-4xl font-bold text-zinc-600 mb-4">Audit</h1>

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

                <div className="flex items-center gap-4">
                    {/* Pagination Controls */}
                    <div className="flex gap-2 items-center">
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
                    {/* Refresh Button */}
                    <button
                        className="btn btn-info text-white"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>

                {/* Download CSV and Turn Off Audit */}
                <button
                    className="btn btn-success text-white"
                    onClick={handleDownloadCSV}
                    disabled={loading || pageViewData.length === 0}
                >
                    Download CSV
                </button>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="overflow-x-auto" style={{ maxHeight: 600, minWidth: 500, overflowY: 'auto', overflowX: 'auto' }}>
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

export default AuditPage;