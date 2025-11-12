import React, { useState } from "react";
import ColumnTextTemplateEditor from "./ColumnTextTemplateEditor";
import DetailViewTemplate from "./DetailViewTemplate";

const CustomTableTemplate = ({ sqlSettings, setSqlSettings, availableColumns = [] }) => {
    const [selectedTemplate, setSelectedTemplate] = useState(
        sqlSettings?.columnTextTemplate?.selected ? "columnTextTemplate" :
        sqlSettings?.detailViewTemplate?.selected ? "detailViewTemplate" :
        "columnTextTemplate"
    );

    const handleColumnTextTemplateChange = (html) => {
        setSqlSettings({
            ...sqlSettings,
            columnTextTemplate: {
                html,
                selected: true
            },
            detailViewTemplate: {
                selected: false
            }
        });
    };

    const handleDetailViewTemplateSelect = () => {
        setSqlSettings({
            ...sqlSettings,
            columnTextTemplate: {
                html: sqlSettings?.columnTextTemplate?.html || "",
                selected: false
            },
            detailViewTemplate: {
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
                        if (selectedValue === "detailViewTemplate") {
                            handleDetailViewTemplateSelect();
                        } else if (selectedValue === "columnTextTemplate") {
                            setSqlSettings({
                                ...sqlSettings,
                                columnTextTemplate: {
                                    html: sqlSettings?.columnTextTemplate?.html || "",
                                    selected: true
                                },
                                detailViewTemplate: {
                                    selected: false
                                }
                            });
                        }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-xs box-sizing-border"
                >
                    <option value="columnTextTemplate">Column Text Template</option>
                    <option value="detailViewTemplate">Detail View Template</option>
                </select>
            </div>

            {selectedTemplate === "columnTextTemplate" && (
                <ColumnTextTemplateEditor
                    template={sqlSettings?.columnTextTemplate?.html || ""}
                    onTemplateChange={handleColumnTextTemplateChange}
                    availableColumns={availableColumns}
                />
            )}

            {selectedTemplate === "detailViewTemplate" && (
                <DetailViewTemplate />
            )}
        </div>
    );
};

export default CustomTableTemplate;
