import ModalStylingWrapper from "SharedComponents/ModalStylingWrapper";
import AttributeSelector from "./AttributeSelector";
import SortTypeSelector from "./SortTypeSelector";
import SortOrderSelector from "./SortOrderSelector";

const SortingModal = ({ 
    isOpen,
    availableAttributes, 
    selectedAttribute, 
    onAttributeChange, 
    currentSort, 
    onSortChange, 
    sectionId,
    sectionTitle,
    onClose 
}) => {
    if (!isOpen) return null;

    return (
        <ModalStylingWrapper useDefaultBox={true}>
            <h3 className="text-lg font-semibold mb-4">
                Sort Settings for "{sectionTitle}"
            </h3>
            
            <div className="space-y-4">
                <AttributeSelector
                    availableAttributes={availableAttributes}
                    selectedAttribute={selectedAttribute}
                    onAttributeChange={onAttributeChange}
                />
                
                <SortTypeSelector
                    currentSort={currentSort}
                    onSortChange={onSortChange}
                    sectionId={sectionId}
                />
                
                <SortOrderSelector
                    currentSort={currentSort}
                    onSortChange={onSortChange}
                    sectionId={sectionId}
                />
            </div>

            <div className="flex justify-end mt-6 gap-2">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="btn btn-primary px-4 py-2 text-sm"
                >
                    Done
                </button>
            </div>
        </ModalStylingWrapper>
    );
};

export default SortingModal;