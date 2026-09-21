import { HiddenRatingBadge } from "../components/HiddenRatingBadge";
import React, { useMemo, useState, useEffect } from "react";
import { Table, Button, Input, Select, Spin, Modal, message, Tooltip, Avatar } from "antd";
import axios from "axios";
import {
  Search,
  Users,
  Clock,
  Eye,
  Edit3,
  Calendar,
  Star,
  RotateCcw,
  Plus,
  Send,
  Key,
  Check,
  X,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import {
  ManagerReviewItem,
  AppraisalStatus,
  ActionType,
  QuarterFilter,
  StatusTabFilter,
  STATUS_TAB_ITEMS,
  STATUS_FILTER_ITEMS,
  YEAR_FILTER_ALL,
  DEFAULT_YEAR,
  toFiscalYearLabel,
  YEARS_BEFORE_CURRENT,
  YEARS_AFTER_CURRENT,
  AccessRequestStatus,
  AccessRequestAction,
  AssignmentListType,
  AssignedSubTab,
  AssignTargetMode,
  ReviewStatus,
  RequestUserRole,
} from "./QuarterlyReviewmobile.types";
import {
  getMasterFinancialYearCodes,
  getCurrentFinancialYearData,
  formatQuarterWithDateRange,
  computeQuarterDropdownOptions,
  QuarterDropdownOption,
} from '../../master/financialYear.master';
import QuarterlyViewPageMobile from "./Quarterlyviewpagemobile";
import { useManagerReviewBoard } from "../ManagerQuaterlyReview/hooks/useManagerReviewBoard";
import "./QuarterlyReviewmobile.css";

const { Option } = Select;

const TOTAL_CATEGORIES_FOR_AVERAGE = 6;
const ROLE_MANAGER_LABEL = "MANAGER";
const ROLE_ALL_LABEL = "ALL";
const tableTextClass = "text-slate-700 text-sm font-medium whitespace-nowrap";

const resolveQuarterDateRangeText = (q: string, fyString?: string): string => {
  let startYear: number;
  let endYear: number;
  const match = (fyString || "").match(/(\d{4})/);
  if (match) {
    startYear = parseInt(match[1], 10);
    endYear = startYear + 1;
  } else {
    const currentFY = getCurrentFinancialYearData();
    startYear = currentFY.startYear;
    endYear = currentFY.endYear;
  }
  const norm = (q || '').toUpperCase().trim();
  if (norm.startsWith('Q1')) return `01 Apr ${startYear} - 30 Jun ${startYear}`;
  if (norm.startsWith('Q2')) return `01 Jul ${startYear} - 30 Sep ${startYear}`;
  if (norm.startsWith('Q3')) return `01 Oct ${startYear} - 31 Dec ${startYear}`;
  if (norm.startsWith('Q4')) return `01 Jan ${endYear} - 31 Mar ${endYear}`;
  return '';
};

const formatDateDisplay = (dateValue?: string | Date | null): string => {
  if (!dateValue) return "—";
  try {
    const parsedDate = new Date(dateValue);
    if (isNaN(parsedDate.getTime())) return String(dateValue);
    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateValue);
  }
};

const getMinDeadlineDate = (startDateStr?: string | null): string => {
  if (!startDateStr) return '';
  const parts = startDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return '';
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dt = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
};

const renderStatusBadge = (statusValue: string | null) => {
  const normalizedStatus = (statusValue || AppraisalStatus.ASSIGNED).trim().toLowerCase().replace(/[\s_-]/g, '');
  const reviewedKey = AppraisalStatus.REVIEWED.toLowerCase().replace(/[\s_-]/g, '');
  const underReviewKey = AppraisalStatus.UNDER_REVIEW.toLowerCase().replace(/[\s_-]/g, '');
  const awaitingReviewKey = AppraisalStatus.AWAITING_REVIEW.toLowerCase().replace(/[\s_-]/g, '');
  const submittedKey = ReviewStatus.SUBMITTED.toLowerCase().replace(/[\s_-]/g, '');
  const autoSubmittedKey = ReviewStatus.AUTO_SUBMITTED.toLowerCase().replace(/[\s_-]/g, '');

  if (normalizedStatus === reviewedKey) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {AppraisalStatus.REVIEWED}
      </span>
    );
  }
  if (normalizedStatus === underReviewKey) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {AppraisalStatus.UNDER_REVIEW}
      </span>
    );
  }
  if (
    normalizedStatus === awaitingReviewKey ||
    normalizedStatus === submittedKey ||
    normalizedStatus === autoSubmittedKey
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        {AppraisalStatus.AWAITING_REVIEW}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
      {AppraisalStatus.ASSIGNED}
    </span>
  );
};

const getRecordAverageScore = (reviewRecord: any): number | null => {
  if (reviewRecord?.finalRating != null && !isNaN(Number(reviewRecord.finalRating))) {
    return Number(reviewRecord.finalRating);
  }
  if (reviewRecord?.averageRatingScore != null && !isNaN(Number(reviewRecord.averageRatingScore))) {
    return Number(reviewRecord.averageRatingScore);
  }
  if (reviewRecord?.ratings && typeof reviewRecord.ratings === "object") {
    const numericRatingValues = Object.values(reviewRecord.ratings).filter(
      (valueItem): valueItem is number => typeof valueItem === "number" && !isNaN(valueItem)
    );
    if (numericRatingValues.length > 0) {
      const sumOfRatings = numericRatingValues.reduce(
        (accumulatedTotal, currentRating) => accumulatedTotal + currentRating,
        0
      );
      if (sumOfRatings > 0) {
        const totalCategories = Math.max(numericRatingValues.length, TOTAL_CATEGORIES_FOR_AVERAGE);
        return parseFloat((sumOfRatings / totalCategories).toFixed(1));
      }
    }
  }
  return null;
};

const FinalRatingBadge: React.FC<{ rating: number | null; record?: any }> = ({ rating, record }) => {
  const effectiveScore = getRecordAverageScore(record) ?? rating;
  if (record?.isFinalRatingHidden) {
    return (
      <HiddenRatingBadge
        reviewId={record.id}
        quarter={record.quarter}
        finalRating={effectiveScore}
        isFinalRatingHidden={true}
        hasFinalRating={record.hasFinalRating || effectiveScore != null}
      />
    );
  }
  return effectiveScore != null ? (
    <span className="mobile-rating-badge">
      <Star className="mobile-rating-icon" />
      {effectiveScore}
    </span>
  ) : (
    <span className="mobile-rating-empty">—</span>
  );
};

const CardField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="mobile-card-field">
    <span className="mobile-card-field-label">{label}</span>
    <span className="mobile-card-field-value">{children}</span>
  </div>
);

