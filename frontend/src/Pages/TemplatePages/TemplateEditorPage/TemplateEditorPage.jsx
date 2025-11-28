import { FaArrowLeft } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useTemplatePageContext } from "../TemplatesPage/TemplatePageContext";
import { useApp } from "Contexts/AppContext";
import TemplateBuilder from "../TemplateBuilder/TemplateBuilder";
import DeleteTemplateButton from "./DeleteTemplateButton";
import { getInitialEmptyTemplate } from "../TemplateCreatorPage/TemplateCreatorPage";

const TemplateEditorPage = ({ onBack }) => {
    const { currentViewRole } = useApp();
    const { activeTemplate } = useTemplatePageContext();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeTemplate) {
            initializeTemplate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTemplate]);

    const initializeTemplate = async () => {
        if (!activeTemplate) return;

        setLoading(true);

        try {
            const templateStructure = JSON.parse(activeTemplate.template_structure);

            // Initialize template with TemplateBuilder format
            setTemplate(templateStructure);

        } catch (error) {
            console.error("Error parsing template structure:", error);
            setTemplate(getInitialEmptyTemplate(currentViewRole));
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
                        onBack={onBack}
                        templateId={activeTemplate.template_id}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default TemplateEditorPage;