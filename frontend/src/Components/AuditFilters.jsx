import React from 'react';
import { AccordionItem } from '../SharedComponents/Accordion/AccordionItem.jsx';
import { AUDIT_ACTIONS, ACTION_CATEGORIES } from '../Contexts/AuditLoggerContext.jsx';

const AuditFilters = ({
    isPersonalView = false,
    isFacultyUser = false,
    filters,
    onFilterChange,
    onClearFilters
}) => {
    const {
        emailFilter,
        firstNameFilter,
        lastNameFilter,
        startDate,
        endDate,
        actionFilter,
        actionCategory
    } = filters;

    return (
        <AccordionItem title="Filters">
            <div className="flex flex-wrap gap-4 p-4">
                {/* Admin-only filters */}
                {!isPersonalView && (
                    <>
                        <input
                            type="text"
                            placeholder="Filter by Email"
                            className="border px-2 py-1 rounded"
                            value={emailFilter}
                            onChange={e => onFilterChange('emailFilter', e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Filter by First Name"
                            className="border px-2 py-1 rounded"
                            value={firstNameFilter}
                            onChange={e => onFilterChange('firstNameFilter', e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Filter by Last Name"
                            className="border px-2 py-1 rounded"
                            value={lastNameFilter}
                            onChange={e => onFilterChange('lastNameFilter', e.target.value)}
                        />
                    </>
                )}

                {/* Date filters */}
                <div className="flex gap-2">
                    <input
                        type="datetime-local"
                        className="border px-2 py-1 rounded"
                        value={startDate}
                        onChange={e => onFilterChange('startDate', e.target.value)}
                        placeholder="Start Date/Time"
                    />
                    <input
                        type="datetime-local"
                        className="border px-2 py-1 rounded"
                        value={endDate}
                        onChange={e => onFilterChange('endDate', e.target.value)}
                        placeholder="End Date/Time"
                    />
                </div>

                {/* Action filters */}
                <div className="flex flex-col gap-2 w-full">
                    <div className="flex gap-2">
                        {/* Show category selector for non-faculty users */}
                        {!isFacultyUser && (
                            <select
                                className="border px-2 py-1 rounded"
                                value={actionCategory}
                                onChange={e => {
                                    onFilterChange('actionCategory', e.target.value);
                                    onFilterChange('actionFilter', ''); // Reset action filter when category changes
                                }}
                            >
                                <option value="ALL">All Action Types</option>
                                <option value="ADMIN_ACTIONS">Admin Actions</option>
                                <option value="OTHER_ACTIONS">Other Actions</option>
                            </select>
                        )}

                        <select
                            className="border px-2 py-1 rounded flex-grow"
                            value={actionFilter}
                            onChange={e => onFilterChange('actionFilter', e.target.value)}
                        >
                            <option value="">
                                {isFacultyUser ? 'All Actions' :
                                    actionCategory === 'ADMIN_ACTIONS' ? 'All Admin Actions' :
                                        actionCategory === 'OTHER_ACTIONS' ? 'All Other Actions' :
                                            'All Actions'}
                            </option>
                            {(isFacultyUser
                                ? Object.values(AUDIT_ACTIONS).filter(action => !ACTION_CATEGORIES.ADMIN_ACTIONS.includes(action))
                                : actionCategory === 'ALL'
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
                            onClick={onClearFilters}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>
        </AccordionItem>
    );
};

export default AuditFilters;