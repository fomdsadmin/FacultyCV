import { useState } from 'react';
import { FaSort, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { useTemplateModifier } from './TemplateModifierContext';

const SortButton = () => {
    const { sortAscending,  setSortAscending } = useTemplateModifier();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleSortChange = (sortAscending) => {
        setSortAscending(sortAscending)
        setIsDropdownOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="btn btn-outline btn-sm flex items-center gap-2"
            >
                {sortAscending ? (
                    <FaSortAmountUp className="h-4 w-4" />
                ) : (
                    <FaSortAmountDown className="h-4 w-4" />
                )}
                <span>Sort: {sortAscending ? 'Ascending' : 'Descending'}</span>
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <div className="py-1">
                        <button
                            onClick={() => handleSortChange(true)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                                sortAscending ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                        >
                            <FaSortAmountUp className="h-4 w-4" />
                            <div>
                                <div className="font-medium">Ascending</div>
                                <div className="text-xs text-gray-500">Oldest entries first</div>
                            </div>
                        </button>
                        <button
                            onClick={() => handleSortChange(false)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                                !sortAscending ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                        >
                            <FaSortAmountDown className="h-4 w-4" />
                            <div>
                                <div className="font-medium">Descending</div>
                                <div className="text-xs text-gray-500">Newest entries first</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Backdrop to close dropdown */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}
        </div>
    );
};

export default SortButton;