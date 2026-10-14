import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Send,
  CheckCircle2,
  Clock,
  User,
  FileText,
  AlertCircle,
  Sparkles,
  X,
} from "lucide-react";
import { Modal } from "../../../components/ui";
import { QuarterlyReviewAssignment, AccessRequest } from "../../types/appraisal.types";
import "./AccessRequestModal.css";

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: QuarterlyReviewAssignment | null;
  remainingHours?: number;
  onSubmit: (request: AccessRequest) => void;
  isReadOnly?: boolean;
  requestDetails?: AccessRequest | null;
}

/**
 * 3D Isometric SVG Illustration of Review Document, Attached Clock Badge & Pen
 * Crafted with pure SVG vectors & gradient shading with living GSAP physics
 */
const AccessRequest3DIllustration: React.FC = () => (
  <svg
    viewBox="0 0 240 210"
    className="w-40 sm:w-44 h-auto drop-shadow-xl overflow-visible mx-auto select-none"
  >

    <defs>
      {/* Background Soft Glow Aura */}
      <radialGradient id="accessGlowAura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
        <stop offset="60%" stopColor="#BAE6FD" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0" />
      </radialGradient>

      {/* Document Gradients */}
      <linearGradient id="accessPaperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F8FAFC" />
      </linearGradient>
      <linearGradient id="accessPaperBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#BFDBFE" />
        <stop offset="100%" stopColor="#93C5FD" />
      </linearGradient>

      {/* Avatar Gradient */}
      <linearGradient id="accessAvatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DBEAFE" />
        <stop offset="100%" stopColor="#BFDBFE" />
      </linearGradient>

      {/* Pen Gradients */}
      <linearGradient id="accessPenBody" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="50%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="accessPenCone" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>

      {/* Clock Gradients */}
      <linearGradient id="accessClockRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="accessClockFace" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="100%" stopColor="#FEF3C7" />
      </linearGradient>

      {/* Drop Shadows */}
      <filter id="accessDocShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0369A1" floodOpacity="0.16" />
      </filter>
    </defs>

    {/* Ambient Glow */}
    <circle cx="120" cy="110" r="90" fill="url(#accessGlowAura)" />

    {/* Dynamic Ground Contact Shadow */}
    <ellipse cx="116" cy="192" rx="64" ry="10" fill="#0369A1" opacity="0.16" className="access-gsap-shadow" />

    {/* Floating Document Assembly */}
    <g className="access-gsap-doc">
      <g transform="rotate(-3 116 112)">
        {/* Document Sheet */}
        <rect
          x="46"
          y="28"
          width="128"
          height="154"
          rx="16"
          fill="url(#accessPaperGrad)"
          stroke="url(#accessPaperBorder)"
          strokeWidth="1.2"
          filter="url(#accessDocShadow)"
        />

        {/* User Profile Header in Document */}
        <circle cx="72" cy="56" r="14" fill="url(#accessAvatarGrad)" stroke="#93C5FD" strokeWidth="0.8" />
        <circle cx="72" cy="52" r="5" fill="#2563EB" />
        <path d="M 64 65 C 64 60 68 59 72 59 C 76 59 80 60 80 65 Z" fill="#2563EB" />

        {/* Title Bar Placeholders */}
        <rect x="94" y="50" width="62" height="7" rx="3.5" fill="#93C5FD" opacity="0.8" />
        <rect x="94" y="61" width="42" height="5" rx="2.5" fill="#BFDBFE" opacity="0.65" />

        {/* Review Form Content Lines */}
        <rect x="62" y="80" width="94" height="6" rx="3" fill="#E2E8F0" />
        <rect x="62" y="93" width="86" height="6" rx="3" fill="#E2E8F0" />
        <rect x="62" y="106" width="74" height="6" rx="3" fill="#E2E8F0" />
        <rect x="62" y="119" width="58" height="6" rx="3" fill="#CBD5E1" opacity="0.8" />

        {/* Signature Squiggle Wave */}
        <path
          d="M 64 154 Q 76 142 88 152 T 110 148 T 128 153"
          stroke="#2563EB"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />

        {/* 3D Gold Floating Clock Badge on Top-Right */}
        <g className="access-gsap-clock">
          <circle
            cx="162"
            cy="42"
            r="19"
            fill="url(#accessClockRim)"
            stroke="#B45309"
            strokeWidth="1"
            filter="drop-shadow(0 4px 8px rgba(180,83,9,0.38))"
          />
          <circle cx="162" cy="42" r="14.5" fill="url(#accessClockFace)" />
          <circle cx="162" cy="42" r="2.2" fill="#B45309" />
          {/* Clock Hands */}
          <line x1="162" y1="42" x2="162" y2="32" stroke="#B45309" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="162" y1="42" x2="171" y2="42" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="158" cy="36" rx="6" ry="3" fill="#FFFFFF" opacity="0.6" transform="rotate(-30 158 36)" />
        </g>
      </g>
    </g>

    {/* Floating 3D Stylized Pen pointing towards document */}
    <g className="access-gsap-pen" transform="translate(152, 118) rotate(-38)">
      {/* Pen Body */}
      <rect
        x="-7"
        y="-38"
        width="14"
        height="44"
        rx="3.5"
        fill="url(#accessPenBody)"
        stroke="#1E40AF"
        strokeWidth="0.8"
        filter="drop-shadow(2px 6px 8px rgba(30,58,138,0.35))"
      />
      {/* Glint Highlight */}
      <line x1="-3" y1="-36" x2="-3" y2="4" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      {/* Silver Ring */}
      <rect x="-7.5" y="6" width="15" height="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.6" />
      {/* Gold Cone */}
      <polygon points="-7,10 7,10 0,25" fill="url(#accessPenCone)" stroke="#B45309" strokeWidth="0.8" />
      {/* Tip */}
      <polygon points="-2.5,20 2.5,20 0,25" fill="#1E293B" />
      {/* Eraser / Top Button */}
      <rect x="-5" y="-44" width="10" height="6" rx="2" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="0.8" />
    </g>

    {/* Sparkles & Floating Particles */}
    <g className="access-gsap-sparkle" transform="translate(34, 46)">
      <polygon points="0,-4 1.2,-1.2 4,0 1.2,1.2 0,4 -1.2,1.2 -4,0 -1.2,-1.2" fill="#93C5FD" />
    </g>
    <g className="access-gsap-sparkle" transform="translate(202, 98)">
      <polygon points="0,-5 1.5,-1.5 5,0 1.5,1.5 0,5 -1.5,1.5 -5,0 -1.5,-1.5" fill="#FBBF24" />
    </g>
    <circle className="access-gsap-sparkle" cx="198" cy="154" r="2.5" fill="#60A5FA" opacity="0.85" />
    <circle className="access-gsap-sparkle" cx="42" cy="142" r="2" fill="#BFDBFE" opacity="0.7" />
  </svg>
);

