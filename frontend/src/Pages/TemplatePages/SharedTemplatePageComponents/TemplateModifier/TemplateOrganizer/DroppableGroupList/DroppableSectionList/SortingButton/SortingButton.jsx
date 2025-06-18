import { useState, useEffect } from "react";
import { FaSort } from "react-icons/fa";
import SortingModal from "./SortingModal";
import { useTemplateModifier } from "Pages/TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";

const SortingButton = ({ preparedSection }) => {
    const { setGroups, getGroupIdContainingPreparedSectionId, HIDDEN_ATTRIBUTE_GROUP_ID } = useTemplateModifier();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState("");

    // Get available attributes (excluding hidden ones)
    const availableAttributes = preparedSection.attribute_groups
        .filter(group => group.id !== HIDDEN_ATTRIBUTE_GROUP_ID)
        .flatMap(group => group.attributes || []);

    // Initialize selectedAttribute from stored sort config or default to first available
    useEffect(() => {
        if (preparedSection.sort?.selectedAttribute && availableAttributes.includes(preparedSection.sort.selectedAttribute)) {
            setSelectedAttribute(preparedSection.sort.selectedAttribute);
        } else if (!selectedAttribute && availableAttributes.length > 0) {
            setSelectedAttribute(availableAttributes[0]);
        }

        // Update the selectedAttribute to sort if the current attribute selected is moved to the hidden group
        if (!availableAttributes.includes(selectedAttribute)) {
            setSelectedAttribute(availableAttributes[0]);
        }
    }, [availableAttributes, selectedAttribute, preparedSection.sort?.selectedAttribute]);

    const currentSort = preparedSection.sort || {
        numerically: false,
        ascending: true,
        selectedAttribute: ""
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
                                    sort: {
                                        ...newSortConfig,
                                    }
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

    const handleAttributeChange = (newAttribute) => {
        setSelectedAttribute(newAttribute);
        // Also update the sort config with the new selected attribute
        handleSortChange({
            ...currentSort,
            selectedAttribute: newAttribute
        });
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
                    onAttributeChange={handleAttributeChange}
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