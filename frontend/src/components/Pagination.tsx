import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showEntrySelector?: boolean;
    entriesPerPage?: number;
    onEntriesChange?: (entries: number) => void;
    totalEntries?: number;
}

const entriesOptions = [5, 10, 20, 50];

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    showEntrySelector = false,
    entriesPerPage = 10,
    onEntriesChange,
    totalEntries,
}) => {
    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showPages = 5;

        if (totalPages <= showPages) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Show pages around current
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    if (totalPages <= 1) {
        return null;
    }

    const startEntry = (currentPage - 1) * entriesPerPage + 1;
    const endEntry = Math.min(currentPage * entriesPerPage, totalEntries || 0);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            {/* Entry selector and info */}
            <div className="flex items-center gap-4">
                {showEntrySelector && onEntriesChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Show</span>
                        <select
                            value={entriesPerPage}
                            onChange={(e) => onEntriesChange(Number(e.target.value))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {entriesOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <span className="text-sm text-gray-600">entries</span>
                    </div>
                )}

                {totalEntries !== undefined && (
                    <span className="text-sm text-gray-600">
                        Showing {startEntry} to {endEntry} of {totalEntries} entries
                    </span>
                )}
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-1">
                {/* First page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="First page"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous page */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous page"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        typeof page === 'number' ? (
                            <button
                                key={index}
                                onClick={() => onPageChange(page)}
                                className={`min-w-[32px] h-8 px-2 rounded text-sm font-medium transition-colors ${
                                    currentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-gray-100 text-gray-700'
                                }`}
                            >
                                {page}
                            </button>
                        ) : (
                            <span key={index} className="px-2 text-gray-400">
                                {page}
                            </span>
                        )
                    ))}
                </div>

                {/* Next page */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next page"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Last page"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