const SubmissionCard: React.FC<{
  record: ManagerReviewItem;
  onEvaluate: () => void;
  onView: () => void;
  accessRequests?: any[];
  onReviewAccessRequest?: (req: any) => void;
}> = ({ record, onEvaluate, onView, accessRequests, onReviewAccessRequest }) => {
  const isReviewed =
    record.status === AppraisalStatus.REVIEWED ||
    record.reviewStatus === AppraisalStatus.REVIEWED;

  const canEvaluate =
    isReviewed ||
    record.status === AppraisalStatus.AWAITING_REVIEW ||
    record.status === AppraisalStatus.UNDER_REVIEW ||
    record.reviewStatus === AppraisalStatus.AWAITING_REVIEW ||
    record.reviewStatus === AppraisalStatus.UNDER_REVIEW;

  const pendingRequest = accessRequests?.find((r: any) => {
    if (String(r.employeeId).trim().toLowerCase() !== String(record.employeeId).trim().toLowerCase()) return false;
    if (r.status !== AccessRequestStatus.PENDING) return false;
    const rQuarter = (r.quarter || "").toUpperCase().replace(/[\s\-_]/g, "");
    const recQuarter = (record.quarter || "").toUpperCase().replace(/[\s\-_]/g, "");
    const recFull = (record.fullQuarter || "").toUpperCase().replace(/[\s\-_]/g, "");
    const recCode = (record.quarterCode || "").toUpperCase().replace(/[\s\-_]/g, "");
    if (!rQuarter) return true;
    if (rQuarter === recQuarter || rQuarter === recFull) return true;
    if (recCode && (rQuarter.startsWith(recCode) || rQuarter.includes(recCode))) return true;
    if (recQuarter && (rQuarter.includes(recQuarter) || recQuarter.includes(rQuarter))) return true;
    return true;
  }) || (record as any).pendingAccessRequest || null;

  const showAccessRequestBtn = Boolean(pendingRequest || (record as any).hasPendingAccessRequest);

  return (
    <div className="mobile-submission-card">
      <div className="mobile-submission-head">
        <div className="mobile-submission-meta">
          <Avatar size="large" className="mobile-avatar">
            {record.employeeName ? record.employeeName.charAt(0).toUpperCase() : "E"}
          </Avatar>
          <div className="mobile-submission-copy">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="mobile-submission-title">{record.employeeName}</p>
              {record.employeeRole && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${record.employeeRole.toUpperCase() === ROLE_MANAGER_LABEL
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                >
                  {record.employeeRole}
                </span>
              )}
            </div>
            <p className="mobile-submission-subtitle">
              {record.designation || "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {renderStatusBadge(record.displayReviewStatus || record.reviewStatus || record.status)}
        </div>
      </div>

      <div className="mobile-card-body">
        <CardField label="Employee ID">
          <span className="mobile-card-field-strong">
            {record.employeeId}
          </span>
        </CardField>
        <CardField label="Quarter">
          <span className="mobile-card-field-strong">
            {record.quarter ? record.quarter.trim().split(/\s+/)[0] : "—"}
          </span>
        </CardField>
        <CardField label="Financial Year">
          <span className="text-slate-700 text-xs font-medium">
            {record.financialYear || "—"}
          </span>
        </CardField>
        <CardField label="Deadline">
          <span className="text-slate-700 text-xs font-medium">
            {formatDateDisplay(record.toDate || record.endDate || record.deadlineAt)}
          </span>
        </CardField>
        <CardField label="Final Rating">
          <FinalRatingBadge rating={record.finalRating} record={record} />
        </CardField>
        <CardField label="Updated On">
          {record.lastModified ? (
            <span>
              {new Date(record.lastModified).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          ) : (
            "—"
          )}
        </CardField>
        {((record as any).assignedByName || record.managerName) && (
          <CardField label="Assigned By">
            <span className="text-slate-800 text-xs font-semibold">
              {(record as any).assignedByName || record.managerName}
            </span>
          </CardField>
        )}
        {record.evaluatorName && (
          <CardField label="Evaluated By">
            <span className="text-slate-800 text-xs font-semibold">
              {record.evaluatorName} {record.evaluatorRole ? `(${record.evaluatorRole})` : ""}
            </span>
          </CardField>
        )}
      </div>

      <div className="mobile-submission-actions">
        {canEvaluate && (
          <Button
            type="text"
            size="small"
            icon={<Edit3 className="w-3.5 h-3.5" />}
            onClick={onEvaluate}
            title={isReviewed || record.status === AppraisalStatus.UNDER_REVIEW ? "Edit Evaluation" : "Evaluate"}
            className="!border !border-slate-300 hover:!border-indigo-400 !text-slate-700 hover:!text-indigo-600 !font-semibold !rounded-lg !flex !items-center !justify-center !w-8 !h-8 !p-0 !bg-white hover:!bg-indigo-50"
          />
        )}
        <Button
          size="small"
          icon={<Eye className="w-3.5 h-3.5" />}
          onClick={onView}
          title="View Review"
          className="!border !border-slate-300 hover:!border-indigo-400 !text-slate-700 hover:!text-indigo-600 !font-semibold !rounded-lg !flex !items-center !justify-center !w-8 !h-8 !p-0 !bg-white hover:!bg-indigo-50"
        />
        {showAccessRequestBtn && onReviewAccessRequest && (
          <Button
            size="small"
            icon={<Key className="w-3.5 h-3.5 text-amber-600" />}
            onClick={() => onReviewAccessRequest(pendingRequest || null)}
            title={
              pendingRequest
                ? `Pending access request for ${pendingRequest.quarter || record.quarter || 'this quarter'}`
                : "View pending access request"
            }
            className="!border-amber-300 !bg-amber-50 hover:!bg-amber-100 !text-amber-700 !font-semibold !rounded-lg !flex !items-center !justify-center !w-8 !h-8 !p-0"
          />
        )}
      </div>
    </div>
  );
};

const ManagerReviewBoardMobile: React.FC<{ onBack?: () => void }> = () => {
  // ── Shared Hook for single source of truth logic ──────────────────────────
  const board = useManagerReviewBoard({ syncUrlParams: true });

  // ── Access Requests State ────────────────────────────────────────────────
  const [selectedAccessRequest, setSelectedAccessRequest] = useState<any | null>(null);
  const [accessRequestsOpen, setAccessRequestsOpen] = useState<boolean>(false);
  const [actionComments, setActionComments] = useState<Record<string | number, string>>({});
  const [actioningRequestId, setActioningRequestId] = useState<string | number | null>(null);

  const openAccessRequestsModal = (targetRequest?: any | null) => {
    setSelectedAccessRequest(targetRequest || null);
    setAccessRequestsOpen(true);
    board.loadAccessRequests();
  };

  const handleAccessRequestAction = async (
    requestId: string | number,
    action: AccessRequestAction,
  ) => {
    const comment = (actionComments[requestId] || "").trim();
    if (action === AccessRequestAction.REJECT && !comment) {
      message.warning("Please enter a comment/reason before rejecting the access request.");
      return;
    }

    try {
      setActioningRequestId(requestId);
      const success = await board.handleActionAccessRequest(requestId, action, comment, 48);
      if (success) {
        setActionComments((prev) => {
          const updated = { ...prev };
          delete updated[requestId];
          return updated;
        });
        setSelectedAccessRequest(null);
        setAccessRequestsOpen(false);
      }
    } finally {
      setActioningRequestId(null);
    }
  };

  // ── Create & Assign Modals State ──────────────────────────────────────────
  const [modeSelectModalOpen, setModeSelectModalOpen] = useState<boolean>(false);
  const [selectedAssignMode, setSelectedAssignMode] = useState<AssignTargetMode | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [assignMode, setAssignMode] = useState<AssignTargetMode>(AssignTargetMode.INDIVIDUAL);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [assignQuarterLabel, setAssignQuarterLabel] = useState<string>("");
  const [assignFinancialYear, setAssignFinancialYear] = useState<string>("");
  const [assignStartDate, setAssignStartDate] = useState<string>("");
  const [assignEndDate, setAssignEndDate] = useState<string>("");
  const [assignNotes, setAssignNotes] = useState<string>("");
  const [assignSubmitting, setAssignSubmitting] = useState<boolean>(false);
  const [assignableEmployees, setAssignableEmployees] = useState<any[]>([]);
  const [loadingAssignableEmployees, setLoadingAssignableEmployees] = useState<boolean>(false);

  const filterQuarterOptions = useMemo(() => {
    return computeQuarterDropdownOptions(
      board.selectedYear !== YEAR_FILTER_ALL ? board.selectedYear : undefined
    );
  }, [board.selectedYear]);

  const employeeFilterOptions = useMemo(() => [
    { label: board.employeeDropdownLabel, value: "ALL" },
    ...board.teamEmployees.map((teamMember) => ({
      label: teamMember.employeeName && teamMember.employeeName !== teamMember.employeeId
        ? `${teamMember.employeeName} (${teamMember.employeeId})`
        : teamMember.employeeId,
      value: teamMember.employeeId,
    })),
  ], [board.teamEmployees, board.employeeDropdownLabel]);

  const getQuarterOptionStatus = (quarterCode: string): {
    disabled: boolean;
    tag: string | null;
    tagClass: string;
  } => {
    if (assignMode === AssignTargetMode.INDIVIDUAL && selectedEmployeeIds.length === 0) {
      return { disabled: false, tag: null, tagClass: "" };
    }

    const normalizedQuarter = quarterCode.trim().toUpperCase();

    const targetEmployeeIds =
      assignMode === AssignTargetMode.ALL
        ? assignableEmployees.map((employeeItem) => String(employeeItem.employeeId))
        : selectedEmployeeIds.map(String);

    if (targetEmployeeIds.length === 0) {
      return { disabled: false, tag: null, tagClass: "" };
    }

    let anyAssignedWithoutRequest = false;
    let anyRequested = false;

    for (const empId of targetEmployeeIds) {
      const employeeItem = assignableEmployees.find(
        (e) => String(e.employeeId).toLowerCase() === empId.toLowerCase()
      );

      const assignedQuarterList: string[] = [
        ...(employeeItem?.assignedQuarters || []),
        ...(board.submissions || [])
          .filter((s) => String(s.employeeId).toLowerCase() === empId.toLowerCase())
          .map((s) => s.quarterCode || s.quarter || ""),
      ].filter(Boolean);

      const requestedQuarterList: string[] = [
        ...(employeeItem?.requestedQuarters || []),
        ...(board.accessRequests || [])
          .filter(
            (r) =>
              String(r.employeeId).toLowerCase() === empId.toLowerCase() &&
              r.status === AccessRequestStatus.PENDING
          )
          .map((r) => r.quarter || ""),
      ].filter(Boolean);

      const isEmployeeAssigned = assignedQuarterList.some((assignedQuarter: string) => {
        const normalizedAssigned = (assignedQuarter || "").trim().toUpperCase();
        return (
          normalizedAssigned === normalizedQuarter ||
          normalizedAssigned.startsWith(normalizedQuarter + " ") ||
          normalizedAssigned.startsWith(normalizedQuarter + "-") ||
          normalizedAssigned.includes(` ${normalizedQuarter} `) ||
          normalizedAssigned.endsWith(` ${normalizedQuarter}`)
        );
      });

      if (isEmployeeAssigned) {
        const hasEmployeeRequest = requestedQuarterList.some((requestedQuarter: string) => {
          const normalizedRequested = (requestedQuarter || "").trim().toUpperCase();
          return (
            normalizedRequested === normalizedQuarter ||
            normalizedRequested.startsWith(normalizedQuarter + " ") ||
            normalizedRequested.startsWith(normalizedQuarter + "-") ||
            normalizedRequested.includes(` ${normalizedQuarter} `) ||
            normalizedRequested.endsWith(` ${normalizedQuarter}`)
          );
        });

        if (hasEmployeeRequest) {
          anyRequested = true;
        } else {
          anyAssignedWithoutRequest = true;
        }
      }
    }

    if (anyAssignedWithoutRequest) {
      return {
        disabled: true,
        tag: "Already assigned",
        tagClass: "text-slate-400 font-normal",
      };
    }

    if (anyRequested) {
      return {
        disabled: false,
        tag: "Access Requested",
        tagClass: "text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-semibold",
      };
    }

    return { disabled: false, tag: null, tagClass: "" };
  };

  const handleAssignReview = async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const effectiveStart = assignStartDate || todayStr;

    if (!assignQuarterLabel) {
      message.error("Quarter is required.");
      return;
    }
    if (!assignEndDate) {
      message.error("Deadline is required.");
      return;
    }
    if (assignEndDate < tomorrowStr) {
      message.error("Deadline must be at least tomorrow. Current date cannot be selected.");
      return;
    }
    if (!assignNotes || !assignNotes.trim()) {
      message.error("Description is required.");
      return;
    }
    if (assignMode === AssignTargetMode.INDIVIDUAL && selectedEmployeeIds.length === 0) {
      message.error("Please select at least one employee.");
      return;
    }
    try {
      setAssignSubmitting(true);
      const assignmentPayload: {
        mode: string;
        quarter: string;
        financialYear?: string;
        startDate: string;
        endDate: string;
        description: string;
        employeeIds?: string[];
      } = {
        mode: assignMode === AssignTargetMode.ALL ? "ALL" : "INDIVIDUAL",
        quarter: assignQuarterLabel,
        financialYear: assignFinancialYear,
        startDate: effectiveStart,
        endDate: assignEndDate,
        description: assignNotes.trim(),
      };
      if (assignMode === AssignTargetMode.INDIVIDUAL) {
        assignmentPayload.employeeIds = selectedEmployeeIds;
      }
      const createResponse = await axios.post("/api/manager-quarterly-review/assignments/create", assignmentPayload);
      if (createResponse.data?.success) {
        const createdCount = createResponse.data?.data?.created ?? 0;
        const skippedCount = createResponse.data?.data?.skipped ?? 0;
        message.success(
          createResponse.data?.message ||
          `${createdCount} assignment(s) created${skippedCount > 0 ? `, ${skippedCount} skipped` : ""}.`
        );
        setAssignModalOpen(false);
        setModeSelectModalOpen(false);
        setAssignQuarterLabel("");
        setAssignFinancialYear("");
        setAssignStartDate("");
        setAssignEndDate("");
        setAssignNotes("");
        setSelectedEmployeeIds([]);
        board.fetchData(1, board.pageSize);
      } else {
        message.error(createResponse.data?.message || "Failed to assign review.");
      }
    } catch (assignmentError: any) {
      message.error(assignmentError.response?.data?.message || "Failed to assign review.");
    } finally {
      setAssignSubmitting(false);
    }
  };

  const getSubmissionYear = (reviewItem: ManagerReviewItem): string => {
    const fiscalYearMatch = (reviewItem.quarter || "").match(/FY(\d{4}-\d{2})/i);
    if (fiscalYearMatch) return fiscalYearMatch[1];
    if (reviewItem.lastModified) {
      return toFiscalYearLabel(new Date(reviewItem.lastModified).getFullYear());
    }
    return "";
  };

  const yearOptions = useMemo(() => {
    const masterYears = getMasterFinancialYearCodes();
    const dataYears = board.submissions
      .map((submissionItem) => getSubmissionYear(submissionItem))
      .filter(Boolean);
    return Array.from(
      new Set([...masterYears, DEFAULT_YEAR, ...dataYears])
    ).sort((previousYear, nextYear) => parseInt(nextYear, 10) - parseInt(previousYear, 10));
  }, [board.submissions]);

  const columns = [
    {
      title: "Employee Name",
      key: "employeeName",
      width: 150,
      render: (_: any, reviewRecord: ManagerReviewItem) => {
        const displayName = reviewRecord.employeeName
          ? reviewRecord.employeeName
            .split(" ")
            .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
            .join(" ")
          : "";

        const initials = displayName
          ? displayName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word.charAt(0).toUpperCase())
            .join("")
          : "";

        return (
          <div className="inline-flex items-center gap-2 whitespace-nowrap">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold shrink-0">
              {initials || <Users className="w-3.5 h-3.5 text-indigo-500" />}
            </div>
            <div className="flex flex-col text-left">
              <p className={`${tableTextClass} whitespace-nowrap`}>{displayName || "—"}</p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
      width: 150,
      render: (employeeIdText: string) => (
        <span className={tableTextClass}>{employeeIdText || "—"}</span>
      ),
    },
    {
      title: "Role",
      dataIndex: "employeeRole",
      key: "employeeRole",
      width: 150,
      render: (_: any, reviewRecord: ManagerReviewItem) => {
        const roleRaw = (reviewRecord.employeeRole || (reviewRecord as any).role || "").toString().trim().toUpperCase();
        if (!roleRaw) return <span className={tableTextClass}>—</span>;
        const isManagerRole = roleRaw === ROLE_MANAGER_LABEL;
        return (
          <span
            className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${isManagerRole
              ? "bg-purple-100 text-purple-700 border border-purple-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
          >
            {roleRaw}
          </span>
        );
      },
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      width: 150,
      render: (designationText: string | null) => (
        <span className={tableTextClass}>
          {designationText ? designationText.charAt(0).toUpperCase() + designationText.slice(1) : "—"}
        </span>
      ),
    },
    {
      title: "Quarter",
      dataIndex: "quarter",
      key: "quarter",
      width: 150,
      render: (quarterText: string | null, reviewRecord: ManagerReviewItem) => {
        const display = formatQuarterWithDateRange(quarterText, reviewRecord.financialYear);
        return (
          <span className="font-semibold text-slate-800 text-sm whitespace-nowrap">
            {display || "—"}
          </span>
        );
      },
    },
    {
      title: "Financial Year",
      dataIndex: "financialYear",
      key: "financialYear",
      width: 150,
      render: (yearText: string | null) => (
        <span className={tableTextClass}>
          {yearText || "—"}
        </span>
      ),
    },
    {
      title: "Deadline",
      dataIndex: "toDate",
      key: "toDate",
      width: 150,
      render: (_: any, reviewRecord: ManagerReviewItem) => (
        <span className={tableTextClass}>
          {formatDateDisplay(reviewRecord.toDate || reviewRecord.endDate || reviewRecord.deadlineAt)}
        </span>
      ),
    },
    {
      title: "Assigned By",
      key: "assignedBy",
      width: 170,
      render: (_: any, reviewRecord: ManagerReviewItem) => {
        const displayAssignedBy =
          (reviewRecord as any).assignedByName ||
          (reviewRecord as any).assignedBy ||
          reviewRecord.managerName ||
          "—";
        return (
          <Tooltip title={displayAssignedBy}>
            <span className={`${tableTextClass} truncate max-w-[150px] inline-block`}>
              {displayAssignedBy}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Final Rating",
      dataIndex: "finalRating",
      key: "finalRating",
      width: 150,
      render: (ratingScore: number | null, reviewRecord: ManagerReviewItem) => {
        const effectiveScore = getRecordAverageScore(reviewRecord) ?? ratingScore;
        return reviewRecord.isFinalRatingHidden ? (
          <HiddenRatingBadge
            reviewId={reviewRecord.id}
            quarter={reviewRecord.quarter}
            finalRating={effectiveScore}
            isFinalRatingHidden={true}
            hasFinalRating={reviewRecord.hasFinalRating || effectiveScore != null}
          />
        ) : effectiveScore != null ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100 whitespace-nowrap">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {effectiveScore}
          </span>
        ) : (
          <span className="text-slate-400 text-sm font-medium whitespace-nowrap">—</span>
        );
      },
    },
    {
      title: "Updated On",
      dataIndex: "lastModified",
      key: "lastModified",
      width: 150,
      render: (modifiedDate: string | null) =>
        modifiedDate ? (
          <div className={`${tableTextClass} leading-tight whitespace-nowrap`}>
            <div>
              {new Date(modifiedDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        ) : (
          <span className="text-slate-400 text-sm font-medium whitespace-nowrap">—</span>
        ),
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_: any, reviewRecord: ManagerReviewItem) => (
        <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
          {renderStatusBadge(reviewRecord.displayReviewStatus || reviewRecord.reviewStatus || reviewRecord.status)}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "action",
      width: 150,
      fixed: "right" as const,
      render: (_: any, reviewRecord: ManagerReviewItem) => {
        const isReviewed =
          reviewRecord.status === AppraisalStatus.REVIEWED ||
          reviewRecord.reviewStatus === AppraisalStatus.REVIEWED;

        const canEvaluate =
          isReviewed ||
          reviewRecord.status === AppraisalStatus.AWAITING_REVIEW ||
          reviewRecord.status === AppraisalStatus.UNDER_REVIEW ||
          reviewRecord.reviewStatus === AppraisalStatus.AWAITING_REVIEW ||
          reviewRecord.reviewStatus === AppraisalStatus.UNDER_REVIEW;

        // Find pending access request for this row's employee and quarter
        const pendingRequest = board.accessRequests?.find((r: any) => {
          if (String(r.employeeId).trim().toLowerCase() !== String(reviewRecord.employeeId).trim().toLowerCase()) return false;
          if (r.status !== AccessRequestStatus.PENDING) return false;
          const rQuarter = (r.quarter || "").toUpperCase().replace(/[\s\-_]/g, "");
          const recQuarter = (reviewRecord.quarter || "").toUpperCase().replace(/[\s\-_]/g, "");
          const recFull = (reviewRecord.fullQuarter || "").toUpperCase().replace(/[\s\-_]/g, "");
          const recCode = (reviewRecord.quarterCode || "").toUpperCase().replace(/[\s\-_]/g, "");
          if (!rQuarter) return true;
          if (rQuarter === recQuarter || rQuarter === recFull) return true;
          if (recCode && (rQuarter.startsWith(recCode) || rQuarter.includes(recCode))) return true;
          if (recQuarter && (rQuarter.includes(recQuarter) || recQuarter.includes(rQuarter))) return true;
          return true;
        }) || (reviewRecord as any).pendingAccessRequest || null;

        const showAccessRequestBtn = Boolean(pendingRequest || (reviewRecord as any).hasPendingAccessRequest);

        return (
          <div className="inline-flex items-center gap-1.5 justify-center flex-nowrap whitespace-nowrap">
            {canEvaluate && (
              <Button
                type="text"
                size="small"
                icon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => board.handleOpenEvaluation(reviewRecord, false)}
                title={isReviewed || reviewRecord.status === AppraisalStatus.UNDER_REVIEW ? "Edit Evaluation" : "Evaluate"}
                className="!border-slate-300 hover:!border-indigo-400 !text-slate-700 hover:!text-indigo-600 !font-semibold !rounded-lg !flex !items-center !justify-center"
              />
            )}
            <Button
              size="small"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => board.handleOpenEvaluation(reviewRecord, true)}
              title="View Review"
              className="!border-slate-300 hover:!border-indigo-400 !text-slate-700 hover:!text-indigo-600 !font-semibold !rounded-lg !flex !items-center !justify-center"
            />
            {showAccessRequestBtn && (
              <Button
                size="small"
                icon={<Key className="w-3.5 h-3.5 text-amber-600" />}
                onClick={() => openAccessRequestsModal(pendingRequest || null)}
                title={
                  pendingRequest
                    ? `Access Request Pending: "${pendingRequest.requestReason || pendingRequest.reason || 'Reopen requested'}" - Click to review`
                    : "Access Request Pending - Click to review"
                }
                className="!border-amber-300 hover:!border-amber-400 !bg-amber-50 hover:!bg-amber-100 !text-amber-700 !font-semibold !rounded-lg !flex !items-center !justify-center"
              />
            )}
          </div>
        );
      },
    },
  ];

  if (board.isModalOpen) {
    return (
      <div className="quarterly-review-mobile-view mobile-page-shell">
        <QuarterlyViewPageMobile
          open={true}
          currentReview={board.currentReview}
          isViewOnly={board.isViewOnly}
          ratings={board.ratings}
          finalRating={board.finalRating}
          strengths={board.strengths}
          improvements={board.improvements}
          remarks={board.remarks}
          fieldErrors={board.fieldErrors}
          submitting={board.submitting}
          loadingReview={board.loading}
          averageRatingScore={board.averageRatingScore}
          onClose={board.handleCloseModal}
          onSubmitEvaluation={board.handleSubmitEvaluation}
          setRatings={board.setRatings}
          setFinalRating={board.setFinalRating}
          setStrengths={board.setStrengths}
          setImprovements={board.setImprovements}
          setRemarks={board.setRemarks}
          setFieldErrors={board.setFieldErrors}
        />
      </div>
    );
  }

  return (
    <div className="quarterly-review-mobile-view mobile-page-shell">
      {/* Back Navigation Row + Header */}
      <div className="mobile-page-header-stack">
        <div className="mobile-page-header-row">
          <div className="mobile-page-header-copy">
            <div className="mobile-title-col">
              <h1 className="mobile-page-title">
                {board.isManager ? "Manager Quarterly Review" : "Quarterly Review"}
              </h1>
              <p className="mobile-page-subtitle">
                {board.isManager
                  ? "Review and rate your team's quarterly submissions."
                  : "Review and rate quarterly appraisal submissions across the organization."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="mobile-filter-bar">
        {/* Header: Title on left, Create button on right */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
          <h2 className="mobile-filter-heading !mb-0">Quarterly Reviews</h2>
          <button
            type="button"
            onClick={() => {
              setModeSelectModalOpen(true);
              setSelectedAssignMode(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
            title="Create review assignment"
          >
            <span className="text-sm leading-none">+</span>
            Create
          </button>
        </div>

        <div className="mobile-filter-toolbar">
          {/* Row 1: Search, All Roles, Financial Year in one line */}
          <div className="mobile-filter-row mobile-filter-row-1">
            <div className="mobile-filter-col mobile-filter-col-search">
              <Input
                placeholder="Search employee name or ID..."
                prefix={<Search className="mobile-search-icon" />}
                value={board.searchQuery}
                onChange={(searchChangeEvent) => {
                  board.setSearchQuery(searchChangeEvent.target.value);
                  board.setCurrentPage(1);
                }}
                className="mobile-input w-full"
                allowClear
              />
            </div>

            {!board.isManager && (
              <div className="mobile-filter-col mobile-filter-col-role">
                <Select
                  value={board.selectedRole === ROLE_ALL_LABEL ? undefined : board.selectedRole}
                  placeholder="All Roles"
                  prefix={<Briefcase className="w-4 h-4 text-indigo-500 shrink-0" />}
                  onChange={(selectedRoleValue) => {
                    board.setSelectedRole(selectedRoleValue || ROLE_ALL_LABEL);
                    board.setCurrentPage(1);
                  }}
                  allowClear
                  className="mobile-select w-full"
                  getPopupContainer={(trigger) => trigger.parentElement!}
                >
                  <Option value={ROLE_ALL_LABEL}>All Roles</Option>
                  <Option value={ROLE_MANAGER_LABEL}>Managers</Option>
                  <Option value="EMPLOYEE">Employees</Option>
                </Select>
              </div>
            )}

            <div className="mobile-filter-col mobile-filter-col-fy">
              <Select
                value={board.selectedYear === YEAR_FILTER_ALL ? undefined : board.selectedYear}
                placeholder="Financial Year"
                prefix={<Calendar className="w-4 h-4 text-indigo-500 shrink-0" />}
                onChange={(selectedYearValue) => {
                  board.setSelectedYear(selectedYearValue || YEAR_FILTER_ALL);
                  board.setCurrentPage(1);
                }}
                allowClear
                className="mobile-year-select-full mobile-select w-full"
                dropdownStyle={{ minWidth: 160 }}
                getPopupContainer={(trigger) => trigger.parentElement!}
              >
                <Option value={YEAR_FILTER_ALL}>All Years</Option>
                {yearOptions.map((fiscalYearOption) => (
                  <Option key={fiscalYearOption} value={fiscalYearOption}>
                    {`FY ${fiscalYearOption}`}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {/* Row 2: Quarter, Select All, All Status, and Clear in another line */}
          <div className="mobile-filter-row mobile-filter-row-2">
            <div className="mobile-filter-col mobile-filter-col-quarter">
              <Select
                value={board.selectedQuarterCard === QuarterFilter.ALL ? undefined : board.selectedQuarterCard}
                placeholder="Quarters"
                prefix={<Clock className="w-4 h-4 text-indigo-500 shrink-0" />}
                onChange={(selectedQuarterValue) => {
                  board.setSelectedQuarterCard(selectedQuarterValue || QuarterFilter.ALL);
                  board.setCurrentPage(1);
                }}
                allowClear
                className="mobile-select w-full"
                optionLabelProp="label"
                getPopupContainer={(trigger) => trigger.parentElement!}
              >
                <Option value={QuarterFilter.ALL} label="All Quarters">All Quarters</Option>
                {filterQuarterOptions.map((opt) => (
                  <Option key={opt.code} value={opt.code} label={`${opt.code}  ${opt.shortDateRange}`}>
                    <div className="flex items-center gap-2 py-0.5">
                      <span className="font-semibold text-slate-800 text-sm">{opt.code}</span>
                      <span className="text-slate-500 text-xs font-normal">{opt.shortDateRange}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>

            <div className="mobile-filter-col mobile-filter-col-employee">
              <Select
                value={board.selectedEmployee === "ALL" ? undefined : board.selectedEmployee}
                placeholder={board.employeeDropdownLabel}
                prefix={<Users className="w-4 h-4 text-indigo-500 shrink-0" />}
                onChange={(selectedEmployeeValue) => {
                  board.setSelectedEmployee(selectedEmployeeValue || "ALL");
                  board.setCurrentPage(1);
                }}
                allowClear
                loading={board.loadingTeamEmployees}
                className="mobile-select w-full"
                showSearch
                filterOption={(inputFilter, optionItem) =>
                  String(optionItem?.label || "")
                    .toLowerCase()
                    .includes(inputFilter.toLowerCase())
                }
                options={employeeFilterOptions}
                dropdownStyle={{ minWidth: 200 }}
                getPopupContainer={(trigger) => trigger.parentElement!}
              />
            </div>

            <div className="mobile-filter-col mobile-filter-col-status">
              <Select
                value={board.selectedStatusTab === StatusTabFilter.ALL ? undefined : board.selectedStatusTab}
                placeholder="All Status"
                prefix={<ClipboardList className="w-4 h-4 text-indigo-500 shrink-0" />}
                onChange={(selectedStatusValue) => {
                  board.setSelectedStatusTab(selectedStatusValue || StatusTabFilter.ALL);
                  board.setCurrentPage(1);
                }}
                allowClear
                className="mobile-select w-full"
                getPopupContainer={(trigger) => trigger.parentElement!}
              >
                {STATUS_FILTER_ITEMS.map((statusFilterOption) => (
                  <Option key={statusFilterOption.key} value={statusFilterOption.key}>
                    {statusFilterOption.label}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="mobile-filter-col mobile-filter-col-clear shrink-0">
              <button
                type="button"
                disabled={!board.hasActiveFilters}
                onClick={board.handleClearFilters}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs h-[36px] ${board.hasActiveFilters
                  ? "text-slate-600 hover:text-indigo-600 bg-slate-100/90 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 cursor-pointer"
                  : "text-slate-400 bg-slate-100/50 border border-slate-200/50 cursor-not-allowed opacity-50 shadow-none"
                  }`}
                title={board.hasActiveFilters ? "Reset all filters" : "No active filters"}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {board.loading ? (
        <div className="mobile-loading-state">
          <div className="mobile-loading-state-inner">
            <Spin size="large" tip="Loading team quarterly reviews..." />
          </div>
        </div>
      ) : board.submissions.length > 0 ? (
        <>
          {/* Mobile card list with server-side pagination */}
          <div className="mobile-card-list">
            {board.submissions.map((submissionRecord) => (
              <SubmissionCard
                key={submissionRecord.id}
                record={submissionRecord}
                onEvaluate={() => board.handleOpenEvaluation(submissionRecord, false)}
                onView={() => board.handleOpenEvaluation(submissionRecord, true)}
                accessRequests={board.accessRequests}
                onReviewAccessRequest={openAccessRequestsModal}
              />
            ))}
          </div>

          {/* Server-driven Pagination */}
          {board.totalCount > board.pageSize && (
            <div className="mobile-pagination">
              <Pagination
                current={board.currentPage}
                pageSize={board.pageSize}
                total={board.totalCount}
                onChange={(pageNumber, pageSizeNumber) => {
                  board.setCurrentPage(pageNumber);
                  board.setPageSize(pageSizeNumber);
                  board.fetchData(pageNumber, pageSizeNumber);
                }}
                simple
              />
            </div>
          )}

          {/* Desktop / tablet table */}
          <div className="mobile-table-shell">
            <Table
              columns={columns}
              dataSource={board.submissions}
              rowKey="id"
              loading={board.loading || board.accessRequestsLoading}
              tableLayout="fixed"
              pagination={{
                current: board.currentPage,
                pageSize: board.pageSize,
                total: board.totalCount,
                onChange: (pageNumber, pageSizeNumber) => {
                  board.setCurrentPage(pageNumber);
                  board.setPageSize(pageSizeNumber);
                  board.fetchData(pageNumber, pageSizeNumber);
                },
                showSizeChanger: true,
              }}
              className="custom-table"
              scroll={{ x: 1650 }}
            />
          </div>
        </>
      ) : (
        <div className="mobile-empty-state">
          <div className="mobile-empty-state-inner">
            <FileCheck className="mobile-empty-icon" />
            <h3 className="mobile-empty-title">No submissions found</h3>
            <p className="mobile-empty-copy">
              There are currently no employee quarterly review submissions
              matching your filters.
            </p>
          </div>
        </div>
      )}

      {/* ── Mode Select Modal ── */}
      <Modal
        open={modeSelectModalOpen}
        onCancel={() => {
          setModeSelectModalOpen(false);
          setSelectedAssignMode(null);
        }}
        footer={null}
        centered
        width={420}
        title={
          <div className="flex items-center gap-2.5 pb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <Plus className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#2B3674] text-base leading-snug">
                Create Review Assignment
              </h3>
              <p className="text-xs text-slate-400 font-normal">
                Choose how you want to assign the quarterly review
              </p>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-3 pt-2">
          {/* Individual Member(s) */}
          <button
            type="button"
            onClick={() => setSelectedAssignMode(AssignTargetMode.INDIVIDUAL)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedAssignMode === AssignTargetMode.INDIVIDUAL
              ? "border-indigo-500 bg-indigo-50/40"
              : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
              }`}
          >
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAssignMode === AssignTargetMode.INDIVIDUAL
                ? "border-indigo-600"
                : "border-slate-300"
                }`}
            >
              {selectedAssignMode === AssignTargetMode.INDIVIDUAL && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              )}
            </span>

            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">
                Individual Member(s)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Select specific employees from your team
              </p>
            </div>
          </button>

          {/* All Members */}
          <button
            type="button"
            onClick={() => setSelectedAssignMode(AssignTargetMode.ALL)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedAssignMode === AssignTargetMode.ALL
              ? "border-emerald-500 bg-emerald-50/40"
              : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
              }`}
          >
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAssignMode === AssignTargetMode.ALL
                ? "border-emerald-600"
                : "border-slate-300"
                }`}
            >
              {selectedAssignMode === AssignTargetMode.ALL && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              )}
            </span>

            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">
                All Members
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign to your entire team at once
              </p>
            </div>
          </button>

          {/* Continue Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={!selectedAssignMode}
              onClick={() => {
                if (!selectedAssignMode) return;
                setAssignMode(selectedAssignMode);
                setSelectedEmployeeIds([]);
                setAssignQuarterLabel("");
                setAssignFinancialYear("");
                setAssignStartDate("");
                setAssignEndDate("");
                setAssignNotes("");
                setModeSelectModalOpen(false);
                setAssignModalOpen(true);

                setLoadingAssignableEmployees(true);
                const queryMode = selectedAssignMode === AssignTargetMode.ALL ? "all-members" : "individual";
                axios
                  .get("/api/quarterly-review/assignable-employees", {
                    params: { mode: queryMode },
                  })
                  .then((response) => {
                    if (response.data?.success && Array.isArray(response.data.data)) {
                      setAssignableEmployees(
                        [...response.data.data].sort((firstEmployee: any, secondEmployee: any) =>
                          (firstEmployee.employeeName || "").localeCompare(
                            secondEmployee.employeeName || "",
                            undefined,
                            { sensitivity: "base" }
                          )
                        )
                      );
                    }
                  })
                  .catch(() => { })
                  .finally(() => setLoadingAssignableEmployees(false));
              }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${selectedAssignMode
                ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
            >
              Continue
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Assign Modal ── */}
      <Modal
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false);
          setSelectedAssignMode(null);
        }}
        footer={null}
        title={
          <div className="flex items-center gap-2.5 pb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <Send className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#2B3674] text-base leading-snug">
                Assign Quarterly Review
              </h3>
              <p className="text-xs text-slate-400 font-normal">
                {board.isManager
                  ? "Open review access for your reporting team members"
                  : "Open review access for employees across the organization"}
              </p>
            </div>
          </div>
        }
        destroyOnClose
        centered
        width={540}
        maskClosable={false}
      >
        <div className="flex flex-col gap-4 pt-3">
          {/* Mode 1: Individual / Multi-Select */}
          {assignMode === AssignTargetMode.INDIVIDUAL ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Select Employees
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedEmployeeIds(
                        assignableEmployees.map((employeeItem) => employeeItem.employeeId)
                      )
                    }
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Select All ({assignableEmployees.length})
                  </button>
                  {selectedEmployeeIds.length > 0 && (
                    <>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedEmployeeIds([])}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              <Select
                mode="multiple"
                showSearch
                optionLabelProp="label"
                loading={loadingAssignableEmployees}
                value={selectedEmployeeIds}
                onChange={(selectedValues) => setSelectedEmployeeIds(selectedValues)}
                placeholder={
                  loadingAssignableEmployees
                    ? "Loading eligible employees..."
                    : board.isManager
                      ? "Select one or more team members..."
                      : "Select one or more employees..."
                }
                className="w-full"
                size="large"
                maxTagCount="responsive"
                filterOption={(inputFilter, optionItem: any) => {
                  if (!inputFilter) return true;
                  const queryText = inputFilter.toLowerCase().trim();
                  if (optionItem?.label && String(optionItem.label).toLowerCase().includes(queryText)) {
                    return true;
                  }
                  if (optionItem?.value && String(optionItem.value).toLowerCase().includes(queryText)) {
                    return true;
                  }
                  const matchedEmployee = assignableEmployees.find(
                    (employeeItem: any) =>
                      String(employeeItem.employeeId).toLowerCase() === String(optionItem?.value).toLowerCase()
                  );
                  if (matchedEmployee) {
                    const employeeSearchContent = `${matchedEmployee.employeeName || ""} ${matchedEmployee.employeeId || ""} ${matchedEmployee.designation || ""}`.toLowerCase();
                    return employeeSearchContent.includes(queryText);
                  }
                  return false;
                }}
              >
                {[...assignableEmployees]
                  .sort((firstEmployee: any, secondEmployee: any) =>
                    (firstEmployee.employeeName || "").localeCompare(secondEmployee.employeeName || "", undefined, {
                      sensitivity: "base",
                    })
                  )
                  .map((employeeRecord: any) => {
                    const hasAssignedQuarters =
                      employeeRecord.assignedQuarters && employeeRecord.assignedQuarters.length > 0;
                    const assignedTagString = hasAssignedQuarters
                      ? employeeRecord.assignedQuarters
                        .map((quarterString: string) => quarterString.split(" ")[0])
                        .filter(
                          (valueItem: string, indexItem: number, arrayItems: string[]) =>
                            arrayItems.indexOf(valueItem) === indexItem
                        )
                        .join(", ")
                      : "";
                    const employeeDisplayName =
                      employeeRecord.employeeName && employeeRecord.employeeName !== employeeRecord.employeeId
                        ? `${employeeRecord.employeeName} (${employeeRecord.employeeId})`
                        : employeeRecord.employeeId;
                    return (
                      <Option key={employeeRecord.employeeId} value={employeeRecord.employeeId} label={employeeDisplayName}>
                        <span className="font-medium text-slate-800">
                          {employeeRecord.employeeName} ({employeeRecord.employeeId})
                        </span>
                        {employeeRecord.designation ? (
                          <span className="text-slate-500 font-normal"> - {employeeRecord.designation}</span>
                        ) : null}
                        {hasAssignedQuarters ? (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 font-medium">
                            {assignedTagString} Assigned
                          </span>
                        ) : null}
                      </Option>
                    );
                  })}
              </Select>

              {assignableEmployees.length === 0 && !loadingAssignableEmployees && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  {board.isManager
                    ? "No mapped team members found for your manager account. Please contact an Administrator to map employees."
                    : "No active employees found in the organization."}
                </p>
              )}
            </div>
          ) : (
            /* Mode 2: Bulk All Members Callout */
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-indigo-900">
                  {board.isManager
                    ? `Assign to all ${assignableEmployees.length} team members`
                    : `Assign to all ${assignableEmployees.length} employees in the organization`}
                </h4>
                <p className="text-[11px] text-indigo-700/90 mt-0.5 leading-relaxed">
                  Review access will be opened for all eligible members for the chosen quarter and selected dates.
                </p>
              </div>
            </div>
          )}

          {/* Quarter selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Quarter <span className="text-red-500">*</span>
            </label>
            <Select
              value={assignQuarterLabel || undefined}
              onChange={(selectedQuarterValue) => setAssignQuarterLabel(selectedQuarterValue)}
              placeholder="Select quarter"
              className="w-full"
              size="large"
              optionLabelProp="label"
            >
              {[QuarterFilter.Q1, QuarterFilter.Q2, QuarterFilter.Q3, QuarterFilter.Q4].map((quarterCode) => {
                const quarterStatus = getQuarterOptionStatus(quarterCode);
                const dateRange = resolveQuarterDateRangeText(
                  quarterCode,
                  assignFinancialYear || (board.selectedYear !== YEAR_FILTER_ALL ? board.selectedYear : undefined)
                );
                const fullLabel = `${quarterCode}  ${dateRange}`;
                return (
                  <Option key={quarterCode} value={quarterCode} label={fullLabel} disabled={quarterStatus.disabled}>
                    <div className="flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-2">
                        <span className={quarterStatus.disabled ? "text-slate-400 font-semibold text-sm" : "text-slate-800 font-semibold text-sm"}>
                          {quarterCode}
                        </span>
                        <span className={quarterStatus.disabled ? "text-slate-400 text-xs font-normal" : "text-slate-500 text-xs font-normal"}>
                          {dateRange}
                        </span>
                      </div>
                      {quarterStatus.tag && (
                        <span className={`text-[11px] ml-2 ${quarterStatus.tagClass}`}>
                          {quarterStatus.tag}
                        </span>
                      )}
                    </div>
                  </Option>
                );
              })}
            </Select>
          </div>

          {/* Deadline date picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              To (Deadline) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={assignEndDate}
                min={(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
                })()}
                onChange={(dateChangeEvent) => setAssignEndDate(dateChangeEvent.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
            {assignEndDate && (() => {
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              const diffDays = Math.round((new Date(assignEndDate).getTime() - new Date(todayStr).getTime()) / 86400000);
              const days = Math.max(1, diffDays);
              const hours = days * 24;
              return (
                <div className="pt-1">
                  <span className="inline-flex px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-[11px] font-bold text-indigo-700">
                    Duration: {days} {days === 1 ? "Day" : "Days"} ({hours} Hours) from today
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Description (mandatory) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={assignNotes}
              onChange={(notesChangeEvent) => setAssignNotes(notesChangeEvent.target.value)}
              placeholder="Add instructions, focus areas, or deadline remarks for the employee(s)..."
              rows={3}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
            <Button onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button
              size="large"
              type="primary"
              loading={assignSubmitting}
              icon={<Send className="w-3.5 h-3.5" />}
              onClick={handleAssignReview}
              className="!bg-indigo-600 hover:!bg-indigo-700 !font-semibold !rounded-lg"
            >
              {assignMode === AssignTargetMode.ALL
                ? `Assign to All (${assignableEmployees.length})`
                : selectedEmployeeIds.length > 1
                  ? `Assign to ${selectedEmployeeIds.length} Members`
                  : "Assign Review"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Access Requests Modal ── */}
      <Modal
        open={accessRequestsOpen}
        onCancel={() => {
          setAccessRequestsOpen(false);
          setSelectedAccessRequest(null);
        }}
        footer={null}
        title={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <Key className="w-4 h-4 text-amber-600" />
            </div>
            <span className="font-extrabold text-[#2B3674] text-sm sm:text-base">
              {selectedAccessRequest ? "Review Access Request" : "Pending Access Requests"}
            </span>
          </div>
        }
        destroyOnClose
        centered
        width={560}
      >
        {board.accessRequestsLoading ? (
          <div className="flex justify-center py-10">
            <Spin tip="Loading access requests…" />
          </div>
        ) : (() => {
          // Build the list to display: prefer filtered array; fallback to selectedAccessRequest directly
          const filteredList = selectedAccessRequest
            ? (board.accessRequests || []).filter((r: any) => String(r.id) === String(selectedAccessRequest.id))
            : (board.accessRequests || []);
          const displayList = filteredList.length === 0 && selectedAccessRequest
            ? [selectedAccessRequest]
            : filteredList;
          return displayList;
        })().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mb-3" />
            <p className="font-semibold text-slate-700 text-sm">
              No pending access requests
            </p>
            <p className="text-slate-400 text-xs mt-1">
              All access requests have been actioned.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2 max-h-[75vh] overflow-y-auto">
            {selectedAccessRequest && (board.accessRequests || []).length > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
                <span>
                  Showing request for <strong>{selectedAccessRequest.employeeName || selectedAccessRequest.employeeId}</strong> ({selectedAccessRequest.quarter})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAccessRequest(null)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline text-xs"
                >
                  View all ({board.accessRequests?.length})
                </button>
              </div>
            )}
            {(() => {
              const filteredList = selectedAccessRequest
                ? (board.accessRequests || []).filter((r: any) => String(r.id) === String(selectedAccessRequest.id))
                : (board.accessRequests || []);
              return filteredList.length === 0 && selectedAccessRequest
                ? [selectedAccessRequest]
                : filteredList;
            })().map((req: any) => (
              <div
                key={req.id}
                className="flex flex-col gap-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                        {req.employeeName || `Employee #${req.employeeId}`}
                      </p>
                      {req.userRole && (
                        <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {req.userRole === RequestUserRole.MANAGER ? "Manager" : "Employee"}
                        </span>
                      )}
                      {(req.attemptNumber > 1 || req.attempt_number > 1) && (
                        <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          Attempt {req.attemptNumber || req.attempt_number} of 2 (Re-request)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      Quarter:{" "}
                      <span className="font-semibold text-slate-700">
                        {req.quarter}
                      </span>
                    </p>
                    {(req.reason || req.requestReason || req.description) && (
                      <p className="text-[11px] sm:text-xs text-slate-700 mt-1 italic bg-white/70 p-2 rounded-lg border border-amber-100">
                        "{req.reason || req.requestReason || req.description}"
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {req.requestedAt
                          ? new Date(req.requestedAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      size="small"
                      type="primary"
                      loading={actioningRequestId === req.id}
                      icon={<Check className="w-3 h-3" />}
                      onClick={() =>
                        handleAccessRequestAction(req.id, AccessRequestAction.APPROVE)
                      }
                      className="!bg-emerald-600 hover:!bg-emerald-700 !font-semibold !rounded-lg shadow-sm !text-xs"
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      danger
                      loading={actioningRequestId === req.id}
                      icon={<X className="w-3 h-3" />}
                      onClick={() =>
                        handleAccessRequestAction(req.id, AccessRequestAction.REJECT)
                      }
                      className="!font-semibold !rounded-lg !text-xs"
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                {/* Approver remarks / comment textarea */}
                <div className="pt-2 border-t border-amber-200/60">
                  <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 mb-1">
                    Approver Remarks / Comment: <span className="text-slate-400 font-normal">(Required if rejecting)</span>
                  </label>
                  <Input.TextArea
                    rows={2}
                    placeholder="Enter reason for rejection or approval remarks..."
                    value={actionComments[req.id] || ""}
                    onChange={(e) =>
                      setActionComments((prev) => ({
                        ...prev,
                        [req.id]: e.target.value,
                      }))
                    }
                    className="!text-xs !rounded-lg border-amber-300 focus:!border-amber-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Assignment Summary Modal (Mobile/Tablet Parity) ── */}
      <Modal
        open={board.assignmentListModalOpen}
        onCancel={() => board.setAssignmentListModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => board.setAssignmentListModalOpen(false)}>
            Close
          </Button>,
        ]}
        width={720}
        destroyOnClose
        centered
        title={
          <div className="flex items-center gap-2.5 pb-1">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                board.assignmentListType === AssignmentListType.NOT_ASSIGNED
                  ? "bg-amber-50 text-amber-600 border border-amber-200/60"
                  : "bg-violet-50 text-violet-600 border border-violet-200/60"
              }`}
            >
              {board.assignmentListType === AssignmentListType.NOT_ASSIGNED ? (
                <Clock className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {board.assignmentListType === AssignmentListType.NOT_ASSIGNED
                  ? `Employees Not Assigned – ${board.stats?.assignmentSummary?.quarter || board.selectedQuarterCard} ${board.stats?.assignmentSummary?.financialYear || board.selectedYear}`
                  : `Assigned Employees – ${board.stats?.assignmentSummary?.quarter || board.selectedQuarterCard} ${board.stats?.assignmentSummary?.financialYear || board.selectedYear}`}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
                {board.assignmentListType === AssignmentListType.NOT_ASSIGNED
                  ? `Employees who have NOT been assigned a review for this quarter (${board.stats?.assignmentSummary?.notAssignedCount ?? 0} members)`
                  : `Assigned employees (${board.stats?.assignmentSummary?.assignedCount ?? 0}) and members with pending quarters (${board.stats?.assignmentSummary?.singleQuarterCount ?? 0})`}
              </p>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                board.setAssignmentListType(AssignmentListType.ASSIGNED);
                board.setAssignedSubTab(AssignedSubTab.ALL);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                board.assignmentListType === AssignmentListType.ASSIGNED && board.assignedSubTab === AssignedSubTab.ALL
                  ? "bg-white text-violet-700 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>All Assigned</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-violet-100 text-violet-700 font-semibold">
                {board.stats?.assignmentSummary?.assignedCount ?? 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                board.setAssignmentListType(AssignmentListType.ASSIGNED);
                board.setAssignedSubTab(AssignedSubTab.SINGLE_QUARTER);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                board.assignmentListType === AssignmentListType.ASSIGNED && board.assignedSubTab === AssignedSubTab.SINGLE_QUARTER
                  ? "bg-white text-violet-700 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>1 Qtr (1 Pending)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-700 font-semibold">
                {board.stats?.assignmentSummary?.singleQuarterCount ?? 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                board.setAssignmentListType(AssignmentListType.NOT_ASSIGNED);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                board.assignmentListType === AssignmentListType.NOT_ASSIGNED
                  ? "bg-white text-amber-700 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Not Assigned</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-700 font-semibold">
                {board.stats?.assignmentSummary?.notAssignedCount ?? 0}
              </span>
            </button>
          </div>

          <Input
            prefix={<Search className="w-4 h-4 text-slate-400" />}
            placeholder="Search employee by name, ID, designation..."
            value={board.assignmentListSearch}
            onChange={(e) => board.setAssignmentListSearch(e.target.value)}
            allowClear
            className="!rounded-xl"
          />

          <div className="max-h-[55vh] overflow-y-auto">
            <Table
              dataSource={
                (board.assignmentListType === AssignmentListType.NOT_ASSIGNED
                  ? (board.stats?.assignmentSummary?.notAssignedEmployees || [])
                  : board.assignedSubTab === AssignedSubTab.SINGLE_QUARTER
                    ? (board.stats?.assignmentSummary?.singleQuarterEmployees || [])
                    : (board.stats?.assignmentSummary?.assignedEmployees || [])
                ).filter((emp: any) => {
                  if (!board.assignmentListSearch.trim()) return true;
                  const q = board.assignmentListSearch.toLowerCase();
                  return (
                    emp.employeeName?.toLowerCase().includes(q) ||
                    emp.employeeId?.toLowerCase().includes(q) ||
                    emp.designation?.toLowerCase().includes(q) ||
                    emp.department?.toLowerCase().includes(q)
                  );
                })
              }
              rowKey="employeeId"
              pagination={{ pageSize: 6, showSizeChanger: false }}
              size="small"
              columns={[
                {
                  title: "Employee",
                  dataIndex: "employeeName",
                  key: "employeeName",
                  render: (name: string, record: any) => (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {name ? name.slice(0, 2).toUpperCase() : "EM"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-xs truncate leading-snug">
                          {name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {record.employeeId} · {record.designation || "Member"}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Department",
                  dataIndex: "department",
                  key: "department",
                  render: (dept: string) => (
                    <span className="text-slate-600 text-xs font-medium">
                      {dept || "General"}
                    </span>
                  ),
                },
                ...(board.assignmentListType === AssignmentListType.NOT_ASSIGNED ? [
                  {
                    title: "Action",
                    key: "action",
                    render: (_: any, record: any) => (
                      <Button
                        size="small"
                        type="primary"
                        className="!bg-indigo-600 hover:!bg-indigo-700 !text-xs !font-semibold !rounded-lg"
                        onClick={() => {
                          board.setAssignmentListModalOpen(false);
                          setSelectedAssignMode(AssignTargetMode.INDIVIDUAL);
                          setAssignMode(AssignTargetMode.INDIVIDUAL);
                          setSelectedEmployeeIds([record.employeeId]);
                          setAssignModalOpen(true);
                        }}
                      >
                        Assign
                      </Button>
                    ),
                  }
                ] : []),
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagerReviewBoardMobile;