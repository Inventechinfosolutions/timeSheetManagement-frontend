import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Star, Pencil, Eye, ShieldCheck, UserCheck, Check, X, CheckCircle, XCircle, Calendar, Clock, AlertCircle, Lock, RotateCcw } from "lucide-react";
import { ManagerQuarterlyReviewRecord } from "../../types/appraisal.types";
import { DatePicker, Pagination } from "../../../components/ui";
import { useAppSelector } from "../../../hooks";
import { AppraisalApi, readApiError } from "../../reducers/appraisal.reducer";
import { message } from "antd";
import "./QuarterlyReviewTable.css";

interface QuarterlyReviewTableProps {
  data: ManagerQuarterlyReviewRecord[];
  onEdit?: (record: ManagerQuarterlyReviewRecord) => void;
  onView?: (record: ManagerQuarterlyReviewRecord) => void;
  onOpenAccessGrant?: (record: ManagerQuarterlyReviewRecord) => void;
  onRefresh?: () => void;
  className?: string;
  highlightedId?: string | null;
  defaultPageSize?: number;
  showPagination?: boolean;
  page?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  headerTheme?: "indigo" | "navy" | "purple" | "teal";
  viewOnly?: boolean;
}

const extractReassignReasons = (description?: string | null): string[] => {
  if (!description?.trim()) {
    return [];
  }
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\[Re-assigned on /i.test(line))
    .map((line) => line.replace(/^\[Re-assigned on [^\]]+\]:\s*/i, "").trim())
    .filter(Boolean);
};

