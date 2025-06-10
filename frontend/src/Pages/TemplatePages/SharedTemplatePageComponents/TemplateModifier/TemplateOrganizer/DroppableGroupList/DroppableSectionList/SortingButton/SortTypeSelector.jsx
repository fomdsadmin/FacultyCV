const SortTypeSelector = ({ currentSort, onSortChange, sectionId }) => {
    const handleChange = (numerically) => {
        const newSort = {
            ...currentSort,
            numerically
        };
        onSortChange(newSort);
    };

    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort Type:
            </label>
            <div className="space-y-2">
                <label className="flex items-center text-sm cursor-pointer">
                    <input
                        type="radio"
                        name={`sortType-${sectionId}`}
                        checked={!currentSort.numerically}
                        onChange={() => handleChange(false)}
                        className="mr-3"
                    />
                    Alphabetical
                </label>
                <label className="flex items-center text-sm cursor-pointer">
                    <input
                        type="radio"
                        name={`sortType-${sectionId}`}
                        checked={currentSort.numerically}
                        onChange={() => handleChange(true)}
                        className="mr-3"
                    />
                    Numerical
                </label>
            </div>
        </div>
    );
};

export default SortTypeSelector;