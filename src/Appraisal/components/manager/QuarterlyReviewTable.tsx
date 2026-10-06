import React, { useState, useEffect, useMemo } from "react";
import { Star, Pencil, Eye, ShieldCheck, UserCheck } from "lucide-react";
import { ManagerQuarterlyReviewRecord } from "../../types/appraisal.types";
import { Pagination } from "../../../components/ui";
import "./QuarterlyReviewTable.css";

interface QuarterlyReviewTableProps {
  data: ManagerQuarterlyReviewRecord[];
  onEdit?: (record: ManagerQuarterlyReviewRecord) => void;
  onView?: (record: ManagerQuarterlyReviewRecord) => void;
  className?: string;
  highlightedId?: string | null;
  defaultPageSize?: number;
  showPagination?: boolean;
  headerTheme?: "indigo" | "navy" | "purple" | "teal";
}

// Harmonious colorful avatar palettes for varied visual appeal
const AVATAR_PALETTES = [
  { bg: "linear-gradient(135deg, #F7EEF2 0%, #EBCED6 100%)", text: "#6D5284", border: "#B39CCB" }, // Holst Plum
  { bg: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)", text: "#059669", border: "#A7F3D0" }, // Emerald
  { bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", text: "#2563EB", border: "#BFDBFE" }, // Blue
  { bg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)", text: "#D97706", border: "#FDE68A" }, // Amber
  { bg: "linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)", text: "#7C3AED", border: "#E9D5FF" }, // Purple
  { bg: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)", text: "#E11D48", border: "#FECDD3" }, // Rose
  { bg: "linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)", text: "#0891B2", border: "#A5F3FC" }, // Cyan
];

export const QuarterlyReviewTable: React.FC<QuarterlyReviewTableProps> = ({
  data,
  onEdit,
  onView,
  className = "",
  highlightedId = null,
  defaultPageSize = 10,
  showPagination = true,
  headerTheme = "indigo",
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = defaultPageSize;

  // Automatically reset to page 1 if data length shrinks beyond current page boundary
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(data.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(1);
    }
  }, [data.length, pageSize, currentPage]);

  // When an assignment is newly added and highlighted, navigate to the page containing that item
  useEffect(() => {
    if (highlightedId) {
      const itemIndex = data.findIndex((item) => item.id === highlightedId);
      if (itemIndex !== -1) {
        const targetPage = Math.floor(itemIndex / pageSize) + 1;
        if (targetPage !== currentPage) {
          setCurrentPage(targetPage);
        }
      }

      // Smooth scroll to the newly highlighted row
      setTimeout(() => {
        const el = document.getElementById(`qr-row-${highlightedId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 50);
    }
  }, [highlightedId, data, pageSize]);

  // Compute paginated slice of data
  const paginatedData = useMemo(() => {
    if (!showPagination) return data;
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, currentPage, pageSize, showPagination]);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarStyle = (name: string, id: string) => {
    let hash = 0;
    const str = (id || "") + (name || "");
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[idx];
  };

  const STATUS_LABELS: Record<string, string> = {
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    COMPLETED: "Completed",
  };

  const renderStatusBadge = (status: string) => {
    const raw = (status || "").trim();
    const normalized = raw.toLowerCase().replace(/_/g, " ");
    let badgeClass = "qr-status-not-started";

    if (normalized === "not started" || normalized === "pending") {
      badgeClass = "qr-status-not-started";
    } else if (
      normalized === "in progress" ||
      normalized === "under review" ||
      normalized === "awaiting review"
    ) {
      badgeClass = "qr-status-in-progress";
    } else if (normalized === "submitted") {
      badgeClass = "qr-status-submitted";
    } else if (normalized === "completed" || normalized === "reviewed") {
      badgeClass = "qr-status-completed";
    }

    const label = STATUS_LABELS[raw] || raw;

    return (
      <span className={`qr-status-badge ${badgeClass}`}>
        <span className="qr-status-dot" />
        {label}
      </span>
    );
  };

  const renderQuarterBadge = (quarter: string) => {
    const q = (quarter || "").trim().toUpperCase();
    let qClass = "qr-quarter-q1";
    if (q === "Q2") qClass = "qr-quarter-q2";
    else if (q === "Q3") qClass = "qr-quarter-q3";
    else if (q === "Q4") qClass = "qr-quarter-q4";

    return <span className={`qr-quarter-pill ${qClass}`}>{quarter}</span>;
  };

  const renderRating = (rating: string) => {
    if (!rating || rating.trim() === "-") {
      return <span className="qr-rating-empty">—</span>;
    }

    return (
      <span className="qr-rating-pill">
        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
        {rating}
      </span>
    );
  };

  const scrollToTop = () => {
    const mainElements = document.querySelectorAll("main");
    mainElements.forEach((m) => {
      m.scrollTop = 0;
      if (typeof m.scrollTo === "function") {
        m.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    });

    const overflowElements = document.querySelectorAll("[class*='overflow-y-auto']");
    overflowElements.forEach((el) => {
      if (el.scrollHeight > 600) {
        el.scrollTop = 0;
        if (typeof el.scrollTo === "function") {
          el.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      }
    });

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const renderAction = (record: ManagerQuarterlyReviewRecord) => {
    return (
      <div className="qr-actions-container">
        <button
          type="button"
          onClick={() => {
            scrollToTop();
            onView?.(record);
          }}
          className="qr-action-icon-btn qr-action-btn-view"
          title={`View appraisal for ${record.name}`}
          aria-label={`View appraisal for ${record.name}`}
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            scrollToTop();
            onEdit?.(record);
          }}
          className="qr-action-icon-btn qr-action-btn-edit"
          title={`Edit evaluation for ${record.name}`}
          aria-label={`Edit evaluation for ${record.name}`}
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const totalItems = data.length;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`quarterly-review-table-card ${className}`}>
      {/* Table Scrollable Container */}
      <div className="quarterly-review-table-scroll">
        <table className={`quarterly-review-table qr-header-${headerTheme}`}>
          <thead>
            <tr>
              <th className="text-left min-w-[190px]">Name</th>
              <th className="text-left min-w-[95px]">ID</th>
              <th className="text-left min-w-[160px]">Role</th>
              <th className="text-center min-w-[90px]">Quarter</th>
              <th className="text-center min-w-[125px]">Financial Year</th>
              <th className="text-center min-w-[105px]">From Date</th>
              <th className="text-center min-w-[105px]">To Date</th>
              <th className="text-center min-w-[105px]">Assign On</th>
              <th className="text-center min-w-[110px]">Assign By</th>
              <th className="text-center min-w-[105px]">Final Rating</th>
              <th className="text-center min-w-[130px]">Status</th>
              <th className="text-center min-w-[105px] qr-sticky-action-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((record, index) => {
              const isHighlighted = highlightedId === record.id;
              const avatarStyle = getAvatarStyle(record.name, record.id);

              return (
                <tr
                  key={`${record.id}-${record.quarter}-${index}`}
                  id={`qr-row-${record.id}`}
                  className={isHighlighted ? "quarterly-review-row-highlighted" : ""}
                >
                  {/* 1. Name with Colored Avatar Initials */}
                  <td>
                    <div className="qr-employee-cell">
                      <div
                        className="qr-avatar-badge"
                        style={{
                          background: avatarStyle.bg,
                          color: avatarStyle.text,
                          borderColor: avatarStyle.border,
                        }}
                      >
                        {getInitials(record.name)}
                      </div>
                      <div>
                        <div className="qr-employee-name">{record.name}</div>
                      </div>
                    </div>
                  </td>

                  {/* 2. ID */}
                  <td>
                    <span className="qr-id-chip">{record.id}</span>
                  </td>

                  {/* 3. Role */}
                  <td>
                    <span className="qr-role-text">{record.role}</span>
                  </td>

                  {/* 4. Quarter with Dedicated Color */}
                  <td className="text-center">{renderQuarterBadge(record.quarter)}</td>

                  {/* 5. Financial Year */}
                  <td className="text-center">
                    <span className="qr-fy-pill">{record.financialYear}</span>
                  </td>

                  {/* 6. From Date */}
                  <td className="text-center">
                    <span className="qr-date-chip">{record.fromDate}</span>
                  </td>

                  {/* 7. To Date */}
                  <td className="text-center">
                    <span className="qr-date-chip">{record.toDate}</span>
                  </td>

                  {/* 8. Assign On */}
                  <td className="text-center">
                    <span className="qr-date-chip">{record.assignedOn}</span>
                  </td>

                  {/* 9. Assign By */}
                  <td className="text-center">
                    <span
                      className={`qr-assigned-by-pill ${record.assignedBy.toLowerCase() === "admin"
                          ? "qr-assigned-by-admin"
                          : ""
                        }`}
                    >
                      {record.assignedBy.toLowerCase() === "admin" ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      {record.assignedBy}
                    </span>
                  </td>

                  {/* 10. Final Rating */}
                  <td className="text-center">{renderRating(record.finalRating)}</td>

                  {/* 11. Status */}
                  <td className="text-center">{renderStatusBadge(record.status)}</td>

                  {/* 12. Sticky Action */}
                  <td className="text-center qr-sticky-action-td">
                    {renderAction(record)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer - Right Aligned */}
      {showPagination && data.length > 0 && (
        <div className="quarterly-review-pagination-bar">
          <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4 select-none w-full">
            <span className="text-xs text-gray-500 font-medium">
              Showing <span className="text-[#0F172A] font-bold">{startItem}</span> to{" "}
              <span className="text-[#0F172A] font-bold">{endItem}</span> of{" "}
              <span className="text-[#0F172A] font-bold">{totalItems}</span> entries
            </span>

            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              showTotal={false}
              activeClassName="!bg-[#6D5284] !text-white shadow-xs font-black shadow-[#6D5284]/25"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuarterlyReviewTable;
