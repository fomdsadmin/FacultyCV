import React, { useState } from 'react';
import PageContainer from '../../Views/PageContainer.jsx';
import AdminMenu from '../../Components/AdminMenu.jsx';
import FacultyAdminMenu from '../../Components/FacultyAdminMenu.jsx';
import { Accordion } from '../../SharedComponents/Accordion/Accordion.jsx';
import { AccordionItem } from '../../SharedComponents/Accordion/AccordionItem.jsx';
import AuditFilters from '../../Components/AuditFilters.jsx';
import AuditTable from '../../Components/AuditTable.jsx';
import { useAuditData } from './useAuditData.js';

const AuditPage = ({ getCognitoUser, userInfo, currentViewRole }) => {
    const pageViewColumns = [
        "log_view_id", "ts", "logged_user_id", "logged_user_first_name",
        "logged_user_last_name", "logged_user_email", "logged_user_role",
        "assistant", "page", "logged_user_action", "profile_record",
        "session_id", "ip", "browser_version",
    ];
    const auditData = useAuditData(userInfo, false); // false = admin view

    const {
        loading,
        auditViewData,
        totalCount,
        page_number,
        PAGE_SIZE,
        emailFilter,
        setEmailFilter,
        firstNameFilter,
        setFirstNameFilter,
        lastNameFilter,
        setLastNameFilter,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        actionFilter,
        setActionFilter,
        actionCategory,
        setActionCategory,
        setPageNumber,
        fetchAuditViewData,
        clearFilters
    } = auditData;

    // Component-specific state
    const [visibleColumns, setVisibleColumns] = useState(() => {
        return pageViewColumns.filter(col => col !== "log_view_id" && col !== "assistant");
    });

    // Determine which menu component to use
    const getMenuComponent = () => {
        let role = userInfo?.role || '';
        if (currentViewRole !== role) {
            role = currentViewRole;
        }
        return (role && role.startsWith('FacultyAdmin-')) ? FacultyAdminMenu : AdminMenu;
    };

    const MenuComponent = getMenuComponent();

    

    const getColumnDisplayName = (columnName) => {
        const columnMap = {
            "ts": "Timestamp", "logged_user_first_name": "First Name",
            "logged_user_last_name": "Last Name", "logged_user_email": "Email",
            "logged_user_role": "Role", "page": "Page", "logged_user_action": "Action",
            "log_view_id": "ID", "logged_user_id": "User ID", "assistant": "Assistant",
            "profile_record": "Action Details", "session_id": "Session ID",
            "ip": "IP Address", "browser_version": "Browser"
        };
        return columnMap[columnName] || columnName;
    };

    const getColumnWidth = (col) => {
        switch (col) {
            case "logged_user_email": return "200px";
            case "logged_user_first_name": return "120px";
            case "logged_user_last_name": return "120px";
            case "profile_record": return "400px";
            case "page": return "250px";
            case "browser_version": return "600px";
            case "logged_user_action": return "150px";
            default: return "auto";
        }
    };

    const handleFilterChange = (filterName, value) => {
        switch (filterName) {
            case 'emailFilter': setEmailFilter(value); break;
            case 'firstNameFilter': setFirstNameFilter(value); break;
            case 'lastNameFilter': setLastNameFilter(value); break;
            case 'startDate': setStartDate(value); break;
            case 'endDate': setEndDate(value); break;
            case 'actionFilter': setActionFilter(value); break;
            case 'actionCategory': setActionCategory(value); break;
        }
    };

    const handleDownloadCSV = () => {
        const columns = pageViewColumns.filter(col => visibleColumns.includes(col));
        const csvRows = [columns.join(',')];

        auditViewData.forEach(log => {
            const rowData = columns.map(col => {
                const val = log[col];
                if (val === null || val === undefined) return '';
                if (typeof val === "boolean") return String(val);
                if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
                return val;
            });
            csvRows.push(rowData.join(','));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <PageContainer>
            <MenuComponent getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />

            <main className='px-12 mt-4 overflow-auto custom-scrollbar w-full mb-4'>
                <h1 className="text-left text-4xl font-bold text-zinc-600 mb-4">Activity Logs</h1>

                <Accordion>
                    <AuditFilters
                        isPersonalView={false}
                        isFacultyUser={false}
                        filters={{
                            emailFilter, firstNameFilter, lastNameFilter,
                            startDate, endDate, actionFilter, actionCategory
                        }}
                        onFilterChange={handleFilterChange}
                        onClearFilters={clearFilters}
                    />

                    <AccordionItem title="Column Visibility">
                        <div className="flex flex-wrap gap-2 p-4">
                            <label className="flex items-center gap-1 p-1 hover:bg-gray-200 rounded">
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.length === pageViewColumns.length}
                                    onChange={e => setVisibleColumns(e.target.checked ? pageViewColumns : [])}
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
                    <button
                        className="btn btn-info text-white"
                        onClick={fetchAuditViewData}
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                    <button
                        className="btn btn-success text-white"
                        onClick={handleDownloadCSV}
                        disabled={loading || auditViewData.length === 0}
                    >
                        Download CSV
                    </button>
                </div>

                <AuditTable
                    loading={loading}
                    auditViewData={auditViewData}
                    columns={pageViewColumns}
                    visibleColumns={visibleColumns}
                    getColumnDisplayName={getColumnDisplayName}
                    getColumnWidth={getColumnWidth}
                    isPersonalView={false}
                />
            </main>
        </PageContainer>
    );
};

export default AuditPage;