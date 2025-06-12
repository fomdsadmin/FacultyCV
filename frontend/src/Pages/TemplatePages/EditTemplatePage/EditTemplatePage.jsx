import { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { getAllSections } from "../../../graphql/graphqlHelpers";
import { toast } from "react-toastify";
import TemplateModifier from "../SharedTemplatePageComponents/TemplateModifier/TemplateModifier";
import DeleteTemplateButton from "./DeleteTemplateButton/DeleteTemplateButton";
import { HIDDEN_ATTRIBUTE_GROUP_ID, HIDDEN_GROUP_ID, SHOWN_ATTRIBUTE_GROUP_ID } from "../SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";
import { useTemplatePageContext } from "../TemplatesPage/TemplatePageContext";

const EditTemplatePage = ({ onBack }) => {
    const { activeTemplate } = useTemplatePageContext();
    const [title, setTitle] = useState(activeTemplate?.title || "")
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true)
    const [startYear, setStartYear] = useState(activeTemplate?.start_year || "")
    const [endYear, setEndYear] = useState(activeTemplate?.end_year || "")

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
            
            // Get all sections to potentially add missing ones to hidden group
            const fetchedSections = await getAllSections();
            const sortedSections = fetchedSections.sort((a, b) => a.title.localeCompare(b.title));

            // Check if there's already a hidden group
            let hiddenGroup = templateStructure.find(group => group.id === HIDDEN_GROUP_ID);
            
            if (!hiddenGroup) {
                // Create hidden group if it doesn't exist
                hiddenGroup = {
                    id: HIDDEN_GROUP_ID,
                    title: HIDDEN_GROUP_ID,
                    prepared_sections: []
                };
                templateStructure.push(hiddenGroup);
            }

            // Find sections that are not in any group and add them to hidden group
            const existingSectionIds = new Set();
            templateStructure.forEach(group => {
                group.prepared_sections?.forEach(section => {
                    existingSectionIds.add(section.data_section_id);
                });
            });

            const missingSections = sortedSections.filter(section => 
                !existingSectionIds.has(section.data_section_id)
            );

            // Add missing sections to hidden group
            missingSections.forEach(section => {
                hiddenGroup.prepared_sections.push({
                    data_section_id: section.data_section_id,
                    data_type: section.data_type,
                    title: section.title,
                    sort: {
                        numerically: false,
                        ascending: true,
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
                    show_row_count: false
                });
            });

            setGroups(templateStructure);
        } catch (error) {
            console.error('Error parsing template structure:', error);
            toast.error("Failed to load template data.", { autoClose: 3000 });
            setGroups([]);
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

    return (
        <div className="">
            <div className="flex justify-between items-center pt-4">
                <button onClick={onBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 leading-tight mr-4">
                    <FaArrowLeft className="h-6 w-6 text-zinc-800" />
                </button>
                <DeleteTemplateButton />
            </div>
            
            <div className="mt-5 leading-tight mr-4 ml-4">
                <h2 className="text-2xl font-bold mb-6">Edit Template</h2>
                
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
                    </div>
                ) : (
                    <TemplateModifier
                        groups={groups}
                        setGroup={setGroups}
                        title={title}
                        setTitle={setTitle}
                        endDate={endYear}
                        setEndDate={setEndYear}
                        startDate={startYear}
                        setStartDate={setStartYear}
                        onBack={onBack}
                        templateId={activeTemplate.template_id}
                    />
                )}
            </div>
        </div>
    )
}

export default EditTemplatePage