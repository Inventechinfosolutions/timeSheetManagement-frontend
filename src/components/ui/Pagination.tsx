import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  showTotal?: boolean;
  activeClassName?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
  showTotal = true,
  activeClassName,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalPages <= 1 && totalItems === 0) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-[#2B3674] select-none ${className}`}
    >
      {showTotal && (
        <span className="text-gray-400 font-medium">
          Showing <span className="text-[#2B3674] font-bold">{startItem}</span> to{" "}
          <span className="text-[#2B3674] font-bold">{endItem}</span> of{" "}
          <span className="text-[#2B3674] font-bold">{totalItems}</span> entries
        </span>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 text-[#2B3674] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`dots-${idx}`} className="px-2 text-gray-400">
                ...
              </span>
            );
          }
          const pageNum = p as number;
          const isActive = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-all cursor-pointer ${
                isActive
                  ? activeClassName || "bg-[#4318FF] text-white shadow-xs font-black"
                  : "bg-white text-[#2B3674] border border-gray-200 hover:bg-gray-50 font-bold"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 text-[#2B3674] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
