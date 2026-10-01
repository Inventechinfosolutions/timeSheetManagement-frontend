import React, { useEffect } from "react";
import { Star, Pencil, Eye, ShieldCheck, UserCheck } from "lucide-react";
import { ManagerQuarterlyReviewRecord } from "../../types/appraisal.types";
import "./QuarterlyReviewTable.css";

interface QuarterlyReviewTableProps {
  data: ManagerQuarterlyReviewRecord[];
  onEdit?: (record: ManagerQuarterlyReviewRecord) => void;
  onView?: (record: ManagerQuarterlyReviewRecord) => void;
  className?: string;
  highlightedId?: string | null;
}

export const QuarterlyReviewTable: React.FC<QuarterlyReviewTableProps> = ({
  data,
  onEdit,
  onView,
  className = "",
  highlightedId = null,
}) => {
  useEffect(() => {
    if (highlightedId) {
      const el = document.getElementById(`qr-row-${highlightedId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [highlightedId]);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
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
    } else if (normalized === "in progress" || normalized === "under review" || normalized === "awaiting review") {
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

  const renderAction = (record: ManagerQuarterlyReviewRecord) => {
    const normalized = (record.status || "").toLowerCase().replace(/_/g, " ").trim();
    const isView =
      normalized === "submitted" ||
      normalized === "completed" ||
      normalized === "reviewed";

    if (isView) {
      return (
        <button
          type="button"
          onClick={() => onView?.(record)}
          className="qr-action-btn-view"
          title={`View review for ${record.name}`}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onEdit?.(record)}
        className="qr-action-btn-edit"
        title={`Edit review for ${record.name}`}
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </button>
    );
  };

  return (
    <div className={`quarterly-review-table-card ${className}`}>
      <div className="quarterly-review-table-scroll">
        <table className="quarterly-review-table">
          <thead>
            <tr>
              <th className="text-left min-w-[180px]">Name</th>
              <th className="text-left min-w-[95px]">ID</th>
              <th className="text-left min-w-[160px]">Role</th>
              <th className="text-center min-w-[85px]">Quarter</th>
              <th className="text-center min-w-[125px]">Financial Year</th>
              <th className="text-center min-w-[105px]">From Date</th>
              <th className="text-center min-w-[105px]">To Date</th>
              <th className="text-center min-w-[105px]">Assign On</th>
              <th className="text-center min-w-[110px]">Assign By</th>
              <th className="text-center min-w-[105px]">Final Rating</th>
              <th className="text-center min-w-[130px]">Status</th>
              <th className="text-center min-w-[95px] qr-sticky-action-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((record) => {
              const isHighlighted = highlightedId === record.id;
              return (
                <tr
                  key={`${record.id}-${record.quarter}`}
                  id={`qr-row-${record.id}`}
                  className={isHighlighted ? "quarterly-review-row-highlighted" : ""}
                >
                  {/* 1. Name */}
                <td>
                  <div className="qr-employee-cell">
                    <div className="qr-avatar-badge">{getInitials(record.name)}</div>
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
                  <span className="text-xs text-[#2B3674] font-medium">{record.role}</span>
                </td>

                {/* 4. Quarter */}
                <td className="text-center">
                  <span className="qr-quarter-pill">{record.quarter}</span>
                </td>

                {/* 5. Financial Year */}
                <td className="text-center">
                  <span className="text-xs text-gray-600 font-medium">
                    {record.financialYear}
                  </span>
                </td>

                {/* 6. From Date */}
                <td className="text-center">
                  <span className="text-xs font-mono text-gray-600 font-medium">
                    {record.fromDate}
                  </span>
                </td>

                {/* 7. To Date */}
                <td className="text-center">
                  <span className="text-xs font-mono text-gray-600 font-medium">
                    {record.toDate}
                  </span>
                </td>

                {/* 8. Assign On */}
                <td className="text-center">
                  <span className="text-xs font-mono text-gray-600 font-medium">
                    {record.assignedOn}
                  </span>
                </td>

                {/* 9. Assign By */}
                <td className="text-center">
                  <span
                    className={`qr-assigned-by-pill ${
                      record.assignedBy.toLowerCase() === "admin"
                        ? "qr-assigned-by-admin"
                        : ""
                    }`}
                  >
                    {record.assignedBy.toLowerCase() === "admin" ? (
                      <ShieldCheck className="w-3 h-3" />
                    ) : (
                      <UserCheck className="w-3 h-3" />
                    )}
                    {record.assignedBy}
                  </span>
                </td>

                {/* 10. Final Rating */}
                <td className="text-center">{renderRating(record.finalRating)}</td>

                {/* 11. Status */}
                <td className="text-center">{renderStatusBadge(record.status)}</td>

                {/* 12. Action */}
                <td className="text-center qr-sticky-action-td">
                  {renderAction(record)}
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuarterlyReviewTable;
