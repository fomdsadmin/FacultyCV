import { FaArrowLeft } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useTemplatePageContext } from "../TemplatesPage/TemplatePageContext";
import { useApp } from "Contexts/AppContext";
import TemplateBuilder from "../TemplateBuilder/TemplateBuilder";
import DeleteTemplateButton from "../EditTemplatePage/DeleteTemplateButton/DeleteTemplateButton";

const TemplateEditorPage = ({ onBack }) => {
    const { currentViewRole } = useApp();
    const { activeTemplate } = useTemplatePageContext();
    const [title, setTitle] = useState("");
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeclaration, setShowDeclaration] = useState(false);
    const [showFomLogo, setShowFomLogo] = useState(false);
    const [showVisualNesting, setShowVisualNesting] = useState(false);
    const [sortAscending, setSortAscending] = useState(true);
    const [createdWithRole, setCreatedWithRole] = useState(null);

    useEffect(() => {
        if (activeTemplate) {
            console.log(JSON.parse(activeTemplate.template_structure));
            initializeTemplate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTemplate]);

    const initializeTemplate = async () => {
        if (!activeTemplate) return;

        setLoading(true);

        try {
            const templateStructure = JSON.parse(activeTemplate.template_structure);

            setTitle(activeTemplate.title);
            setShowDeclaration(templateStructure.show_declaration || false);
            setShowVisualNesting(templateStructure.show_visual_nesting || false);
            setShowFomLogo(templateStructure.show_fom_logo || false);
            setSortAscending(templateStructure.sort_ascending !== undefined ? templateStructure.sort_ascending : true);
            setCreatedWithRole(templateStructure.created_with_role || currentViewRole);

            // Initialize template with TemplateBuilder format
            setTemplate({
                sort_ascending: templateStructure.sort_ascending !== undefined ? templateStructure.sort_ascending : true,
                created_with_role: templateStructure.created_with_role || currentViewRole,
                show_declaration: templateStructure.show_declaration || false,
                show_fom_logo: templateStructure.show_fom_logo || false,
                show_visual_nesting: templateStructure.show_visual_nesting || false,
                templateBuilder: templateStructure.templateBuilder || { items: [] }
            });

        } catch (error) {
            console.error("Error parsing template structure:", error);
            setTemplate({
                sort_ascending: true,
                created_with_role: currentViewRole,
                show_declaration: false,
                show_fom_logo: false,
                show_visual_nesting: false,
                templateBuilder: { items: [] }
            });
            setSortAscending(true);
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
                ) : template ? (
                    <TemplateBuilder
                        template={template}
                        setTemplate={setTemplate}
                        title={title}
                        setTitle={setTitle}
                        onBack={onBack}
                        templateId={activeTemplate.template_id}
                        createdWithRole={createdWithRole}
                        setCreatedWithRole={setCreatedWithRole}
                        showDeclaration={showDeclaration}
                        setShowDeclaration={setShowDeclaration}
                        showFomLogo={showFomLogo}
                        setShowFomLogo={setShowFomLogo}
                        showVisualNesting={showVisualNesting}
                        setShowVisualNesting={setShowVisualNesting}
                        sortAscending={sortAscending}
                        setSortAscending={setSortAscending}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default TemplateEditorPage;