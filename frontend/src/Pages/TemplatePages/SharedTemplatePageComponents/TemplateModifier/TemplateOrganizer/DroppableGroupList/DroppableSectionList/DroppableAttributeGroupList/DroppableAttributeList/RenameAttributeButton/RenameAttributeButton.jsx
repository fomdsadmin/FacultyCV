import { useState } from "react";
import { FaEdit } from "react-icons/fa";
import RenameAttributeModal from "./RenameAttributeModal";

const RenameAttributeButton = ({ attribute, dataSectionId }) => {
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
                title={`Rename ${attribute}`}
            >
                <FaEdit className="h-3 w-3 text-gray-500" />
            </button>

            {isModalOpen && (
                <RenameAttributeModal
                    isOpen={isModalOpen}
                    attribute={attribute}
                    dataSectionId={dataSectionId}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default RenameAttributeButton;