import React, { useRef, useState } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { AlertCircle, X, Paperclip } from "lucide-react";
import { readApiError } from "../../../services/appraisal.api";

export const AchievementsStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
  onUploadAttachment,
  onRemoveAttachment,
}) => {
  const projectTitle = formData.projectTitle ?? "";
  const projectDescription = formData.projectDescription ?? "";
  const projectChallenge = formData.projectChallenge ?? "";
  const projects = formData.projects || [];
  const attachments = formData.projectAttachments || [];

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  const titleError = errors?.projectTitle || addErrors.projectTitle;
  const descriptionError = errors?.projectDescription || addErrors.projectDescription;
  const challengeError = errors?.projectChallenge || addErrors.projectChallenge;
  const listError = errors?.projects;

  const handleTitleChange = (val: string) => {
    onChange("projectTitle", val);
    setAddErrors((prev) => ({ ...prev, projectTitle: "" }));
    if (clearError) {
      clearError("projectTitle");
    }
  };

  const handleDescriptionChange = (val: string) => {
    onChange("projectDescription", val);
    setAddErrors((prev) => ({ ...prev, projectDescription: "" }));
    if (clearError) {
      clearError("projectDescription");
    }
  };

  const handleChallengeChange = (val: string) => {
    onChange("projectChallenge", val);
    setAddErrors((prev) => ({ ...prev, projectChallenge: "" }));
    if (clearError) {
      clearError("projectChallenge");
    }
  };

  const handleAddProject = () => {
    const title = projectTitle.trim();
    const description = projectDescription.trim();
    const challenge = projectChallenge.trim();
    const nextErrors: Record<string, string> = {};
    if (!title) nextErrors.projectTitle = "Project title is required.";
    if (!description) nextErrors.projectDescription = "Project description is required.";
    if (!challenge) nextErrors.projectChallenge = "Challenge overcome is required.";
    setAddErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onChange("projects", [
      ...projects,
      { title, description, challenge, attachments },
    ]);
    onChange("projectTitle", "");
    onChange("projectDescription", "");
    onChange("projectChallenge", "");
    onChange("projectAttachments", []);
    setAddErrors({});
    if (clearError) {
      clearError("projects");
      clearError("projectTitle");
      clearError("projectDescription");
      clearError("projectChallenge");
    }
  };

  const handleRemoveProject = (index: number) => {
    const removed = projects[index];
    (removed?.attachments || []).forEach((file) => {
      if (file.objectKey && onRemoveAttachment) {
        void onRemoveAttachment(file.objectKey);
      }
    });
    onChange(
      "projects",
      projects.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (!file || !onUploadAttachment) {
      return;
    }
    if (attachments.length >= 5) {
      setUploadError("You can attach up to 5 files.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const stored = await onUploadAttachment(file);
      onChange("projectAttachments", [...attachments, stored]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : readApiError(error));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async (objectKey: string) => {
    setUploadError("");
    try {
      if (onRemoveAttachment) {
        await onRemoveAttachment(objectKey);
      }
      onChange(
        "projectAttachments",
        attachments.filter((item) => item.objectKey !== objectKey),
      );
    } catch (error) {
      setUploadError(readApiError(error));
    }
  };

  return (
    <div className="space-y-6">
      <div id="field-projects" className="flex items-start justify-between gap-3 border-b border-[#D3A29D]/30 pb-4">
        <div>
          <h3 className="text-lg font-bold text-[#0F172A]">
            <span className="eval-title-anim">Step 2: Key Achievements & Projects</span>
            <span className="eval-title-accent-line" />
          </h3>
          <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
            Detail your key project deliverables, project description, and challenges navigated.
          </p>
          {listError && (
            <p className="text-xs text-red-600 font-semibold mt-2">{listError}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddProject}
          className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#A36361] bg-gradient-to-r from-[#FAF2EE] via-white to-[#F8EFEA] border border-[#D3A29D]/50 hover:border-[#A36361] rounded-xl transition-all duration-200 cursor-pointer"
        >
          <span className="tracking-wide">+ Add more project</span>
        </button>
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

        <div className="flex flex-wrap items-center gap-2 px-1">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.zip"
            onChange={handleFileSelect}
          />
          {attachments.map((file) => (
            <div
              key={file.objectKey}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-gradient-to-r from-[#FAF2EE] to-[#F8EFEA] border border-[#D3A29D]/50 rounded-xl shadow-2xs max-w-full"
            >
              <Paperclip className="w-4 h-4 text-[#A36361] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#0F172A] truncate max-w-[150px] sm:max-w-[190px]">
                  {file.fileName}
                </span>
                {file.sizeLabel && (
                  <span className="text-[10px] text-[#64748B]">{file.sizeLabel}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(file.objectKey)}
                className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors ml-1 cursor-pointer"
                title="Remove document"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {attachments.length < 5 && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="btn-attach-document group inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#A36361] bg-gradient-to-r from-[#FAF2EE] via-white to-[#F8EFEA] hover:from-[#FAF0EB] hover:to-[#F5E8E2] border border-[#D3A29D]/50 hover:border-[#A36361] rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
            >
              <Paperclip className="w-4 h-4 text-[#A36361] shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
              <span className="tracking-wide">
                {uploading ? "Saving..." : attachments.length === 0 ? "Attach Document" : "Add more"}
              </span>
            </button>
          )}
          <span className="text-[11px] text-[#64748B] font-medium">
            PDF, Word, Excel, or Image
          </span>
          {uploadError && (
            <span className="text-xs text-red-600 font-semibold">{uploadError}</span>
          )}
        </div>

        {projects.length > 0 && (
          <div className="space-y-2">
            {projects.map((project, index) => (
              <div
                key={`${project.title}-${index}`}
                className="flex items-start justify-between gap-3 px-3.5 py-3 bg-white border border-[#D3A29D]/40 rounded-xl"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0F172A]">{project.title}</p>
                  <p className="text-xs text-[#64748B] mt-1 whitespace-pre-line">{project.description}</p>
                  <p className="text-xs text-[#0F172A] mt-1 whitespace-pre-line">{project.challenge}</p>
                  {(project.attachments || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(project.attachments || []).map((file) => (
                        <span
                          key={file.objectKey}
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-[#0F172A] bg-[#FAF2EE] border border-[#D3A29D]/50 rounded-lg"
                        >
                          {file.fileName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProject(index)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer"
                  title="Remove project"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsStep;
