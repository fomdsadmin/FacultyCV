import React from 'react';
import PageContainer from '../../Views/PageContainer.jsx';
import FacultyMenu from '../../Components/FacultyMenu.jsx';
import DepartmentAdminMenu from '../../Components/DepartmentAdminMenu.jsx';
import { Accordion } from '../../SharedComponents/Accordion/Accordion.jsx';
import AuditFilters from '../../Components/AuditFilters.jsx';
import AuditTable from '../../Components/AuditTable.jsx';
import { useAuditData } from './useAuditData.js';

const YourActivityPage = ({ userInfo, getCognitoUser, currentViewRole }) => {
    const auditData = useAuditData(userInfo, true); // true = personal view

    const {
        loading,
        auditViewData,
        totalCount,
        page_number,
        PAGE_SIZE,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        actionFilter,
        setActionFilter,
        impersonationFilter,
        setImpersonationFilter,
        actionCategory,
        setActionCategory,
        setPageNumber,
        fetchAuditViewData,
        clearFilters
    } = auditData;

    // Determine which menu component to use
    const getMenuComponent = () => {
        let role = userInfo?.role || '';
        if (currentViewRole !== role) {
            role = currentViewRole;
        }
        return role.startsWith('Admin-') ? DepartmentAdminMenu : FacultyMenu;
    };

    const isFacultyUser = () => {
        const role = userInfo?.role || '';
        return role === 'Faculty';
    };

    const MenuComponent = getMenuComponent();

    const pageViewColumns = ["ts", "page", "logged_user_action", "profile_record"];

    const getColumnDisplayName = (columnName) => {
        const columnMap = {
            "ts": "Timestamp",
            "page": "Page",
            "logged_user_action": "Action",
            "profile_record": "Action Details"
        };
        return columnMap[columnName] || columnName;
    };

    const handleFilterChange = (filterName, value) => {
        switch (filterName) {
            case 'startDate': setStartDate(value); break;
            case 'endDate': setEndDate(value); break;
            case 'actionFilter': setActionFilter(value); break;
            case 'actionCategory': setActionCategory(value); break;
            case 'impersonationFilter': setImpersonationFilter(value); break;
        }
    };

    const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : Math.ceil(auditViewData.length / PAGE_SIZE);

    return (
        <PageContainer>
            <MenuComponent getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />

            <main className='px-12 mt-4 overflow-auto custom-scrollbar w-full mb-4'>
                <h1 className="text-left text-4xl font-bold text-zinc-600 mb-4">Your Activity Logs</h1>

                <Accordion>
                    <AuditFilters
                        isPersonalView={true}
                        isFacultyUser={isFacultyUser()}
                        filters={{
                            startDate, endDate, actionFilter, actionCategory, impersonationFilter
                        }}
                        onFilterChange={handleFilterChange}
                        onClearFilters={clearFilters}
                    />
                </Accordion>

                <div className="flex items-center gap-7 mt-4 mb-4 justify-end">
                    <div className="flex gap-2 items-center">
                        <button
                            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                            onClick={() => setPageNumber(page_number - 1)}
                            disabled={page_number === 1}
                        >
                            Previous
                        </button>
                        <span>Page {page_number} of {totalPages || 1}</span>
                        <button
                            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                            onClick={() => setPageNumber(page_number + 1)}
                            disabled={page_number === totalPages || auditViewData.length === 0}
                        >
                            Next
                        </button>
                    </div>
                    <button
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={fetchAuditViewData}
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>

                <AuditTable
                    loading={loading}
                    auditViewData={auditViewData}
                    columns={pageViewColumns}
                    getColumnDisplayName={getColumnDisplayName}
                    isPersonalView={true}
                />
            </main>
        </PageContainer>
    );
};

export default YourActivityPage;