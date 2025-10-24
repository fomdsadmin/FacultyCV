import { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { getAllSections } from "../../../graphql/graphqlHelpers";
import { toast } from "react-toastify";
import TemplateModifier from "../SharedTemplatePageComponents/TemplateModifier/TemplateModifier";
import DeleteTemplateButton from "./DeleteTemplateButton/DeleteTemplateButton";
import { HIDDEN_ATTRIBUTE_GROUP_ID, HIDDEN_GROUP_ID, SHOWN_ATTRIBUTE_GROUP_ID } from "../SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";
import { useTemplatePageContext } from "../TemplatesPage/TemplatePageContext";
import { syncTemplateSections } from "../SyncTemplateSections"
import { useApp } from "Contexts/AppContext";
import { useTemplateModifier } from "../SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";

const EditTemplatePage = ({ onBack }) => {

    const { currentViewRole } = useApp();
    const { activeTemplate } = useTemplatePageContext();
    const [title, setTitle] = useState(activeTemplate?.title || "")
    const [template, setTemplate] = useState({ groups: [], sort_ascending: null, created_with_role: null });
    const [loading, setLoading] = useState(true)
    const [showDeclaration, setShowDeclaration] = useState(false);

    useEffect(() => {
        if (activeTemplate) {
            initializeTemplate();
        }
    }, [activeTemplate]);

    const initializeTemplate = async () => {
        if (!activeTemplate) return;

        setLoading(true);

        try {
            // Parse the existing template structure
            const templateStructure = JSON.parse(activeTemplate.template_structure);

            // Add created_with_role if it doesn't exist
            if (!templateStructure.created_with_role) {
                templateStructure.created_with_role = "Admin";
            }

            // Set showDeclaration from template structure, default to false
            setShowDeclaration(templateStructure.show_declaration || false);

            const templateGroups = templateStructure.groups;

            // Get all sections to potentially add missing ones to hidden group
            const fetchedSections = await getAllSections();
            const sortedSections = fetchedSections.sort((a, b) => a.title.localeCompare(b.title));

            // Add back hidden group
            const hiddenGroup = {
                id: HIDDEN_GROUP_ID,
                title: HIDDEN_GROUP_ID,
                prepared_sections: []
            };
            templateStructure.groups.push(hiddenGroup);

            // Find sections that are not in any group and add them to hidden group
            const existingSectionIds = new Set();
            templateGroups.forEach(group => {
                group.prepared_sections?.forEach(section => {
                    // Only add to set if section and data_section_id exist
                    if (section && section.data_section_id) {
                        existingSectionIds.add(section.data_section_id);
                    }
                });
            });

            // Filter out any null/invalid sections from template groups
            templateGroups.forEach(group => {
                if (group.prepared_sections) {
                    group.prepared_sections = group.prepared_sections.filter(section => {
                        if (!section || !section.data_section_id) {
                            console.warn('Removing invalid section from template:', section);
                            return false;
                        }

                        // Check if the section still exists in the database
                        const sectionExists = fetchedSections.some(dbSection =>
                            dbSection.data_section_id === section.data_section_id
                        );

                        if (!sectionExists) {
                            console.warn('Removing deleted section from template:', section.data_section_id);
                            return false;
                        }

                        return true;
                    });
                }
            });

            const missingSections = sortedSections.filter(section =>
                !existingSectionIds.has(section.data_section_id)
            );

            // Add missing sections to hidden group
            missingSections.forEach(section => {
                hiddenGroup.prepared_sections.push({
                    data_section_id: section.data_section_id,
                    data_type: section.data_type,
                    attributes_type: section.attributes_type,
                    title: section.title,
                    sort: {
                        numerically: false,
                        ascending: true,
                        selected_attribute: "",
                    },
                    count_rows: false,
                    attribute_groups: [
                        {
                            id: HIDDEN_ATTRIBUTE_GROUP_ID,
                            title: HIDDEN_ATTRIBUTE_GROUP_ID,
                            attributes: [],
                        },
                        {
                            id: SHOWN_ATTRIBUTE_GROUP_ID,
                            title: SHOWN_ATTRIBUTE_GROUP_ID,
                            attributes: Object.keys(JSON.parse(section.attributes)),
                        },
                    ],
                    attribute_rename_map: {},
                    renamed_section_title: null,
                    show_row_count: false,
                    include_row_number_column: false,
                    merge_visible_attributes: false,
                });
            });

            console.log(syncTemplateSections(templateGroups, fetchedSections));

            setTemplate({
                sort_ascending: templateStructure.sort_ascending,
                created_with_role: templateStructure.created_with_role,
                show_declaration: templateStructure.show_declaration || false,
                groups: syncTemplateSections(templateGroups, fetchedSections)
            });

        } catch (error) {
            console.error('Error parsing template structure:', error);
            setTemplate({
                sort_ascending: true,
                created_with_role: currentViewRole,
                show_declaration: false,
                groups: []
            });
        }

        setLoading(false);
    };

    if (!activeTemplate) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="block text-m mb-1 mt-6 text-zinc-600">No template selected...</div>
            </div>
        );
    }

    const setGroups = (newGroupsOrUpdater) => {
        setTemplate(prevTemplate => {
            // Check if newGroupsOrUpdater is a function
            if (typeof newGroupsOrUpdater === 'function') {
                // Call the function with the previous groups
                const updatedGroups = newGroupsOrUpdater(prevTemplate.groups);
                return {
                    ...prevTemplate,
                    groups: updatedGroups
                };
            } else {
                // It's a direct value
                return {
                    ...prevTemplate,
                    groups: newGroupsOrUpdater
                };
            }
        });
    };

    const handleShowDeclarationChange = (checked) => {
        setShowDeclaration(checked);
        setTemplate(prevTemplate => ({
            ...prevTemplate,
            show_declaration: checked
        }));
    };

    return (
        <div className="">
            <div className="flex justify-between items-center pt-4">
                <button onClick={onBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 leading-tight mr-4">
                    <FaArrowLeft className="h-6 w-6 text-zinc-800" />
                </button>
                <DeleteTemplateButton />
            </div>

            <div className="mt-5 leading-tight mr-4 ml-4">
                <h2 className="text-2xl font-bold mb-4">Edit Template</h2>
                
                <div className="mb-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={showDeclaration}
                            onChange={(e) => handleShowDeclarationChange(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        Show Declaration
                    </label>
                </div>

                {loading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
                    </div>
                ) : (
                    <TemplateModifier
                        title={title}
                        setTitle={setTitle}
                        onBack={onBack}
                        templateId={activeTemplate.template_id}
                        template={template}
                        setTemplate={setTemplate}
                        createdWithRole={template.created_with_role}
                        setCreatedWithRole={(role) => setTemplate(prev => ({ ...prev, created_with_role: role }))}
                        showDeclaration={showDeclaration}
                        setShowDeclaration={setShowDeclaration}
                    />
                )}
            </div>
        </div>
    )
}

export default EditTemplatePage