"use client"

import { useState } from "react"
import { addTemplate, updateTemplate } from "../../../graphql/graphqlHelpers"
import { toast } from "react-toastify"
import { useTemplateBuilder } from "./TemplateBuilderContext"
import { useAuditLogger } from '../../../Contexts/AuditLoggerContext';
import { AUDIT_ACTIONS } from '../../../Contexts/AuditLoggerContext';

const SaveTemplateButton = ({ 
  templateId = null,
  items = [],
  onSaveComplete = null,
  onBack = null
}) => {
    const {
        title,
        sortAscending,
        createdWithRole,
        showDeclaration,
    } = useTemplateBuilder();

    const { logAction } = useAuditLogger();
    const [isSaving, setIsSaving] = useState(false)

    const saveTemplate = async () => {
        if (!title.trim()) {
            toast.warning("Template title cannot be blank.", { autoClose: 3000 })
            return
        }

        // Build template structure with TemplateBuilder items
        const templateStructure = JSON.stringify({
            sort_ascending: sortAscending,
            created_with_role: createdWithRole,
            show_declaration: showDeclaration,
            templateBuilder: {
                items: items
            }
        })

        setIsSaving(true)
        try {
            if (!templateId) {
                await addTemplate(title, templateStructure, null, null)
                await logAction(AUDIT_ACTIONS.ADD_NEW_TEMPLATE);
            } else {
                await updateTemplate(templateId, title, templateStructure, null, null);
                await logAction(AUDIT_ACTIONS.EDIT_CV_TEMPLATE);
            }
            toast.success("Template saved successfully!", { autoClose: 3000 })
            if (onSaveComplete) {
                onSaveComplete();
            }
            if (onBack) {
                onBack()
            }
        } catch (error) {
            console.error("Error saving template:", error)
            toast.error("Failed to save template. Please try again.", { autoClose: 3000 })
        }
        setIsSaving(false)
    }

    const handleClick = async () => {
        await saveTemplate();
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
        >
            {isSaving ? "Saving..." : "Save Template"}
        </button>
    )
}

export default SaveTemplateButton
