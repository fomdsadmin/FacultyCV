import { useState, useEffect } from "react";
import { useTemplate } from "Pages/NewTemplate/TemplateContext";
import { FaSort } from "react-icons/fa";
import SortingModal from "./SortingModal";

const SortingButton = ({ preparedSection }) => {
    const { groups, setGroups, getGroupIdContainingPreparedSectionId, HIDDEN_ATTRIBUTE_GROUP_ID } = useTemplate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState("");

    // Get available attributes (excluding hidden ones)
    const availableAttributes = preparedSection.attribute_groups
        .filter(group => group.id !== HIDDEN_ATTRIBUTE_GROUP_ID)
        .flatMap(group => group.attributes || []);


    // Initialize selectedAttribute if not set
    useEffect(() => {
        if (!selectedAttribute && availableAttributes.length > 0) {
            setSelectedAttribute(availableAttributes[0]);
        }

        // Update the selectedAttribute to sort if the current attribute selected is moved to the hidden group
        if (!availableAttributes.includes(selectedAttribute)) {
            setSelectedAttribute(availableAttributes[0]);
        }
    }, [availableAttributes, selectedAttribute]);

    const currentSort = preparedSection.sort || {
        numerically: false,
        ascending: true
    };

    const handleSortChange = (newSortConfig) => {
        const groupId = getGroupIdContainingPreparedSectionId(preparedSection.data_section_id);

        setGroups(prevGroups =>
            prevGroups.map(group => {
                if (group.id === groupId) {
                    return {
                        ...group,
                        prepared_sections: group.prepared_sections.map(section => {
                            if (section.data_section_id === preparedSection.data_section_id) {
                                return {
                                    ...section,
                                    sort: newSortConfig
                                };
                            }
                            return section;
                        })
                    };
                }
                return group;
            })
        );
    };

    const getSortDisplayText = () => {
        if (!selectedAttribute) return "Sort by an attribute";

        const type = currentSort.numerically ? "numerically" : "alphabetically";
        const order = currentSort.ascending ? "ascending" : "descending";

        return `Sorted ${type} in ${order} order by "${selectedAttribute}"`;
    };

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
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
            >
                <FaSort className="h-3 w-3" />
                <span>{getSortDisplayText()}</span>
            </button>

            {isModalOpen && (
                <SortingModal
                    isOpen={isModalOpen}
                    availableAttributes={availableAttributes}
                    selectedAttribute={selectedAttribute}
                    onAttributeChange={setSelectedAttribute}
                    currentSort={currentSort}
                    onSortChange={handleSortChange}
                    sectionId={preparedSection.data_section_id}
                    sectionTitle={preparedSection.title}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default SortingButton;