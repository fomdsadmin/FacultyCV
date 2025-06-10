const SortOrderSelector = ({ currentSort, onSortChange, sectionId }) => {
    const handleChange = (ascending) => {
        const newSort = {
            ...currentSort,
            ascending
        };
        onSortChange(newSort);
    };

    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Order:
            </label>
            <div className="space-y-2">
                <label className="flex items-center text-sm cursor-pointer">
                    <input
                        type="radio"
                        name={`sortOrder-${sectionId}`}
                        checked={currentSort.ascending}
                        onChange={() => handleChange(true)}
                        className="mr-3"
                    />
                    Ascending
                </label>
                <label className="flex items-center text-sm cursor-pointer">
                    <input
                        type="radio"
                        name={`sortOrder-${sectionId}`}
                        checked={!currentSort.ascending}
                        onChange={() => handleChange(false)}
                        className="mr-3"
                    />
                    Descending
                </label>
            </div>
        </div>
    );
};

export default SortOrderSelector;