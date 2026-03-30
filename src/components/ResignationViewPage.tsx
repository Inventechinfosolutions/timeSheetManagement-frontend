import dayjs from "dayjs";
import {
  Mail,
  User,
  ClipboardList,
  Calendar,
  CheckCircle,
  Building2,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import type { Resignation } from "../reducers/resignation.reducer";

export type ResignationViewPageExtras = {
  reportingManager?: string;
  assignedManagerEmailFallback?: string | null;
  hrEmailFallback?: string | null;
};

type StatusLabelMap = Record<string, string>;

function pickCcEmails(r: Resignation & Record<string, unknown>): string[] {
  const raw = r.ccEmails ?? r.cc_emails;
  if (Array.isArray(raw)) return raw.map((e) => String(e).trim()).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function pickEmployeeSubmissionComments(r: Resignation & Record<string, unknown>): string | null {
  const ec =
    r.employeeComments ??
    r.submissionComments ??
    (r as { employee_comments?: string }).employee_comments;
  if (typeof ec === "string" && ec.trim()) return ec.trim();
  if (r.comments && typeof r.comments === "string" && r.comments.trim()) return r.comments.trim();
  return null;
}

/** Manager/final metadata status — show friendly text; MANAGER_APPROVED → green “Approved”. */
function formatStageStatusDisplay(raw: string | null | undefined): React.ReactNode {
  if (raw == null || String(raw).trim() === "") return "—";
  const key = String(raw).trim().toUpperCase().replace(/\s+/g, "_");
  if (key === "MANAGER_APPROVED" || key === "APPROVED") {
    return (
      <span className="text-green-600 font-semibold whitespace-nowrap">Approved</span>
    );
  }
  if (key === "MANAGER_REJECTED" || key === "REJECTED") {
    return (
      <span className="text-red-600 font-semibold whitespace-nowrap">Rejected</span>
    );
  }
  return (
    <span className="break-words normal-case">
      {key.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

const Field = ({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={className}>
    <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
      {label}
    </dt>
    <dd className="text-sm font-medium text-[#2B3674] leading-relaxed">{children}</dd>
  </div>
);

const FieldBox = ({
  label,
  value,
  multiline,
}: {
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
}) => (
  <div>
    <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
      {label}
    </dt>
    <dd
      className={`text-sm font-medium text-[#2B3674] px-4 py-3 rounded-xl bg-[#F4F7FE] border border-[#E0E7FF] ${
        multiline ? "whitespace-pre-wrap min-h-[3rem]" : ""
      }`}
    >
      {value ?? "—"}
    </dd>
  </div>
);

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  accent = "violet",
  children,
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  subtitle?: string;
  accent?: "violet" | "blue" | "emerald" | "amber";
}) {
  const accentBar = {
    violet: "from-[#4318FF] to-[#868CFF]",
    blue: "from-[#2563EB] to-[#60A5FA]",
    emerald: "from-[#059669] to-[#34D399]",
    amber: "from-[#D97706] to-[#FBBF24]",
  }[accent];

  return (
    <section className="rounded-2xl border border-[#E8ECF9] bg-white shadow-sm overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${accentBar}`} aria-hidden />
      <div className="px-5 pt-4 pb-1 border-b border-[#F0F3FA] bg-gradient-to-b from-[#FAFBFF] to-white">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4318FF]/10 text-[#4318FF]">
            <Icon size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#2B3674] tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/**
 * Read-only resignation view — full form mirror + workflow + notice. Use inside a modal or route.
 */
export function ResignationViewPage({
  record,
  statusLabel,
  statusBadgeClass,
  extras,
}: {
  record: Resignation;
  statusLabel: StatusLabelMap;
  statusBadgeClass: Record<string, string>;
  extras?: ResignationViewPageExtras;
}) {
  const x = record as Resignation & Record<string, unknown>;
  const ccList = pickCcEmails(x);
  const managerEmail =
    record.assignedManagerEmail ??
    (x.assigned_manager_email as string | undefined) ??
    extras?.assignedManagerEmailFallback ??
    null;
  const hrEmail =
    record.hrEmail ?? (x.hr_email as string | undefined) ?? extras?.hrEmailFallback ?? null;
  const handoverTo = record.handoverTo ?? (x.handover_to as string | undefined) ?? null;
  const handoverDescription =
    record.handoverDescription ?? (x.handover_description as string | undefined) ?? null;
  const submissionComments = pickEmployeeSubmissionComments(x);

  const noticeStart = record.noticePeriodStartDate || record.approvalStartDate;
  const noticeEnd =
    record.noticePeriodEndDate || record.approvalEndDate || record.proposedLastWorkingDate;

  const reportingMgr =
    extras?.reportingManager ??
    (typeof x.reportingManager === "string" ? x.reportingManager : null) ??
    "—";

  return (
    <div className="max-h-[75vh] overflow-y-auto pr-1 -mx-1 px-1 space-y-5 text-[#2B3674]">
      {/* Summary strip */}
      <div className="rounded-2xl border border-[#E0E7FF] bg-gradient-to-br from-[#4318FF]/[0.06] via-white to-[#868CFF]/[0.08] p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md border border-[#E8ECF9] text-[#4318FF]">
              <User size={28} strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-[#2B3674] truncate">
                {record.fullName || "Employee"}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                <span className="font-semibold text-[#2B3674]">{record.employeeId}</span>
                {record.department ? (
                  <>
                    <span className="mx-2 text-gray-300">·</span>
                    <span>{record.department}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${
                statusBadgeClass[record.status] || "bg-gray-100 text-gray-700 border-gray-200"
              }`}
            >
              {statusLabel[record.status] || record.status}
            </span>
            <p className="text-xs text-gray-500">
              Submitted{" "}
              <span className="font-semibold text-[#2B3674]">
                {record.submittedDate ? dayjs(record.submittedDate).format("DD MMM YYYY") : "—"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <SectionCard
        icon={Building2}
        title="Employee details"
        subtitle="Identity and reporting line"
        accent="violet"
      >
        <dl className="grid gap-5 sm:grid-cols-2">
          <FieldBox label="Employee ID" value={record.employeeId} />
          <FieldBox label="Full name" value={record.fullName ?? "—"} />
          <FieldBox label="Department" value={record.department ?? "—"} />
          <FieldBox label="Designation" value={record.designation ?? "—"} />
          <div className="sm:col-span-2">
            <FieldBox label="Reporting manager" value={reportingMgr} />
          </div>
        </dl>
      </SectionCard>

      <SectionCard
        icon={Calendar}
        title="Resignation submission"
        subtitle="What the employee submitted"
        accent="blue"
      >
        <dl className="grid gap-5 sm:grid-cols-2">
          <FieldBox
            label="Resignation date"
            value={
              record.submittedDate ? dayjs(record.submittedDate).format("DD-MM-YYYY") : "—"
            }
          />
          <Field label="Workflow status">
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                statusBadgeClass[record.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {statusLabel[record.status] || record.status}
            </span>
          </Field>
          <div className="sm:col-span-2">
            <FieldBox label="Reason for resignation" value={record.reason} multiline />
          </div>
          <div className="sm:col-span-2">
            <FieldBox
              label="Comments / additional remarks"
              value={submissionComments}
              multiline
            />
          </div>
          {record.noticePeriod != null && (
            <FieldBox label="Notice period (submitted)" value={`${record.noticePeriod} days`} />
          )}
        </dl>
      </SectionCard>

      <SectionCard
        icon={ClipboardList}
        title="Work handover"
        subtitle="Handover assignment and notes"
        accent="amber"
      >
        <dl className="grid gap-5 sm:grid-cols-2">
          <FieldBox label="Handover to" value={handoverTo} />
          <div className="sm:col-span-2">
            <FieldBox label="Handover description" value={handoverDescription} multiline />
          </div>
        </dl>
      </SectionCard>

      <SectionCard
        icon={Mail}
        title="Email recipients"
        subtitle="Notification targets (read-only)"
        accent="violet"
      >
        <dl className="grid gap-5 sm:grid-cols-2">
          <FieldBox label="Assigned manager" value={managerEmail || "—"} />
          <FieldBox label="HR" value={hrEmail || "—"} />
          <div className="sm:col-span-2">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              CC
            </dt>
            <dd>
              <div className="flex flex-wrap gap-2 min-h-[3rem] px-4 py-3 rounded-xl bg-[#F4F7FE] border border-[#E0E7FF]">
                {ccList.length ? (
                  ccList.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-[#CFD8FF] text-xs font-semibold text-[#2B3674] shadow-sm"
                    >
                      {email}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No CC addresses</span>
                )}
              </div>
            </dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard
        icon={CheckCircle}
        title="Notice period"
        subtitle="Set after HR/Admin final approval"
        accent="emerald"
      >
        <dl className="grid gap-5 sm:grid-cols-3">
          <FieldBox
            label="Start date"
            value={noticeStart ? dayjs(noticeStart).format("DD-MM-YYYY") : "—"}
          />
          <FieldBox
            label="End date"
            value={noticeEnd ? dayjs(noticeEnd).format("DD-MM-YYYY") : "—"}
          />
          <FieldBox
            label="Duration"
            value={
              record.noticePeriodDays != null
                ? `${record.noticePeriodDays} day(s)`
                : "—"
            }
          />
        </dl>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          icon={UserCheck}
          title="Manager review"
          subtitle="First approval stage"
          accent="blue"
        >
          <dl className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldBox
                label="Status"
                value={formatStageStatusDisplay(record.managerStatus)}
              />
              <FieldBox label="Reviewed by" value={record.managerReviewedBy ?? "—"} />
            </div>
            <FieldBox
              label="Reviewed at"
              value={
                record.managerReviewedAt
                  ? dayjs(record.managerReviewedAt).format("DD-MM-YYYY HH:mm")
                  : "—"
              }
            />
            <FieldBox label="Remarks" value={record.managerComments} multiline />
          </dl>
        </SectionCard>

        <SectionCard
          icon={ShieldCheck}
          title="HR / Admin (final)"
          subtitle="Final decision and notice dates"
          accent="emerald"
        >
          <dl className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldBox
                label="Final status"
                value={formatStageStatusDisplay(record.finalStatus)}
              />
              <FieldBox label="Reviewed by" value={record.finalReviewedBy ?? "—"} />
            </div>
            <FieldBox
              label="Reviewed at"
              value={
                record.finalReviewedAt
                  ? dayjs(record.finalReviewedAt).format("DD-MM-YYYY HH:mm")
                  : "—"
              }
            />
            <FieldBox label="Final remarks" value={record.finalComments} multiline />
          </dl>
        </SectionCard>
      </div>

      <p className="text-center text-[11px] text-gray-400 pb-1">
        This is a read-only summary. Edits are not available from this view.
      </p>
    </div>
  );
}
