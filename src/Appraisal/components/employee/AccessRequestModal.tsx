import React, { useState, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  KeyRound,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { QuarterlyReviewAssignment, AccessRequest } from "../../types/appraisal.types";
import { Modal } from "../../../components/ui";
import "./AccessRequestModal.css";

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: QuarterlyReviewAssignment | null;
  remainingHours?: number;
  onSubmit: (request: AccessRequest) => void;
}

export const AccessRequestModal: React.FC<AccessRequestModalProps> = ({
  isOpen,
  onClose,
  assignment,
  remainingHours = 24,
  onSubmit,
}) => {
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDescription("");
      setError(null);
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen || !assignment) return null;

  const isAssignedByAdmin = assignment.assignedBy.trim().toLowerCase() === "admin";
  const recipientRole = isAssignedByAdmin ? "Admin" : "Manager";
  const recipientTitle = isAssignedByAdmin ? "System Administrator" : "Reporting Manager";

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      setError("Please write a brief description explaining why you need edit access.");
      return;
    }
    if (trimmed.length < 10) {
      setError("Please provide a bit more detail (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Run animation sequence
    setTimeout(() => {
      const newRequest: AccessRequest = {
        id: `req-${Date.now()}`,
        assignmentId: assignment.id,
        quarter: assignment.quarter,
        financialYear: assignment.financialYear,
        recipientRole: recipientRole,
        recipientName: isAssignedByAdmin ? "Central HR Admin" : "Reporting Manager",
        description: trimmed,
        reasonCategory: "Review Edit Request",
        requestedAt: new Date().toISOString(),
        status: "pending",
      };

      onSubmit(newRequest);
      setIsSubmitting(false);
      onClose();
    }, 450);
  };

  const modalTitle = (
    <div className="flex items-center gap-2.5">
      <div className="create-modal-header-icon">
        <KeyRound className="w-4 h-4 stroke-[2.5]" />
      </div>
      <div className="text-left">
        <h2 className="create-modal-title flex items-center gap-2">
          Request Review Access
          <span className="access-window-badge">
            <Clock className="w-2.5 h-2.5 inline mr-0.5" />
            {remainingHours}h left
          </span>
        </h2>
        <p className="create-modal-subtitle">
          Submit an edit request for your submitted {assignment.quarter} review
        </p>
      </div>
    </div>
  );

  const modalFooter = isSuccess ? null : (
    <div className="flex items-center justify-end gap-2.5 w-full">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="access-modal-cancel-btn"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={isSubmitting || !description.trim()}
        onClick={handleSubmit}
        className={`access-modal-submit-btn ${
          description.trim() ? "is-active" : "is-disabled"
        } ${isSubmitting ? "is-animating opacity-90" : ""}`}
      >
        {isSubmitting ? (
          <>
            <Send className="w-3.5 h-3.5 access-icon-launching mr-1.5" />
            Routing Request...
          </>
        ) : (
          <>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Send Access Request
          </>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={modalTitle}
      footer={modalFooter}
      maxWidth="lg"
      overlayClassName="create-assignment-modal-overlay"
      closeBtnClassName="create-modal-close-btn"
      closeOnBackdrop={false}
      closeOnEsc={false}
      className="create-assignment-modal-dialog access-modal-dialog"
    >
      {isSuccess ? (
        /* SUCCESS STATE */
        <div className="py-5 px-3 text-center access-success-box space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#EFF6FF] border-2 border-[#2563EB] flex items-center justify-center text-[#2563EB] mx-auto shadow-md">
            <CheckCircle2 className="w-7 h-7 access-icon-check" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0F172A]">
              Access Request Forwarded!
            </h4>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto mt-0.5 leading-relaxed">
              Dispatched directly to your{" "}
              <strong className="text-[#2563EB]">{recipientTitle}</strong> for{" "}
              <strong className="text-[#0F172A]">{assignment.quarter} ({assignment.financialYear})</strong>.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
            <Sparkles className="w-3 h-3" />
            Status: Pending Approval
          </div>
        </div>
      ) : (
        /* FORM BODY */
        <div className="space-y-2.5 pt-0.5">
          {/* Target Authority Routing Banner */}
          <div className="access-target-banner flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-2xs shrink-0">
                {isAssignedByAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] whitespace-nowrap leading-tight">
                  Routed Recipient ({assignment.quarter})
                </div>
                <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 whitespace-nowrap leading-tight mt-0.5">
                  <span>{recipientTitle}</span>
                  <span className="text-[11px] text-[#64748B] font-normal">
                    ({assignment.financialYear})
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="inline-flex items-center text-[10.5px] px-2.5 py-0.5 rounded-md font-semibold bg-white border border-[#BFDBFE] text-[#1D4ED8] whitespace-nowrap shadow-2xs">
                Assigned by {assignment.assignedBy}
              </span>
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="access-description-input"
                className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                Reason / Description <span className="text-[#2563EB]">*</span>
              </label>
              <span className="text-[10.5px] text-[#94A3B8]">
                {description.length} / 500 characters
              </span>
            </div>

            <textarea
              id="access-description-input"
              rows={2}
              maxLength={500}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Provide a clear explanation for why you require re-open or edit access to this submitted review..."
              className={`access-textarea-field ${error ? "is-error" : ""}`}
              disabled={isSubmitting}
            />

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* One-day Notice Box */}
          <div className="py-1.5 px-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]/60 flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
            <p className="text-[10.5px] text-[#64748B] leading-tight">
              Edit requests can only be sent within <strong className="text-[#0F172A]">24 hours</strong> of submission. Approved requests unlock the review for adjustments.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AccessRequestModal;
