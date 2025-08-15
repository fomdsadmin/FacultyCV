import { useState } from "react";
import { deleteTemplate } from "../../../../graphql/graphqlHelpers";
import { toast } from "react-toastify";
import { useTemplatePageContext } from "Pages/TemplatePages/TemplatesPage/TemplatePageContext";

import { useAuditLogger } from '../../../../Contexts/AuditLoggerContext';
import { AUDIT_ACTIONS } from '../../../../Contexts/AuditLoggerContext';

const DeleteTemplateModal = ({ onClose }) => {
    const { activeTemplate, fetchTemplates, handleBack } = useTemplatePageContext();
    const [isDeleting, setIsDeleting] = useState(false);
    const { logAction } = useAuditLogger();

    const handleDelete = async () => {
        if (!activeTemplate) return;
        
        setIsDeleting(true);
        try {
            await deleteTemplate(activeTemplate.template_id);
            toast.success("Template deleted successfully!", { autoClose: 3000 });
            await fetchTemplates(); // Refresh the templates list
            handleBack(); // Go back to templates list
            onClose(); // Close the modal
            // Log the template deletion action
                await logAction(AUDIT_ACTIONS.DELETE_CV_TEMPLATE);
        } catch (error) {
            console.error("Error deleting template:", error);
            toast.error("Failed to delete template. Please try again.", { autoClose: 3000 });
        }
        setIsDeleting(false);

    };

    const handleCancel = () => {
        onClose();
    };

    if (!activeTemplate) {
        return null; // Don't render if no active template
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Delete Template
                </h3>
                
                <p className="text-gray-700 mb-6">
                    Are you sure you want to delete the template "{activeTemplate.title}"? This action cannot be undone.
                </p>
                
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={handleCancel}
                        className="btn btn-outline"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        className="btn btn-error text-white"
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteTemplateModal;