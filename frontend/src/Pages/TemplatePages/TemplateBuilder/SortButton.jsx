import { useState } from 'react';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { useTemplateBuilder } from './TemplateBuilderContext';

const SortButton = () => {
    const { sortAscending, setSortAscending } = useTemplateBuilder();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleSortChange = (ascending) => {
        setSortAscending(ascending)
        setIsDropdownOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 text-sm transition"
            >
                {sortAscending ? (
                    <FaSortAmountUp className="h-4 w-4" />
                ) : (
                    <FaSortAmountDown className="h-4 w-4" />
                )}
                <span>Sort: {sortAscending ? 'Ascending' : 'Descending'}</span>
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                        <button
                            onClick={() => handleSortChange(true)}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3 transition ${
                                sortAscending ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                            }`}
                        >
                            <FaSortAmountUp className="h-4 w-4" />
                            <div>
                                <div className="font-medium text-gray-900">Ascending</div>
                                <div className="text-xs text-gray-500">Oldest entries first</div>
                            </div>
                        </button>
                        <button
                            onClick={() => handleSortChange(false)}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3 transition ${
                                !sortAscending ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                            }`}
                        >
                            <FaSortAmountDown className="h-4 w-4" />
                            <div>
                                <div className="font-medium text-gray-900">Descending</div>
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
