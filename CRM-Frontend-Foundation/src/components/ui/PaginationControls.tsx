import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  pageNumbers: number[];
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (count: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  pageNumbers,
  onPageChange,
  onItemsPerPageChange,
  hasNextPage,
  hasPreviousPage,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Records per page selector */}
      <div className="flex items-center gap-3">
        <label htmlFor="items-per-page" className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wide">
          Records per page:
        </label>
        <select
          id="items-per-page"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      {/* Page info and navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          className="p-2 rounded-lg text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="p-2 rounded-lg text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Page info */}
      <div className="text-xs text-gray-600 dark:text-slate-400 font-medium">
        Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span> ({totalItems} total)
      </div>
    </div>
  );
}
