import React, { useState } from "react";
import ColumnTextTemplateEditor from "./ColumnTextTemplateEditor";
import SqlViewTemplate from "./DetailViewTemplate";

const CustomTableTemplate = ({ sqlSettings, setSqlSettings, availableColumns = [] }) => {
    const [selectedTemplate, setSelectedTemplate] = useState(
        sqlSettings?.columnTextTemplate?.selected ? "columnTextTemplate" :
        sqlSettings?.sqlViewTemplate?.selected ? "sqlViewTemplate" :
        "columnTextTemplate"
    );

    const handleColumnTextTemplateChange = (html) => {
        setSqlSettings({
            ...sqlSettings,
            columnTextTemplate: {
                html,
                selected: true
            },
            sqlViewTemplate: {
                ...sqlSettings?.sqlViewTemplate,
                selected: false
            }
        });
    };

    const handleSqlViewTemplateSelect = () => {
        setSqlSettings({
            ...sqlSettings,
            columnTextTemplate: {
                html: sqlSettings?.columnTextTemplate?.html || "",
                selected: false
            },
            sqlViewTemplate: {
                showHeaders: sqlSettings?.sqlViewTemplate?.showHeaders ?? true,
                grayFirstColumn: sqlSettings?.sqlViewTemplate?.grayFirstColumn ?? false,
                selected: true
            }
        });
    };

    return (
        <div className="mt-4">
            <div className="mb-3">
                <label className="text-xs text-gray-600 block mb-2 font-medium">
                    Custom Table Template
                </label>
                <select
                    value={selectedTemplate}
                    onChange={(e) => {
                        const selectedValue = e.target.value;
                        setSelectedTemplate(selectedValue);
                        if (selectedValue === "sqlViewTemplate") {
                            handleSqlViewTemplateSelect();
                        } else if (selectedValue === "columnTextTemplate") {
                            setSqlSettings({
                                ...sqlSettings,
                                columnTextTemplate: {
                                    html: sqlSettings?.columnTextTemplate?.html || "",
                                    selected: true
                                },
                                sqlViewTemplate: {
                                    ...sqlSettings?.sqlViewTemplate,
                                    selected: false
                                }
                            });
                        }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-xs box-sizing-border"
                >
                    <option value="columnTextTemplate">Column Text Template</option>
                    <option value="sqlViewTemplate">SQL View Template</option>
                </select>
            </div>

            {selectedTemplate === "columnTextTemplate" && (
                <ColumnTextTemplateEditor
                    template={sqlSettings?.columnTextTemplate?.html || ""}
                    onTemplateChange={handleColumnTextTemplateChange}
                    availableColumns={availableColumns}
                />
            )}

            {selectedTemplate === "sqlViewTemplate" && (
                <SqlViewTemplate 
                    sqlSettings={sqlSettings}
                    setSqlSettings={setSqlSettings}
                />
            )}
        </div>
    );
};

export default CustomTableTemplate;
