import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { message, Modal, Popconfirm } from "antd";
import dayjs from "dayjs";
import {
  createResignation,
  fetchResignationsByEmployee,
  fetchResignationById,
  withdrawResignation,
  clearError,
  clearSubmitSuccess,
  Resignation as ResignationEntity,
} from "../reducers/resignation.reducer";
import { ResignationViewPage } from "../components/ResignationViewPage";
import { getLeaveRequestEmailConfig } from "../reducers/leaveRequest.reducer";
import { getManagerMappingByEmployeeId } from "../reducers/managerMapping.reducer";
import { getEntity } from "../reducers/employeeDetails.reducer";
import { ResignationStatus } from "../enums";
import {
  Calendar,
  FileText,
  Loader2,
  LogOut,
  User,
  Briefcase,
  ClipboardList,
  Mail,
} from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REASON_MAX = 2000;
const COMMENTS_MAX = 1000;

const REASON_OPTIONS = [
  "Better opportunity",
  "Personal reasons",
  "Health reasons",
  "Relocation",
  "Retirement",
  "Career change",
  "Other",
];

const statusBadgeClass: Record<string, string> = {
  [ResignationStatus.PENDING_MANAGER]: "bg-amber-100 text-amber-800 border-amber-300",
  [ResignationStatus.PENDING_HR_ADMIN]: "bg-indigo-100 text-indigo-800 border-indigo-300",
  [ResignationStatus.APPROVED]: "bg-green-100 text-green-800 border-green-300",
  [ResignationStatus.REJECTED]: "bg-red-100 text-red-800 border-red-300",
  [ResignationStatus.WITHDRAWN]: "bg-gray-100 text-gray-700 border-gray-300",
};

const statusLabel: Record<string, string> = {
  [ResignationStatus.PENDING_MANAGER]: "Pending Manager Review",
  [ResignationStatus.MANAGER_APPROVED]: "Manager Approved",
  [ResignationStatus.MANAGER_REJECTED]: "Manager Rejected",
  [ResignationStatus.PENDING_HR_ADMIN]: "Pending HR/Admin Review",
  [ResignationStatus.APPROVED]: "Approved",
  [ResignationStatus.REJECTED]: "Rejected",
  [ResignationStatus.WITHDRAWN]: "Withdrawn",
};

const Field = ({
  label,
  value,
  required,
  children,
  className = "",
}: {
  label: string;
  value?: React.ReactNode;
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
}) => (
  <div className={className}>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children ?? (
      <div className="px-4 py-2.5 rounded-xl bg-[#F4F7FE] text-[#2B3674] font-medium text-sm border border-[#E0E7FF]">
        {value ?? "—"}
      </div>
    )}
  </div>
);

