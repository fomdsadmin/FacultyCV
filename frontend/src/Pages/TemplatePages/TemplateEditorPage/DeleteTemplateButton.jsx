import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import DeleteTemplateModal from "./DeleteTemplateModal";

const DeleteTemplateButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDeleteClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <button 
                onClick={handleDeleteClick} 
                className="text-red-600 btn btn-ghost bg-min-h-0 h-8 leading-tight"
            >
                <FaTrash className="h-6 w-6 text-red-600" />
            </button>

            {isModalOpen && (
                <DeleteTemplateModal 
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default DeleteTemplateButton;