// Harmonious colorful avatar palettes matching the frosted ice-blue & royal blue aesthetic
const AVATAR_PALETTES = [
  { bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", text: "#1D4ED8", border: "#BFDBFE" }, // Royal Blue
  { bg: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)", text: "#0284C7", border: "#BAE6FD" }, // Sky Blue
  { bg: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)", text: "#4338CA", border: "#C7D2FE" }, // Indigo Blue
  { bg: "linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)", text: "#0891B2", border: "#A5F3FC" }, // Electric Cyan
  { bg: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)", text: "#334155", border: "#CBD5E1" }, // Ice Slate
  { bg: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)", text: "#059669", border: "#A7F3D0" }, // Mint Teal
];

export const QuarterlyReviewTable: React.FC<QuarterlyReviewTableProps> = ({
  data,
  onEdit,
  onView,
  onOpenAccessGrant,
  onRefresh,
  className = "",
  highlightedId = null,
  defaultPageSize = 10,
  showPagination = true,
  headerTheme = "indigo",
  viewOnly = false,
  page,
  totalCount,
  onPageChange,
}) => {
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const managerId = currentUser?.employeeId || currentUser?.loginId || "";

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionRecord, setDecisionRecord] = useState<ManagerQuarterlyReviewRecord | null>(null);
  const [decisionRemarks, setDecisionRemarks] = useState<string>("");
  const [decisionSubmitting, setDecisionSubmitting] = useState<boolean>(false);

  // Unlock / Re-assign State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignRecord, setReassignRecord] = useState<ManagerQuarterlyReviewRecord | null>(null);
  const [reassignDeadline, setReassignDeadline] = useState<string>("");
  const [reassignTodayDate, setReassignTodayDate] = useState<string>("");
  const [reassignReason, setReassignReason] = useState<string>("");
  const [reassignSubmitting, setReassignSubmitting] = useState<boolean>(false);
  const [reassignError, setReassignError] = useState<string>("");
  const [accessPreviewRecord, setAccessPreviewRecord] = useState<ManagerQuarterlyReviewRecord | null>(null);

  // Blur surrounding background and lock scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = decisionModalOpen || !!accessPreviewRecord || reassignModalOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open-active");
    } else {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open-active");
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open-active");
    };
  }, [decisionModalOpen, accessPreviewRecord, reassignModalOpen]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = defaultPageSize;
  const isServerPage = typeof onPageChange === "function";
  const activePage = isServerPage ? page ?? 1 : currentPage;

  // Automatically reset to page 1 if data length shrinks beyond current page boundary
  useEffect(() => {
    if (isServerPage) return;
    const maxPage = Math.max(1, Math.ceil(data.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(1);
    }
  }, [data.length, pageSize, currentPage, isServerPage]);

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
    if (!showPagination || isServerPage) return data;
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, currentPage, pageSize, showPagination, isServerPage]);

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

  const renderStatusBadge = (status: string) => {
    const raw = (status || "").trim();
    if (raw.toUpperCase() === "NOT_UPDATED" || raw.toUpperCase() === "LOCKED") {
      return (
        <span className="qr-status-badge qr-status-locked" title="Locked because the deadline was missed">
          <Lock className="w-3 h-3 text-rose-500 mr-0.5" />
          Locked
        </span>
      );
    }
    const normalized = raw.toLowerCase().replace(/_/g, " ");
    let badgeClass = "qr-status-not-started";

    if (normalized.includes("progress") || normalized === "draft" || normalized.includes("requested")) {
      badgeClass = "qr-status-in-progress";
    } else if (normalized.includes("submitted") || normalized.includes("received")) {
      badgeClass = "qr-status-submitted";
    } else if (normalized.includes("completed") || normalized === "reviewed") {
      badgeClass = "qr-status-completed";
    }

    const label = normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());

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

  const handleOpenDecision = (record: ManagerQuarterlyReviewRecord, isApprove: boolean) => {
    if (isApprove) {
      setAccessPreviewRecord(record);
      return;
    }
    setDecisionRecord(record);
    setDecisionRemarks("");
    setDecisionModalOpen(true);
  };

  const handleConfirmDecision = async () => {
    if (!decisionRecord) return;
    const performanceId = decisionRecord.performanceId;
    if (!performanceId) {
      message.error("Performance record ID not found.");
      return;
    }
    setDecisionSubmitting(true);
    try {
      await AppraisalApi.respondEdit({
        performanceId,
        managerId,
        approved: false,
        responseNote: decisionRemarks.trim() || undefined,
      });
      message.success(`Edit request rejected.`);
      setDecisionModalOpen(false);
      onRefresh?.();
    } catch (error) {
      message.error(readApiError(error));
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const toIsoDate = (value: string): string | undefined => {
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
    if (!match) {
      return undefined;
    }
    return `${match[3]}-${match[2]}-${match[1]}`;
  };

  const todayIsoDate = (): string => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
  };

  const handleOpenReassign = (record: ManagerQuarterlyReviewRecord) => {
    setReassignRecord(record);
    setReassignTodayDate(todayIsoDate());
    setReassignDeadline("");
    setReassignReason("");
    setReassignError("");
    setReassignModalOpen(true);
  };

  const handleReassignDeadlineChange = (val: string) => {
    setReassignDeadline(val);
    if (!val) {
      setReassignError("");
      return;
    }
    const iso = toIsoDate(val);
    const todayStr = todayIsoDate();
    if (iso && iso <= todayStr) {
      setReassignError("The new deadline must be tomorrow or later.");
    } else {
      setReassignError("");
    }
  };

  const handleConfirmReassign = async () => {
    if (!reassignRecord) return;
    const deadlineIso = toIsoDate(reassignDeadline);
    if (!deadlineIso) {
      setReassignError("Please pick a new deadline date.");
      return;
    }
    const todayStr = todayIsoDate();
    if (deadlineIso <= todayStr) {
      setReassignError("The new deadline must be tomorrow or later.");
      return;
    }

    if (!reassignRecord.reviewId) {
      setReassignError("Review id is missing. Refresh the page and try again.");
      return;
    }

    setReassignError("");
    setReassignSubmitting(true);
    try {
      await AppraisalApi.reassignReview({
        reviewId: reassignRecord.reviewId,
        deadlineDate: deadlineIso,
        reassignedDate: reassignTodayDate || todayStr,
        reason: reassignReason.trim() || undefined,
      });
      message.success(`Appraisal re-assigned and access granted to ${reassignRecord.name}!`);
      setReassignModalOpen(false);
      onRefresh?.();
    } catch (error) {
      setReassignError(readApiError(error));
    } finally {
      setReassignSubmitting(false);
    }
  };

  const renderAction = (record: ManagerQuarterlyReviewRecord) => {
    if (viewOnly) {
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
            <Eye size={18} />
          </button>
        </div>
      );
    }
    const isLocked =
      record.status.toUpperCase() === "NOT_UPDATED" ||
      record.status.toUpperCase() === "LOCKED" ||
      record.performanceStatus?.toUpperCase() === "NOT_UPDATED" ||
      record.performanceStatus?.toUpperCase() === "LOCKED";
    const renewalClosed = isLocked && (record.reassignCount || 0) >= 1;
    const requestWindowMs = 42 * 60 * 60 * 1000;
    const deadlineMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec((record.toDate || "").trim());
    const deadlineStartMs = deadlineMatch
      ? new Date(
        Number(deadlineMatch[3]),
        Number(deadlineMatch[2]) - 1,
        Number(deadlineMatch[1]),
        0,
        0,
        0,
        0,
      ).getTime()
      : 0;
    const lockedAtMs = record.lockedAt ? new Date(record.lockedAt).getTime() : 0;
    const windowStartMs = deadlineStartMs || lockedAtMs;
    const stillInEmployeeWindow =
      record.canRequestEdit === true
        ? true
        : record.canRequestEdit === false
          ? false
          : windowStartMs > 0 && Date.now() - windowStartMs <= requestWindowMs;
    // Rotate / re-assign only after the employee 42-hour request window ends.
    const showReassign = isLocked && !renewalClosed && !stillInEmployeeWindow;

    const isEditRequested =
      record.status.toUpperCase() === "REQUESTED_FOR_EDIT" ||
      record.performanceStatus?.toUpperCase() === "REQUESTED_FOR_EDIT";

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
          <Eye size={18} />
        </button>

        {showReassign ? (
          <button
            type="button"
            onClick={() => handleOpenReassign(record)}
            className="qr-action-icon-btn qr-action-btn-reassign"
            title={`Unlock & Re-assign appraisal for ${record.name}`}
            aria-label={`Unlock & Re-assign appraisal for ${record.name}`}
          >
            <RotateCcw size={18} />
          </button>
        ) : isLocked || renewalClosed ? null : isEditRequested ? (
          <>
            <button
              type="button"
              onClick={() => handleOpenDecision(record, true)}
              className="qr-action-icon-btn qr-action-btn-approve"
              title={`Approve edit request for ${record.name}`}
              aria-label={`Approve edit request for ${record.name}`}
            >
              <CheckCircle size={18} />
            </button>
            <button
              type="button"
              onClick={() => handleOpenDecision(record, false)}
              className="qr-action-icon-btn qr-action-btn-reject"
              title={`Reject edit request for ${record.name}`}
              aria-label={`Reject edit request for ${record.name}`}
            >
              <XCircle size={18} />
            </button>
          </>
        ) : (
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
            <Pencil size={18} />
          </button>
        )}
      </div>
    );
  };

  const totalItems = isServerPage ? totalCount ?? 0 : data.length;
  const startItem = totalItems === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const endItem = Math.min(activePage * pageSize, totalItems);

  return (
    <div className={`quarterly-review-table-card ${className}`}>
      {/* Table Scrollable Container */}
      <div className="quarterly-review-table-scroll">
        <table className={`quarterly-review-table qr-header-${headerTheme}`}>
          <thead>
            <tr>
              <th className="text-left min-w-[190px]">Employee Name</th>
              <th className="text-left min-w-[120px]">Employee ID</th>
              <th className="text-left min-w-[160px]">Designation</th>
              <th className="text-left min-w-[140px]">Department</th>
              <th className="text-center min-w-[90px]">Quarter</th>
              <th className="text-center min-w-[125px]">Financial Year</th>
              <th className="text-center min-w-[120px]">Assigned Date</th>
              <th className="text-center min-w-[105px]">Deadline</th>
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

                  {/* Department */}
                  <td>
                    <span className="qr-department-pill" title={record.department || "—"}>
                      {record.department || "—"}
                    </span>
                  </td>

                  {/* 4. Quarter with Dedicated Color */}
                  <td className="text-center">{renderQuarterBadge(record.quarter)}</td>

                  {/* 5. Financial Year */}
                  <td className="text-center">
                    <span className="qr-fy-pill">{record.financialYear}</span>
                  </td>

                  {/* Assigned date */}
                  <td className="text-center">
                    <span className="qr-date-chip">{record.assignedOn}</span>
                  </td>

                  {/* Deadline */}
                  <td className="text-center">
                    <span className="qr-date-chip">{record.toDate}</span>
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
              currentPage={activePage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={isServerPage ? onPageChange : setCurrentPage}
              showTotal={false}
              activeClassName="!bg-[#2563EB] !text-white shadow-xs font-black shadow-[#2563EB]/25"
            />
          </div>
        </div>
      )}

      {/* Manager Reject Modal */}
      {decisionModalOpen && decisionRecord && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 qr-modal-overlay animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="p-5 flex items-center justify-between border-b bg-rose-50/80 border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-100 text-rose-700">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject Edit Request</h3>
                  <p className="text-xs text-slate-500">
                    {decisionRecord.name} • {decisionRecord.id} •{" "}
                    {decisionRecord.quarter} {decisionRecord.financialYear}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description
                </div>
                <p className="text-sm text-slate-700 italic whitespace-pre-wrap">
                  "{decisionRecord.editRequestReason || "No description provided."}"
                </p>
              </div>

              {extractReassignReasons(decisionRecord.description).length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Re-assign Reasons
                  </div>
                  <ul className="space-y-1.5">
                    {extractReassignReasons(decisionRecord.description).map((reason, index) => (
                      <li key={`${reason}-${index}`} className="text-sm text-slate-700 italic">
                        "{reason}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Rejecting this request will keep the self-assessment locked in its current submitted state.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Manager Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  value={decisionRemarks}
                  onChange={(e) => setDecisionRemarks(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                disabled={decisionSubmitting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={decisionSubmitting}
                className="px-5 py-2 text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 shadow-rose-600/25 disabled:opacity-50"
              >
                {decisionSubmitting ? (
                  "Processing..."
                ) : (
                  <>
                    <X className="w-4 h-4" /> Confirm Rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {accessPreviewRecord && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 qr-modal-overlay">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b bg-emerald-50/80 border-emerald-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-700">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Approve Edit Request</h3>
                  <p className="text-xs text-slate-500">
                    {accessPreviewRecord.name} • {accessPreviewRecord.id} • {accessPreviewRecord.quarter}{" "}
                    {accessPreviewRecord.financialYear}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAccessPreviewRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description
                </div>
                <p className="text-sm text-slate-700 italic whitespace-pre-wrap">
                  "{accessPreviewRecord.editRequestReason || "No description provided."}"
                </p>
              </div>
              {extractReassignReasons(accessPreviewRecord.description).length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Re-assign Reasons
                  </div>
                  <ul className="space-y-1.5">
                    {extractReassignReasons(accessPreviewRecord.description).map((reason, index) => (
                      <li key={`${reason}-${index}`} className="text-sm text-slate-700 italic">
                        "{reason}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAccessPreviewRecord(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const record = accessPreviewRecord;
                  setAccessPreviewRecord(null);
                  onOpenAccessGrant?.(record);
                }}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                Next
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Unlock / Re-assign Appraisal Modal */}
      {reassignModalOpen && reassignRecord && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 qr-modal-overlay animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    Unlock & Re-assign Appraisal
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    Grant fresh access with a new submission deadline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Employee Summary Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Employee</span>
                  <span className="font-bold text-slate-800">
                    {reassignRecord.name}{" "}
                    <span className="text-slate-400 font-normal">
                      ({reassignRecord.id})
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Review Period</span>
                  <span className="font-semibold text-slate-700">
                    {reassignRecord.quarter} • FY {reassignRecord.financialYear}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Missed Deadline</span>
                  <span className="font-semibold text-rose-600">
                    {reassignRecord.deadline || reassignRecord.toDate || "Expired"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Re-assigned On</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {reassignTodayDate} (Today)
                  </span>
                </div>
              </div>

              {/* New Deadline Date input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  New Submission Deadline <span className="text-rose-500">*</span>
                </label>
                <DatePicker
                  className="w-full"
                  value={reassignDeadline}
                  onChange={handleReassignDeadlineChange}
                  placeholder="Select deadline date"
                />
                {reassignError && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/90 rounded-xl p-2.5 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{reassignError}</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Status becomes Assigned for the manager and Not Started for the employee, same as the first assignment.
                </p>
              </div>

              {/* Remarks / Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Re-assign Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Extended deadline granted per employee request..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReassignModalOpen(false)}
                disabled={reassignSubmitting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                disabled={reassignSubmitting || !reassignDeadline || Boolean(reassignError)}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {reassignSubmitting ? (
                  "Re-assigning..."
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" /> Re-assign & Grant Access
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default QuarterlyReviewTable;