const Resignation = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const managerMappingEntity = useAppSelector((state) => state.managerMapping.entity);
  const {
    myResignations,
    loading,
    listLoading,
    error,
    submitSuccess,
  } = useAppSelector((state) => state.resignation);

  const employeeId = currentUser?.employeeId || currentUser?.loginId || "";

  const [resignationDate, setResignationDate] = useState("");
  const [reasonDropdown, setReasonDropdown] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [comments, setComments] = useState("");
  const [handoverTo, setHandoverTo] = useState("");
  const [handoverDescription, setHandoverDescription] = useState("");
  const [emailConfig, setEmailConfig] = useState<{
    assignedManagerEmail: string | null;
    hrEmail: string | null;
  }>({ assignedManagerEmail: null, hrEmail: null });
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccEmailInput, setCcEmailInput] = useState("");
  const [ccEmailError, setCcEmailError] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [viewDetails, setViewDetails] = useState<ResignationEntity | null>(null);
  const [viewDetailLoading, setViewDetailLoading] = useState(false);
  const initialViewSet = useRef(false);

  useEffect(() => {
    if (employeeId) {
      dispatch(getEntity(employeeId));
      dispatch(fetchResignationsByEmployee(employeeId));
      dispatch(getManagerMappingByEmployeeId(employeeId));
      dispatch(getLeaveRequestEmailConfig(employeeId))
        .then((result) => {
          if (getLeaveRequestEmailConfig.fulfilled.match(result)) {
            const data = result.payload as { assignedManagerEmail?: string | null; hrEmail?: string | null };
            setEmailConfig({
              assignedManagerEmail: data?.assignedManagerEmail ?? null,
              hrEmail: data?.hrEmail ?? null,
            });
          }
        })
        .catch(() => setEmailConfig({ assignedManagerEmail: null, hrEmail: null }));
    }
  }, [dispatch, employeeId]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const hasActiveResignation =
    Array.isArray(myResignations) &&
    myResignations.some(
      (r) =>
        r.status === ResignationStatus.PENDING_MANAGER ||
        r.status === ResignationStatus.PENDING_HR_ADMIN ||
        r.status === ResignationStatus.APPROVED
    );
  const hasApprovedResignation =
    Array.isArray(myResignations) &&
    myResignations.some((r) => r.status === ResignationStatus.APPROVED);

  // After first load: if user has pending/approved, keep list; else show form so they can apply.
  useEffect(() => {
    if (listLoading || initialViewSet.current) return;
    initialViewSet.current = true;
    setViewMode(hasActiveResignation ? "list" : "form");
  }, [listLoading, hasActiveResignation]);

  useEffect(() => {
    if (submitSuccess) {
      message.success("Resignation submitted successfully.");
      dispatch(clearSubmitSuccess());
      setResignationDate("");
      setReasonDropdown("");
      setReasonText("");
      setComments("");
      setHandoverTo("");
      setHandoverDescription("");
      setCcEmails([]);
      setCcEmailInput("");
      setViewMode("list");
      if (employeeId) dispatch(fetchResignationsByEmployee(employeeId));
    }
  }, [submitSuccess, dispatch, employeeId]);

  const addCcEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!emailRegex.test(trimmed)) {
      setCcEmailError("Please enter a valid email address.");
      return;
    }
    setCcEmailError("");
    if (!ccEmails.includes(trimmed)) setCcEmails([...ccEmails, trimmed]);
    setCcEmailInput("");
  };
  const removeCcEmail = (email: string) => setCcEmails(ccEmails.filter((e) => e !== email));

  const reasonForApi =
    reasonDropdown === "Other" || !REASON_OPTIONS.includes(reasonDropdown)
      ? reasonText.trim()
      : reasonDropdown + (reasonText.trim() ? `: ${reasonText.trim()}` : "");

  const handleSubmit = () => {
    if (!employeeId) {
      message.error("Employee ID not found.");
      return;
    }
    if (!resignationDate) {
      message.error("Resignation Date is required.");
      return;
    }
    if (!reasonForApi.trim()) {
      message.error("Please select or enter Reason for Resignation.");
      return;
    }
    if (reasonForApi.length > REASON_MAX) {
      message.error(`Reason must be at most ${REASON_MAX} characters.`);
      return;
    }
    if (ccEmails.length > 10) {
      message.error("You can add at most 10 CC emails.");
      return;
    }
    dispatch(
      createResignation({
        employeeId,
        submittedDate: resignationDate,
        reason: reasonForApi,
        ...(comments.trim() && { comments: comments.trim() }),
        ...(handoverTo.trim() && { handoverTo: handoverTo.trim() }),
        ...(handoverDescription.trim() && {
          handoverDescription: handoverDescription.trim(),
        }),
        ...(ccEmails.length > 0 && { ccEmails }),
      })
    );
  };

  const handleWithdraw = (id: number) => {
    dispatch(withdrawResignation(id)).then((result) => {
      if (withdrawResignation.fulfilled.match(result)) {
        message.success("Resignation withdrawn.");
        if (employeeId) dispatch(fetchResignationsByEmployee(employeeId));
      }
    });
  };

  const empName =
    entity?.fullName ||
    entity?.aliasLoginName ||
    currentUser?.name ||
    currentUser?.aliasLoginName ||
    "—";
  const department = entity?.department ?? "—";
  const designation = entity?.designation ?? entity?.role ?? "—";
  const mappingItem = Array.isArray(managerMappingEntity)
    ? managerMappingEntity[0]
    : managerMappingEntity;
  const reportingManager =
    mappingItem?.managerName ??
    (mappingItem as any)?.manager_name ??
    entity?.reportingManager ??
    entity?.managerName ??
    "—";

  const openResignationView = async (r: ResignationEntity) => {
    setViewDetails(r);
    setViewDetailLoading(true);
    const result = await dispatch(fetchResignationById(r.id));
    setViewDetailLoading(false);
    if (fetchResignationById.fulfilled.match(result)) {
      const p = result.payload as ResignationEntity;
      setViewDetails({
        ...p,
        fullName: p.fullName || empName,
        department: p.department || department,
        designation: p.designation || designation,
      });
    } else {
      message.warning("Could not refresh details from server; showing list data.");
      setViewDetails({
        ...r,
        fullName: r.fullName || empName,
        department: r.department || department,
        designation: r.designation || designation,
      });
    }
  };

  return (
    <div className="p-4 md:px-8 md:pb-8 bg-[#F4F7FE] min-h-screen font-sans text-[#2B3674]">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-[#2B3674] flex items-center gap-2">
            <FileText className="text-[#4318FF]" size={28} />
            Resignation
          </h1>
          {viewMode === "list" ? (
            !hasApprovedResignation ? (
            <button
              type="button"
              onClick={() => setViewMode("form")}
              className="px-5 py-2.5 bg-[#4318FF] text-white rounded-xl font-bold shadow-lg hover:bg-[#3311CC] transition-all flex items-center gap-2"
            >
              <FileText size={18} />
              Add Resignation
            </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const approved = myResignations.find(
                    (x) => x.status === ResignationStatus.APPROVED
                  );
                  if (approved) void openResignationView(approved);
                }}
                className="px-5 py-2.5 bg-[#E9EDFF] text-[#2B3674] rounded-xl font-bold border border-[#CFD8FF] hover:bg-[#dbe4ff] transition-all"
              >
                View Resignation Details
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="px-4 py-2 rounded-xl border border-[#E0E7FF] bg-white text-[#2B3674] font-medium hover:bg-[#F4F7FE] transition-all"
            >
              Back to list
            </button>
          )}
        </div>

        {viewMode === "list" ? (
          /* List view: My Resignations table only */
          <div className="rounded-2xl border border-[#E0E7FF] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#2B3674] mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-[#4318FF]" />
              My Resignations
            </h2>
            {listLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={32} className="animate-spin text-[#4318FF]" />
              </div>
            ) : myResignations.length === 0 ? (
              <p className="text-gray-500 py-6">No resignations submitted yet. Click &quot;Add Resignation&quot; to apply.</p>
            ) : (
              <div className="space-y-3">
                {myResignations.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#F4F7FE] border border-[#E0E7FF]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#2B3674]">
                        Submitted: {dayjs(r.submittedDate).format("DD-MM-YYYY")}{" "}
                        {(r.noticePeriodEndDate || r.approvalEndDate || r.proposedLastWorkingDate)
                          ? `→ Notice end: ${dayjs(r.noticePeriodEndDate || r.approvalEndDate || r.proposedLastWorkingDate).format("DD-MM-YYYY")}`
                          : ""}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeClass[r.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {statusLabel[r.status] || r.status}
                      </span>
                      {r.status === ResignationStatus.PENDING_MANAGER && (
                        <Popconfirm
                          title="Withdraw resignation?"
                          description="This will withdraw your pending resignation. You can submit a new one later."
                          onConfirm={() => handleWithdraw(r.id)}
                          okText="Withdraw"
                          cancelText="Cancel"
                        >
                          <button
                            type="button"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 text-sm font-bold hover:bg-amber-200 transition-all"
                          >
                            <LogOut size={14} />
                            Withdraw
                          </button>
                        </Popconfirm>
                      )}
                      <button
                        type="button"
                        onClick={() => void openResignationView(r)}
                        className="px-3 py-1.5 rounded-xl bg-[#E9EDFF] text-[#2B3674] border border-[#CFD8FF] text-sm font-bold hover:bg-[#dbe4ff] transition-all"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
        {/* 1. Basic Employee Details */}
        <div className="rounded-2xl border border-[#E0E7FF] bg-white p-6 shadow-sm mb-6">
          <h2 className="text-base font-bold text-[#2B3674] mb-4 flex items-center gap-2">
            <User size={20} className="text-[#4318FF]" />
            Basic Employee Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Employee ID" value={entity?.employeeId || employeeId || "—"} />
            <Field label="Employee Name" value={empName} />
            <Field label="Department" value={department} />
            <Field label="Designation" value={designation} />
            <Field label="Reporting Manager" value={reportingManager} className="sm:col-span-2" />
          </div>
        </div>

        {/* Email recipients */}
        <div className="rounded-2xl border border-[#E0E7FF] bg-[#F8FAFC] p-6 shadow-sm mb-6">
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#2B3674] flex items-center gap-2">
              <Mail size={20} className="text-[#4318FF]" />
              Email recipients
            </h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-start">
                {emailConfig.assignedManagerEmail && (
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-gray-600 ml-1 block mb-1">Assigned Manager</span>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={emailConfig.assignedManagerEmail}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-gray-600 ml-1 block mb-1">HR</span>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={emailConfig.hrEmail || ""}
                    placeholder="Not configured"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600 ml-1 block mb-1">CC</span>
                <div className="flex flex-wrap gap-2 items-center">
                  {ccEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 text-sm font-medium"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeCcEmail(email)}
                        className="text-gray-500 hover:text-red-600 focus:outline-none"
                        aria-label={`Remove ${email}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={ccEmailInput}
                    onChange={(e) => {
                      setCcEmailInput(e.target.value);
                      if (ccEmailError) setCcEmailError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "," || e.key === " ") {
                        e.preventDefault();
                        addCcEmail(ccEmailInput);
                      }
                    }}
                    onBlur={() => addCcEmail(ccEmailInput)}
                    placeholder="Add email and press Enter"
                    className="min-w-[200px] flex-1 px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 text-sm placeholder-gray-400 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none"
                  />
                  {ccEmailError && (
                    <p className="text-red-500 text-xs mt-1 ml-1 w-full">{ccEmailError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Resignation Details */}
        <div className="rounded-2xl border border-[#E0E7FF] bg-white p-6 shadow-sm mb-6">
          <h2 className="text-base font-bold text-[#2B3674] mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-[#4318FF]" />
            Resignation Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Resignation Date (date employee submits resignation)" required>
              <input
                type="date"
                value={resignationDate}
                onChange={(e) => setResignationDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F4F7FE] text-[#2B3674] focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none text-sm"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Reason for Resignation" required>
                <div className="space-y-2">
                  <select
                    value={reasonDropdown}
                    onChange={(e) => setReasonDropdown(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F4F7FE] text-[#2B3674] focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none text-sm"
                  >
                    <option value="">Select reason</option>
                    {REASON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder={
                      reasonDropdown === "Other"
                        ? "Please specify..."
                        : "Additional details (optional)"
                    }
                    maxLength={REASON_MAX}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F4F7FE] text-[#2B3674] placeholder:text-gray-400 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    {(reasonDropdown === "Other" ? reasonText : reasonDropdown + (reasonText ? ": " + reasonText : "")).length} / {REASON_MAX}
                  </p>
                </div>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Comments / Additional Remarks">
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  maxLength={COMMENTS_MAX}
                  rows={3}
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F4F7FE] text-[#2B3674] placeholder:text-gray-400 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{comments.length} / {COMMENTS_MAX}</p>
              </Field>
            </div>
          </div>
        </div>

        {/* 3. Work Handover Details */}
        <div className="rounded-2xl border border-[#E0E7FF] bg-white p-6 shadow-sm mb-6">
          <h2 className="text-base font-bold text-[#2B3674] mb-4 flex items-center gap-2">
            <ClipboardList size={20} className="text-[#4318FF]" />
            Work Handover Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Handover To (Employee Name / ID)">
              <input
                type="text"
                value={handoverTo}
                onChange={(e) => setHandoverTo(e.target.value)}
                placeholder="Employee name or ID"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F4F7FE] text-[#2B3674] placeholder:text-gray-400 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none text-sm"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Handover Description">
                <textarea
                  value={handoverDescription}
                  onChange={(e) => setHandoverDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F4F7FE] text-[#2B3674] placeholder:text-gray-400 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none text-sm resize-none"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col items-end gap-2 mb-8">
          {hasActiveResignation && (
            <p className="text-amber-700 text-sm font-medium w-full">
              You already have a pending or approved resignation. Withdraw or wait for rejection before submitting again.
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || hasActiveResignation}
            className="px-6 py-2.5 bg-[#4318FF] text-white rounded-xl font-bold shadow-lg hover:bg-[#3311CC] transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            Submit Resignation
          </button>
        </div>

        {/* My Resignations (in form view) */}
        <div className="rounded-2xl border border-[#E0E7FF] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#2B3674] mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-[#4318FF]" />
            My Resignations
          </h2>
          {listLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={32} className="animate-spin text-[#4318FF]" />
            </div>
          ) : myResignations.length === 0 ? (
            <p className="text-gray-500 py-6">No resignations submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {myResignations.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#F4F7FE] border border-[#E0E7FF]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#2B3674]">
                      Submitted: {dayjs(r.submittedDate).format("DD-MM-YYYY")}{" "}
                      {(r.noticePeriodEndDate || r.approvalEndDate || r.proposedLastWorkingDate)
                        ? `→ Notice end: ${dayjs(r.noticePeriodEndDate || r.approvalEndDate || r.proposedLastWorkingDate).format("DD-MM-YYYY")}`
                        : ""}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.reason}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeClass[r.status] || "bg-gray-100 text-gray-700"}`}
                    >
                      {statusLabel[r.status] || r.status}
                    </span>
                    {r.status === ResignationStatus.PENDING_MANAGER && (
                      <Popconfirm
                        title="Withdraw resignation?"
                        description="This will withdraw your pending resignation. You can submit a new one later."
                        onConfirm={() => handleWithdraw(r.id)}
                        okText="Withdraw"
                        cancelText="Cancel"
                      >
                        <button
                          type="button"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 text-sm font-bold hover:bg-amber-200 transition-all"
                        >
                          <LogOut size={14} />
                          Withdraw
                        </button>
                      </Popconfirm>
                    )}
                    <button
                      type="button"
                      onClick={() => void openResignationView(r)}
                      className="px-3 py-1.5 rounded-xl bg-[#E9EDFF] text-[#2B3674] border border-[#CFD8FF] text-sm font-bold hover:bg-[#dbe4ff] transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </div>
      <Modal
        title={
          <span className="text-lg font-bold text-[#2B3674]">Resignation view</span>
        }
        open={!!viewDetails}
        onCancel={() => {
          setViewDetails(null);
          setViewDetailLoading(false);
        }}
        footer={null}
        width={840}
        destroyOnClose
        classNames={{ body: "!pt-2 !pb-6 !px-5" }}
      >
        {viewDetailLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#4318FF]" size={32} />
          </div>
        )}
        {viewDetails && !viewDetailLoading && (
          <ResignationViewPage
            record={viewDetails}
            statusLabel={statusLabel}
            statusBadgeClass={statusBadgeClass}
            extras={{
              reportingManager,
              assignedManagerEmailFallback: emailConfig.assignedManagerEmail,
              hrEmailFallback: emailConfig.hrEmail,
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default Resignation;