export const AccessRequestModal: React.FC<AccessRequestModalProps> = ({
  isOpen,
  onClose,
  assignment,
  remainingHours = 42,
  onSubmit,
  isReadOnly = false,
  requestDetails = null,
}) => {
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDescription(
        requestDetails?.description ||
        (assignment as any)?.editRequestReason ||
        ""
      );
      setError(null);
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen, requestDetails, assignment]);

  // GSAP Refined Micro-Animations: Realistic Pen Writing & Clock Ticking (No up-and-down bobbing)
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Smooth entrance settle for the document
      gsap.fromTo(
        ".access-gsap-doc",
        { scale: 0.95, opacity: 0.85 },
        { scale: 1, opacity: 1, duration: 0.45, ease: "power2.out" }
      );

      // 2. Subtle, calm 3D angle sway on document (stationary anchor, no vertical jumping)
      gsap.to(".access-gsap-doc", {
        rotation: "+=1.2",
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // 3. Realistic Pen writing / signing glide along the signature curve
      gsap.to(".access-gsap-pen", {
        x: "+=7",
        y: "-=2.5",
        rotation: "+=5",
        duration: 1.7,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      // 4. Subtle ambient sparkle twinkling
      gsap.to(".access-gsap-sparkle", {
        scale: 1.25,
        opacity: 0.9,
        stagger: 0.3,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, containerRef);

    return () => ctx.revert();
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

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      closeBtnClassName="hidden"
      closeOnBackdrop={true}
      closeOnEsc={true}
      className="!p-0 !border-0 overflow-hidden !max-w-[590px] rounded-[26px] shadow-2xl [&>div:first-child]:hidden"
    >
      <div
        ref={containerRef}
        className="flex flex-col md:flex-row w-full bg-white text-[#0F172A] overflow-hidden"
      >
        {/* ===================================================================
            LEFT COLUMN: Soft Light Blue Background + 3D Document Illustration
           =================================================================== */}
        <div className="w-full md:w-[225px] shrink-0 bg-gradient-to-b from-[#F0F5FF] via-[#E0F2FE] to-[#BAE6FD] p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden text-[#0F172A] border-b md:border-b-0 md:border-r border-blue-100/90">
          {/* Ambient Lighting Orbs */}
          <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-sky-300/40 blur-2xl pointer-events-none" />
          <div className="absolute bottom-2 right-0 w-36 h-36 rounded-full bg-blue-300/30 blur-2xl pointer-events-none" />

          {/* Header Identity */}
          <div className="relative z-10">
            {/* Quarter Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/80 backdrop-blur-md border border-blue-200/90 text-[11px] font-bold text-blue-700 shadow-2xs mb-2">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>{assignment.quarter} Review</span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-lg sm:text-xl font-black text-[#0B2568] tracking-tight leading-tight">
              Request Review Access
            </h2>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-normal">
              {isReadOnly
                ? `Edit request submitted for your ${assignment.quarter} review`
                : `Submit an edit request for your submitted ${assignment.quarter} review`}
            </p>
          </div>

          {/* Center: GSAP 3D SVG Artwork */}
          <div className="my-auto py-3 relative z-10 flex items-center justify-center">
            <AccessRequest3DIllustration />
          </div>
        </div>

        {/* ===================================================================
            RIGHT COLUMN: Close Button Header, Recipient Card & Action Controls
           =================================================================== */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between bg-white relative">
          {/* Top Header Row with Close 'X' Button (Cleanly aligned, no overlap) */}
          <div className="flex items-center justify-end mb-1">
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              title="Close dialog"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          </div>

          {isSuccess ? (
            /* Success Confirmation */
            <div className="py-7 px-3 text-center space-y-3 my-auto">
              <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-500 flex items-center justify-center text-blue-600 mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7 animate-in zoom-in duration-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">
                  Access Request Forwarded!
                </h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  Dispatched directly to your{" "}
                  <strong className="text-blue-600 font-bold">{recipientTitle}</strong> for{" "}
                  <strong className="text-[#0F172A]">{assignment.quarter} ({assignment.financialYear})</strong>.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3" />
                Status: Pending Approval
              </div>
            </div>
          ) : (
            /* Main Form Layout */
            <div className="space-y-3">
              {/* 1. Routed Recipient Banner */}
              <div className="bg-[#F8FAFC] border border-blue-100/80 rounded-xl p-2.5 flex items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-blue-600 leading-tight">
                      Routed Recipient ({assignment.quarter})
                    </div>
                    <div className="text-xs font-bold text-[#0F172A] leading-snug mt-0.5 truncate">
                      {recipientTitle}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 text-right">
                  {assignment.financialYear && (
                    <span className="text-[9.5px] text-slate-400 font-medium leading-tight pr-0.5">
                      ({assignment.financialYear})
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white border border-blue-200 text-blue-700 shadow-2xs max-w-[140px] mt-0.5"
                    title={`Assigned by ${assignment.assignedBy}`}
                  >
                    <User className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                    <span className="truncate">Assigned by {assignment.assignedBy}</span>
                  </span>
                </div>
              </div>

              {/* 2. Reason / Description Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="access-description-input"
                    className="text-[11px] font-bold text-[#0F172A] flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3 text-blue-600" />
                    Reason / Description {isReadOnly ? null : <span className="text-red-500 font-bold">*</span>}
                  </label>
                  {!isReadOnly && (
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {description.length} / 500 characters
                    </span>
                  )}
                </div>

                <textarea
                  id="access-description-input"
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(e) => {
                    if (isReadOnly) return;
                    setDescription(e.target.value);
                    if (error) setError(null);
                  }}
                  readOnly={isReadOnly}
                  placeholder={
                    isReadOnly
                      ? "No specific reason provided."
                      : "Provide a clear explanation for why you require re-open or edit access to this submitted review..."
                  }
                  className={`w-full rounded-xl border ${error ? "border-red-400 bg-red-50/20" : "border-slate-200"
                    } p-2.5 text-xs text-[#0F172A] ${isReadOnly
                      ? "bg-slate-50/90 text-slate-600 cursor-not-allowed select-none"
                      : "placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100/60"
                    } transition-all resize-none min-h-[85px] leading-relaxed`}
                  disabled={isSubmitting || isReadOnly}
                />

                {error && (
                  <div className="flex items-center gap-1 text-[11px] text-red-600 font-semibold animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* 3. Notice Callout Box */}
              {isReadOnly ? (
                <div className="rounded-xl bg-blue-50/80 border border-blue-200/80 p-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 stroke-[2.4]" />
                  </div>
                  <div className="text-[10.5px] text-slate-600 leading-snug">
                    <div className="font-bold text-blue-900">
                      Request Submitted · Waiting for Approval
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Your access request has been forwarded and is currently waiting for review.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-[#F0FDF4]/80 border border-[#86EFAC]/70 p-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 stroke-[2.4]" />
                  </div>
                  <div className="text-[10.5px] text-slate-600 leading-snug">
                    <div>
                      Edit requests can only be sent within{" "}
                      <strong className="text-[#0F172A] font-bold">42 hours</strong> of submission.
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Approved requests unlock the review for adjustments.
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Action Button */}
              <div className="flex items-center justify-between pt-1">
                {isReadOnly ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Status: Pending Approval
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-xs cursor-pointer active:scale-95"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-end w-full">
                    <button
                      type="button"
                      disabled={isSubmitting || !description.trim()}
                      onClick={handleSubmit}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-95 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Send className="w-3 h-3 animate-bounce" />
                          Routing Request...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          Send Access Request
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AccessRequestModal;
