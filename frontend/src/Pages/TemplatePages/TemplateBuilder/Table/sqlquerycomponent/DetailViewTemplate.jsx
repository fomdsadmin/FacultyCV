import React from "react";

const SqlViewTemplate = ({ sqlSettings, setSqlSettings }) => {
    const handleShowHeadersChange = (e) => {
        setSqlSettings({
            ...sqlSettings,
            sqlViewTemplate: {
                ...sqlSettings?.sqlViewTemplate,
                showHeaders: e.target.checked,
                selected: true
            }
        });
    };

    const handleGrayFirstColumnChange = (e) => {
        setSqlSettings({
            ...sqlSettings,
            sqlViewTemplate: {
                ...sqlSettings?.sqlViewTemplate,
                grayFirstColumn: e.target.checked,
                selected: true
            }
        });
    };

    return (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">SQL View Template</h4>
            <p className="text-xs text-blue-800 leading-relaxed mb-4">
                The SQL View Template displays the SQL query results directly as a table with customizable options.
            </p>
            
            <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={sqlSettings?.sqlViewTemplate?.showHeaders ?? true}
                        onChange={handleShowHeadersChange}
                        className="w-4 h-4"
                    />
                    <span className="text-xs text-blue-800">Show Column Headers</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={sqlSettings?.sqlViewTemplate?.grayFirstColumn ?? false}
                        onChange={handleGrayFirstColumnChange}
                        className="w-4 h-4"
                    />
                    <span className="text-xs text-blue-800">Gray First Column</span>
                </label>
            </div>
        </div>
    );
};

export default SqlViewTemplate;
