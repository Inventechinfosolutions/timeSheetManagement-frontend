import React, { useRef } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { AlertCircle, FileText, X } from "lucide-react";

// Animated SVG Icon for Attach Document Button
const AnimatedAttachIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`overflow-visible ${className}`}
  >
    <defs>
      <linearGradient id="attachClipGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A36361" />
        <stop offset="50%" stopColor="#D3A29D" />
        <stop offset="100%" stopColor="#E8B298" />
      </linearGradient>
      <radialGradient id="attachAuraGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D3A29D" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#A36361" stopOpacity="0" />
      </radialGradient>
      <filter id="attachGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="0.8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Soft Pulsing Halo / Aura */}
    <circle
      cx="12"
      cy="12"
      r="8.5"
      fill="url(#attachAuraGrad)"
      className="anim-attach-aura"
    />

    {/* Floating Paperclip */}
    <g className="anim-attach-clip">
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l7.88-7.88"
        stroke="url(#attachClipGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#attachGlow)"
      />
    </g>

    {/* Animated Golden Sparkle 1 */}
    <path
      d="M19 2l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6L19 2z"
      fill="#EECC8C"
      className="anim-attach-sparkle-1"
    />

    {/* Animated Peach Sparkle 2 */}
    <path
      d="M5 16l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4.4-1z"
      fill="#E8B298"
      className="anim-attach-sparkle-2"
    />
  </svg>
);

export const AchievementsStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
}) => {
  const projectTitle = formData.projectTitle ?? formData.majorAchievements ?? "";
  const projectDescription = formData.projectDescription ?? formData.kpisMet ?? "";
  const projectChallenge = formData.projectChallenge ?? formData.challengesOvercome ?? "";
  const projectAttachmentName = formData.projectAttachmentName || "";
  const projectAttachmentSize = formData.projectAttachmentSize || "";

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const titleError = errors?.projectTitle || errors?.majorAchievements;
  const descriptionError = errors?.projectDescription || errors?.kpisMet;
  const challengeError = errors?.projectChallenge || errors?.challengesOvercome;

  const handleTitleChange = (val: string) => {
    onChange("projectTitle" as any, val);
    onChange("majorAchievements", val);
    if (clearError) {
      clearError("projectTitle");
      clearError("majorAchievements");
    }
  };

  const handleDescriptionChange = (val: string) => {
    onChange("projectDescription" as any, val);
    onChange("kpisMet", val);
    if (clearError) {
      clearError("projectDescription");
      clearError("kpisMet");
    }
  };

  const handleChallengeChange = (val: string) => {
    onChange("projectChallenge" as any, val);
    onChange("challengesOvercome", val);
    if (clearError) {
      clearError("projectChallenge");
      clearError("challengesOvercome");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange("projectAttachmentName" as any, file.name);
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;
      onChange("projectAttachmentSize" as any, sizeStr);

      const reader = new FileReader();
      reader.onload = () => {
        onChange("projectAttachment" as any, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    onChange("projectAttachmentName" as any, "");
    onChange("projectAttachmentSize" as any, "");
    onChange("projectAttachment" as any, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D3A29D]/30 pb-4">
        <h3 className="text-lg font-bold text-[#0F172A]">
          <span className="eval-title-anim">Step 2: Key Achievements & Projects</span>
          <span className="eval-title-accent-line" />
        </h3>
        <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
          Detail your key project deliverables, project description, and challenges navigated.
        </p>
      </div>

      <div className="space-y-4">
        {/* Project Title Card */}
        <div
          id="field-projectTitle"
          className={`eval-step-card space-y-2 transition-all duration-200 ${
            titleError ? "eval-field-has-error" : ""
          }`}
        >
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between">
            <span>
              Project Title <span className="text-red-500">*</span>
            </span>
          </label>
          <input
            id="input-projectTitle"
            type="text"
            value={projectTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Timesheet Workflow Modernization & Automation"
            className={`eval-input-field ${titleError ? "eval-input-error" : ""}`}
          />
          {titleError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{titleError}</span>
            </p>
          )}
        </div>

        {/* Side-by-Side Grid for Description and Challenge (Both cards equal height) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Project Description Card */}
          <div
            id="field-projectDescription"
            className={`eval-step-card space-y-3 flex flex-col justify-between h-full transition-all duration-200 ${
              descriptionError ? "eval-field-has-error" : ""
            }`}
          >
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between">
                <span>
                  Project Description <span className="text-red-500">*</span>
                </span>
              </label>
              <textarea
                id="input-projectDescription"
                rows={4}
                value={projectDescription}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Describe the project scope, your key responsibilities, deliverables, and measurable outcomes..."
                className={`eval-textarea-field mt-2 ${
                  descriptionError ? "eval-input-error" : ""
                }`}
              />
              {descriptionError && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{descriptionError}</span>
                </p>
              )}
            </div>
          </div>

          {/* Challenge Card */}
          <div
            id="field-projectChallenge"
            className={`eval-step-card space-y-2 flex flex-col justify-between h-full transition-all duration-200 ${
              challengeError ? "eval-field-has-error" : ""
            }`}
          >
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between">
                <span>
                  Challenge Overcome <span className="text-red-500">*</span>
                </span>
              </label>
              <textarea
                id="input-projectChallenge"
                rows={4}
                value={projectChallenge}
                onChange={(e) => handleChallengeChange(e.target.value)}
                placeholder="What technical or operational challenges did you encounter and how did you resolve them?..."
                className={`eval-textarea-field mt-2 ${
                  challengeError ? "eval-input-error" : ""
                }`}
              />
              {challengeError && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{challengeError}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Document Attachment Button OUTSIDE below both cards (aligned under left card) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 -mt-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.zip"
              onChange={handleFileSelect}
            />

            {!projectAttachmentName ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-attach-document group inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#A36361] bg-gradient-to-r from-[#FAF2EE] via-white to-[#F8EFEA] hover:from-[#FAF0EB] hover:to-[#F5E8E2] border border-[#D3A29D]/50 hover:border-[#A36361] rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <AnimatedAttachIcon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="tracking-wide">Attach Document</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gradient-to-r from-[#FAF2EE] to-[#F8EFEA] border border-[#D3A29D]/50 rounded-xl shadow-2xs max-w-full">
                <AnimatedAttachIcon className="w-4 h-4 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#0F172A] truncate max-w-[150px] sm:max-w-[190px]">
                    {projectAttachmentName}
                  </span>
                  {projectAttachmentSize && (
                    <span className="text-[10px] text-[#64748B]">
                      {projectAttachmentSize}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors ml-1 cursor-pointer"
                  title="Remove document"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <span className="text-[11px] text-[#64748B] font-medium">
              PDF, Word, Excel, or Image
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsStep;
