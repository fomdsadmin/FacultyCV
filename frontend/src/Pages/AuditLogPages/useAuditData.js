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

    const PAGE_SIZE = isPersonalView ? 10 : 20;

    // Reset page when filters change
    useEffect(() => {
        setPageNumber(1);
    }, [emailFilter, firstNameFilter, lastNameFilter, startDate, endDate, actionFilter]);

    // Fetch data when filters or page changes
    useEffect(() => {
        fetchAuditViewData();
    }, [emailFilter, firstNameFilter, lastNameFilter, startDate, endDate, actionFilter, page_number]);

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
                page_number,
                page_size: PAGE_SIZE,
                action: actionFilter || undefined,
                start_date: formattedStartDate,
                end_date: formattedEndDate
            };

            // Add personal view specific params
            if (isPersonalView) {
                requestParams.logged_user_id = userInfo.user_id;
                requestParams.email = userInfo.email;
            } else {
                // Add admin view specific params
                if (emailFilter) requestParams.email = emailFilter;
                if (firstNameFilter) requestParams.first_name = firstNameFilter;
                if (lastNameFilter) requestParams.last_name = lastNameFilter;
            }

            const response = await getAuditViewData(requestParams);
            const data = Array.isArray(response) ? response : (response.records || []);
            data.sort((a, b) => new Date(b.ts) - new Date(a.ts));

            setAuditViewData(data);
            setTotalCount(response.total_count ?? data.length);
        } catch (error) {
            console.error("Error fetching audit view data:", error);
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

        // Actions
        setPageNumber,
        fetchAuditViewData,
        clearFilters
    };
};