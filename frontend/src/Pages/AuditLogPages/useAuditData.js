import { useState, useEffect } from 'react';
import { getAuditViewData } from '../../graphql/graphqlHelpers.js';

export const useAuditData = (userInfo, isPersonalView = false) => {
    const [loading, setLoading] = useState(false);
    const [auditViewData, setAuditViewData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page_number, setPageNumber] = useState(1);

    // Filters
    const [emailFilter, setEmailFilter] = useState('');
    const [firstNameFilter, setFirstNameFilter] = useState('');
    const [lastNameFilter, setLastNameFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [actionCategory, setActionCategory] = useState('ALL');
    const [impersonationFilter, setImpersonationFilter] = useState('');

    const PAGE_SIZE = isPersonalView ? 10 : 20;

    // Helper function to check if a record is impersonated
    const isImpersonatedRecord = (profileRecord) => {
        if (!profileRecord) return false;

        try {
            // Handle both string and object cases
            let parsed;
            if (typeof profileRecord === 'string') {
                parsed = JSON.parse(profileRecord);
            } else {
                parsed = profileRecord;
            }

            const hasImpersonation = parsed.impersonated_by && parsed.impersonated_user;
            // console.log('Checking record for impersonation:', {
            //     hasImpersonatedBy: !!parsed.impersonated_by,
            //     hasImpersonatedUser: !!parsed.impersonated_user,
            //     result: hasImpersonation,
            //     recordSnippet: typeof profileRecord === 'string' ? profileRecord.substring(0, 100) : 'object'
            // });

            return hasImpersonation;
        } catch (e) {
            console.log('Error parsing profile record:', e.message);
            return false;
        }
    };

    // Reset page when filters change
    useEffect(() => {
        setPageNumber(1);
    }, [emailFilter, firstNameFilter, lastNameFilter, startDate, endDate, actionFilter, impersonationFilter]);

    // Fetch data when filters or page changes
    useEffect(() => {
        fetchAuditViewData();
    }, [emailFilter, firstNameFilter, lastNameFilter, startDate, endDate, actionFilter, page_number, impersonationFilter]);

    const fetchAuditViewData = async () => {
        setLoading(true);
        try {
            let formattedStartDate = startDate;
            let formattedEndDate = endDate;

            if (startDate) {
                const startDateObj = new Date(startDate);
                startDateObj.setHours(0, 0, 0, 0);
                formattedStartDate = startDateObj.toISOString().split('.')[0];
            }

            if (endDate) {
                const endDateObj = new Date(endDate);
                endDateObj.setHours(23, 59, 59, 999);
                formattedEndDate = endDateObj.toISOString().split('.')[0];
            }

            const requestParams = {
                page_number: impersonationFilter ? 1 : page_number, // Reset to page 1 when filtering
                page_size: impersonationFilter ? 1000 : PAGE_SIZE, // Get more records when filtering
                action: actionFilter || undefined,
                start_date: formattedStartDate,
                end_date: formattedEndDate
            };

            // personal view specific params
            if (isPersonalView) {
                requestParams.logged_user_id = userInfo.user_id;
                requestParams.email = userInfo.email;
            } else {
                // admin view specific params
                if (emailFilter) requestParams.email = emailFilter;
                if (firstNameFilter) requestParams.first_name = firstNameFilter;
                if (lastNameFilter) requestParams.last_name = lastNameFilter;
            }

            const response = await getAuditViewData(requestParams);
            let rawData = Array.isArray(response) ? response : (response.records || []);

            // console.log('Raw data received:', rawData.length, 'records');

            // Apply impersonation filter on frontend - create new array, don't mutate
            let filteredData = rawData;
            if (impersonationFilter) {
                // console.log('Applying impersonation filter:', impersonationFilter);
                const originalLength = rawData.length;

                filteredData = rawData.filter(record => {
                    const isImpersonated = isImpersonatedRecord(record.profile_record);
                    const shouldInclude = impersonationFilter === 'impersonated' ? isImpersonated : !isImpersonated;

                    // // Debug individual records
                    // if (record.profile_record && record.profile_record.includes('impersonated_by')) {
                    //     console.log('Found impersonated record:', {
                    //         action: record.logged_user_action,
                    //         isImpersonated,
                    //         shouldInclude,
                    //         filter: impersonationFilter
                    //     });
                    // }

                    return shouldInclude;
                });

                // console.log(`Filtered from ${originalLength} to ${filteredData.length} records`);
            }

            // Sort the filtered data
            filteredData.sort((a, b) => new Date(b.ts) - new Date(a.ts));

            // Handle pagination for filtered data
            if (impersonationFilter) {
                const startIndex = (page_number - 1) * PAGE_SIZE;
                const endIndex = startIndex + PAGE_SIZE;
                const paginatedData = filteredData.slice(startIndex, endIndex);

                setAuditViewData(paginatedData);
                setTotalCount(filteredData.length);
            } else {
                setAuditViewData(filteredData);
                setTotalCount(response.total_count ?? filteredData.length);
            }

        } catch (error) {
            console.error("Error fetching audit view data:", error);
            setAuditViewData([]);
            setTotalCount(0);
        }
        setLoading(false);
    };

    const clearFilters = () => {
        setEmailFilter('');
        setFirstNameFilter('');
        setLastNameFilter('');
        setStartDate('');
        setEndDate('');
        setActionFilter('');
        setActionCategory('ALL');
        setImpersonationFilter('');
    };

    return {
        // Data
        loading,
        auditViewData,
        totalCount,
        page_number,
        PAGE_SIZE,

        // Filters
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
        impersonationFilter,
        setImpersonationFilter,

        // Actions
        setPageNumber,
        fetchAuditViewData,
        clearFilters
    };
};