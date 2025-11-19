export const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    try {
        let parsedTimestamp = timestamp;
        if (typeof timestamp === 'string' && timestamp.includes(' ') && !timestamp.includes('T')) {
            parsedTimestamp = timestamp.replace(' ', 'T') + 'Z';
        }

        const date = new Date(parsedTimestamp);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        });
    } catch (error) {
        console.error("Error formatting timestamp:", error, timestamp);
        return timestamp;
    }
};

// action details 
export const parseProfileRecord = (profileRecord) => {
    if (!profileRecord) return null;

    // If it's already an object, return it directly
    if (typeof profileRecord === 'object') {
        if (profileRecord.impersonated_by && profileRecord.impersonated_user) {
            return {
                isImpersonation: true,
                impersonatedBy: profileRecord.impersonated_by,
                impersonatedUser: profileRecord.impersonated_user,
                actionData: profileRecord.action_data
            };
        }
        return { isImpersonation: false, data: profileRecord };
    }

    // Only try to parse if it's a string and looks like JSON (starts with { or [)
    if (typeof profileRecord === 'string' && (profileRecord.trim().startsWith('{') || profileRecord.trim().startsWith('['))) {
        try {
            const parsed = JSON.parse(profileRecord);
            console.log("Parsed profile record:", parsed);
            if (parsed.impersonated_by && parsed.impersonated_user) {
                return {
                    isImpersonation: true,
                    impersonatedBy: parsed.impersonated_by,
                    impersonatedUser: parsed.impersonated_user,
                    actionData: parsed.action_data
                };
            }
            return { isImpersonation: false, data: parsed };
        } catch (e) {
            // Not valid JSON, treat as plain string
            console.warn("Could not parse profile record as JSON:", e.message);
        }
    }
    
    // Return as plain data if it's not JSON
    return { isImpersonation: false, data: profileRecord };
};

export const renderProfileRecord = (profileRecord, isCompact = false) => {
    if (!profileRecord) return '';

    const profileData = parseProfileRecord(profileRecord);

    if (profileData && profileData.isImpersonation) {
        return (
            <div className={`text-xs space-y-2 ${isCompact ? 'p-2' : 'p-3'} bg-orange-50 border-l-4 border-orange-400 rounded-r-lg`}>
                <div className="font-semibold text-orange-700">
                    Impersonated by: {profileData.impersonatedBy.first_name} {profileData.impersonatedBy.last_name} ({profileData.impersonatedBy.role})
                </div>

                {profileData.actionData && (
                    <details className="group">
                        <summary className="cursor-pointer p-1 bg-gray-100 rounded hover:bg-gray-200 text-xs">
                            Action Details (Click to expand)
                        </summary>
                        <div className={`mt-1 p-2 bg-white border rounded ${isCompact ? 'max-h-24' : 'max-h-32'} overflow-y-auto`}>
                            <pre className="whitespace-pre-wrap font-mono text-xs">
                                {typeof profileData.actionData === 'string'
                                    ? profileData.actionData
                                    : JSON.stringify(profileData.actionData, null, 2)}
                            </pre>
                        </div>
                    </details>
                )}
            </div>
        );
    }

    // For non-impersonation records
    try {
        const parsed = JSON.parse(profileRecord);
        return (
            <details className="group text-xs">
                <summary className="cursor-pointer p-2 bg-blue-50 rounded hover:bg-blue-100 border border-blue-200">
                    Data (Click to expand)
                </summary>
                <div className={`mt-1 p-2 bg-white border rounded ${isCompact ? 'max-h-24' : 'max-h-32'} overflow-y-auto`}>
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                        {JSON.stringify(parsed, null, 2)}
                    </pre>
                </div>
            </details>
        );
    } catch (e) {
        return (
            <details className="group text-xs">
                <summary className="cursor-pointer p-2 bg-gray-50 rounded hover:bg-gray-100 border">
                    Raw Data (Click to expand)
                </summary>
                <div className={`mt-1 p-2 bg-white border rounded ${isCompact ? 'max-h-24' : 'max-h-32'} overflow-y-auto`}>
                    {profileRecord}
                </div>
            </details>
        );
    }
};