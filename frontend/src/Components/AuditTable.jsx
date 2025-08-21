import React from 'react';
import { formatTimestamp, renderProfileRecord } from '../utils/auditUtils.js';

const AuditTable = ({
    loading,
    auditViewData,
    columns,
    visibleColumns = null,
    getColumnDisplayName,
    getColumnWidth = null,
    isPersonalView = false
}) => {
    const displayColumns = visibleColumns ? columns.filter(col => visibleColumns.includes(col)) : columns;

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg shadow" style={{ maxHeight: 600, overflowY: 'auto' }}>
            <table className="min-w-full divide-y divide-gray-200" style={getColumnWidth ? { tableLayout: "fixed" } : {}}>
                {getColumnWidth && (
                    <colgroup>
                        {displayColumns.map(col => (
                            <col key={col} style={{ width: getColumnWidth(col) }} />
                        ))}
                    </colgroup>
                )}

                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        {displayColumns.map(col => (
                            <th
                                key={col}
                                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {getColumnDisplayName ? getColumnDisplayName(col) : col}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                    {auditViewData.length === 0 ? (
                        <tr>
                            <td colSpan={displayColumns.length} className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 text-center">
                                {isPersonalView ? 'No activity data found' : 'No records found.'}
                            </td>
                        </tr>
                    ) : (
                        auditViewData.map((log, index) => (
                            <tr key={log.log_view_id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                                {displayColumns.map(col => {
                                    const shouldWrap = ["ts", "logged_user_id", "profile_record", "page", "session_id"].includes(col);

                                    if (col === 'profile_record') {
                                        return (
                                            <td
                                                key={col}
                                                className="px-3 py-2 text-xs text-gray-500 whitespace-normal"
                                                style={getColumnWidth ? { maxWidth: getColumnWidth(col) } : {}}
                                            >
                                                <div className="max-w-md">
                                                    {renderProfileRecord(log[col], isPersonalView)}
                                                </div>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td
                                            key={col}
                                            className={`px-3 py-2 text-xs text-gray-500 ${shouldWrap ? "whitespace-normal break-words" : "truncate"}`}
                                            style={getColumnWidth ? { maxWidth: getColumnWidth(col) } : {}}
                                            title={log[col] && typeof log[col] === 'string' ? log[col] : ''}
                                        >
                                            {col === 'ts' ? formatTimestamp(log[col]) : (log[col] !== null && log[col] !== undefined ? String(log[col]) : '')}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AuditTable;