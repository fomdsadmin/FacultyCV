import React, { useState } from "react";
import ColumnTextTemplateEditor from "./ColumnTextTemplateEditor";
import SqlViewTemplate from "./DetailViewTemplate";
import RecordDetailTemplate from "./RecordDetailTemplate";
import HtmlTemplateEditor from "./HtmlTemplateEditor";

const CustomTableTemplate = ({ sqlSettings, setSqlSettings, availableColumns = [] }) => {
    const [selectedTemplate, setSelectedTemplate] = useState(
        sqlSettings?.columnTextTemplate?.selected ? "columnTextTemplate" :
        sqlSettings?.sqlViewTemplate?.selected ? "sqlViewTemplate" :
        sqlSettings?.recordDetailTemplate?.selected ? "recordDetailTemplate" :
        sqlSettings?.htmlTemplate?.selected ? "htmlTemplate" :
        "none"
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

    const handleRecordDetailTemplateSelect = () => {
        setSqlSettings({
            ...sqlSettings,
            columnTextTemplate: {
                html: sqlSettings?.columnTextTemplate?.html || "",
                selected: false
            },
            sqlViewTemplate: {
                ...sqlSettings?.sqlViewTemplate,
                selected: false
            },
            recordDetailTemplate: {
                header: sqlSettings?.recordDetailTemplate?.header || "",
                tableRows: sqlSettings?.recordDetailTemplate?.tableRows || [],
                selected: true
            }
        });
    };

    const handleRecordDetailTemplateChange = (updatedTemplate) => {
        setSqlSettings({
            ...sqlSettings,
            recordDetailTemplate: {
                ...updatedTemplate,
                selected: true
            }
        });
    };

    const handleHtmlTemplateChange = (html) => {
        setSqlSettings({
            ...sqlSettings,
            htmlTemplate: {
                ...sqlSettings?.htmlTemplate,
                html,
                selected: true
            },
            columnTextTemplate: {
                html: sqlSettings?.columnTextTemplate?.html || "",
                selected: false
            },
            sqlViewTemplate: {
                ...sqlSettings?.sqlViewTemplate,
                selected: false
            },
            recordDetailTemplate: {
                ...sqlSettings?.recordDetailTemplate,
                selected: false
            }
        });
    };

    const handleHtmlTemplateStyleChange = (style) => {
        setSqlSettings({
            ...sqlSettings,
            htmlTemplate: {
                ...sqlSettings?.htmlTemplate,
                style
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
                        } else if (selectedValue === "recordDetailTemplate") {
                            handleRecordDetailTemplateSelect();
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
                                },
                                recordDetailTemplate: {
                                    ...sqlSettings?.recordDetailTemplate,
                                    selected: false
                                },
                                htmlTemplate: {
                                    html: sqlSettings?.htmlTemplate?.html || "",
                                    selected: false
                                }
                            });
                        } else if (selectedValue === "htmlTemplate") {
                            setSqlSettings({
                                ...sqlSettings,
                                htmlTemplate: {
                                    html: sqlSettings?.htmlTemplate?.html || "",
                                    selected: true
                                },
                                columnTextTemplate: {
                                    html: sqlSettings?.columnTextTemplate?.html || "",
                                    selected: false
                                },
                                sqlViewTemplate: {
                                    ...sqlSettings?.sqlViewTemplate,
                                    selected: false
                                },
                                recordDetailTemplate: {
                                    ...sqlSettings?.recordDetailTemplate,
                                    selected: false
                                }
                            });
                        } else if (selectedValue === "none") {
                            setSqlSettings({
                                ...sqlSettings,
                                columnTextTemplate: {
                                    html: sqlSettings?.columnTextTemplate?.html || "",
                                    selected: false
                                },
                                sqlViewTemplate: {
                                    ...sqlSettings?.sqlViewTemplate,
                                    selected: false
                                },
                                recordDetailTemplate: {
                                    ...sqlSettings?.recordDetailTemplate,
                                    selected: false
                                },
                                htmlTemplate: {
                                    html: sqlSettings?.htmlTemplate?.html || "",
                                    selected: false
                                }
                            });
                        }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-xs box-sizing-border"
                >
                    <option value="none">Default Template (None selected)</option>
                    <option value="columnTextTemplate">Column Text Template</option>
                    <option value="htmlTemplate">HTML Template</option>
                    <option value="sqlViewTemplate">SQL View Template</option>
                    <option value="recordDetailTemplate">Record Detail Template</option>
                </select>
            </div>

            {selectedTemplate === "columnTextTemplate" && (
                <ColumnTextTemplateEditor
                    template={sqlSettings?.columnTextTemplate?.html || ""}
                    onTemplateChange={handleColumnTextTemplateChange}
                    availableColumns={availableColumns}
                />
            )}

            {selectedTemplate === "htmlTemplate" && (
                <HtmlTemplateEditor
                    htmlTemplate={sqlSettings?.htmlTemplate?.html || ""}
                    setHtmlTemplate={handleHtmlTemplateChange}
                    htmlTemplateStyle={sqlSettings?.htmlTemplate?.style || ""}
                    setHtmlTemplateStyle={handleHtmlTemplateStyleChange}
                    availableColumns={availableColumns}
                />
            )}

            {selectedTemplate === "sqlViewTemplate" && (
                <SqlViewTemplate 
                    sqlSettings={sqlSettings}
                    setSqlSettings={setSqlSettings}
                />
            )}

            {selectedTemplate === "recordDetailTemplate" && (
                <RecordDetailTemplate
                    recordDetailTemplate={sqlSettings?.recordDetailTemplate || {}}
                    setRecordDetailTemplate={handleRecordDetailTemplateChange}
                    availableColumns={availableColumns}
                />
            )}

            {selectedTemplate === "none" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-gray-700">
                    Using default template - data will be displayed in standard table format.
                </div>
            )}
        </div>
    );
};

export default CustomTableTemplate;
