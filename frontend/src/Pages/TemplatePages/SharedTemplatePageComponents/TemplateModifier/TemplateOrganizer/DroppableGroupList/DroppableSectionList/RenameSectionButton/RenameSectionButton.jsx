import { useState } from "react";
import { FaEdit } from "react-icons/fa";
import RenameSectionModal from "./RenameSectionModal";

const RenameSectionButton = ({ preparedSection }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = (e) => {
        e.stopPropagation();
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <button
                onClick={handleOpenModal}
                className="p-1 hover:bg-gray-200 rounded mr-2 transition-colors"
                title={`Rename ${preparedSection.title}`}
            >
                <FaEdit className="h-3 w-3 text-gray-500" />
            </button>

            {isModalOpen && (
                <RenameSectionModal
                    isOpen={isModalOpen}
                    preparedSection={preparedSection}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default RenameSectionButton;