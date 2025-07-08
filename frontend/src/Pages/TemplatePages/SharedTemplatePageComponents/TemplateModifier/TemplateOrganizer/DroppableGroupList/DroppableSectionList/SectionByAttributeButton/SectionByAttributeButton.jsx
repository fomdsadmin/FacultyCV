import { useState } from "react";
import { FaCog } from "react-icons/fa";
import SectionByAttributeModal from "./Modal/SectionByAttributeModal";

const SectionByAttributeButton = ({ preparedSection }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = (e) => {
        e.stopPropagation();
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const getButtonText = () => {
        if (!preparedSection.section_by_attribute) {
            return "Section by type";
        }
        return (
            <span>
                Section by → <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">{preparedSection.section_by_attribute}</span>
            </span>
        );
    };

    return (
        <>
            <button
                onClick={handleOpenModal}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border cursor-pointer whitespace-nowrap transition-colors"
                title="Configure section splitting by attribute"
            >
                {getButtonText()}
                <FaCog className="h-3 w-3 text-gray-500 flex-shrink-0" />
            </button>

            {isModalOpen && (
                <SectionByAttributeModal
                    isOpen={isModalOpen}
                    preparedSection={preparedSection}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default SectionByAttributeButton;