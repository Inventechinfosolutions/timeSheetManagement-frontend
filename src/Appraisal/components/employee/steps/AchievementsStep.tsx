import React, { useEffect, useRef, useState } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { AlertCircle, X, Paperclip, ChevronDown, Pencil, Trash2 } from "lucide-react";
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
  const accordionContainerRef = useRef<HTMLDivElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accordionContainerRef.current &&
        !accordionContainerRef.current.contains(event.target as Node)
      ) {
        setExpandedIndex(null);
      }
    };

    if (expandedIndex !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expandedIndex]);

  const toggleAccordion = (index: number) => {
    setExpandedIndex((prev) => {
      const isOpening = prev !== index;
      if (isOpening) {
        setTimeout(() => {
          const itemEl = document.getElementById(`accordion-project-${index}`);
          if (itemEl) {
            itemEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 60);
        return index;
      }
      return null;
    });
  };

  const titleError = errors?.projectTitle || addErrors.projectTitle;
  const descriptionError = errors?.projectDescription || addErrors.projectDescription;
  const challengeError = errors?.projectChallenge || addErrors.projectChallenge;
  const listError = errors?.projects;

  const handleTitleChange = (val: string) => {
    onChange("projectTitle", val);
    setAddErrors((prev) => ({ ...prev, projectTitle: "" }));
    if (clearError) {
      clearError("projectTitle");
      clearError("projects");
    }
  };

  const handleDescriptionChange = (val: string) => {
    onChange("projectDescription", val);
    setAddErrors((prev) => ({ ...prev, projectDescription: "" }));
    if (clearError) {
      clearError("projectDescription");
      clearError("projects");
    }
  };

  const handleChallengeChange = (val: string) => {
    onChange("projectChallenge", val);
    setAddErrors((prev) => ({ ...prev, projectChallenge: "" }));
    if (clearError) {
      clearError("projectChallenge");
      clearError("projects");
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
    const newProjects = [
      ...projects,
      { title, description, challenge, attachments: [...attachments] },
    ];
    onChange("projects", newProjects);
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

  const handleEditProject = (targetIndex: number) => {
    const projectToEdit = projects[targetIndex];
    if (!projectToEdit) return;

    const currentTitle = projectTitle.trim();
    const currentDesc = projectDescription.trim();
    const currentChallenge = projectChallenge.trim();
    const hasCurrentData = Boolean(
      currentTitle || currentDesc || currentChallenge || (attachments && attachments.length > 0)
    );

    const updatedProjects = [...projects];

    if (hasCurrentData) {
      // What was currently in the input boxes moves into the accordion list at targetIndex
      updatedProjects[targetIndex] = {
        title: currentTitle || "Untitled Project",
        description: projectDescription,
        challenge: projectChallenge,
        attachments: [...attachments],
      };
      if (expandedIndex === targetIndex) {
        setExpandedIndex(null);
      }
    } else {
      // If the input boxes were empty, remove the selected project from the accordion list
      updatedProjects.splice(targetIndex, 1);
      if (expandedIndex === targetIndex) {
        setExpandedIndex(null);
      } else if (expandedIndex !== null && expandedIndex > targetIndex) {
        setExpandedIndex(expandedIndex - 1);
      }
    }

    // Move the selected project into the active input boxes
    onChange("projects", updatedProjects);
    onChange("projectTitle", projectToEdit.title);
    onChange("projectDescription", projectToEdit.description);
    onChange("projectChallenge", projectToEdit.challenge);
    onChange("projectAttachments", projectToEdit.attachments ? [...projectToEdit.attachments] : []);

    // Clear validation errors
    setAddErrors({});
    if (clearError) {
      clearError("projects");
      clearError("projectTitle");
      clearError("projectDescription");
      clearError("projectChallenge");
    }

    // Smooth scroll to the input form and focus title place
    const inputElement = document.getElementById("field-projects");
    if (inputElement) {
      inputElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTimeout(() => {
      const titleInput = document.getElementById("input-projectTitle");
      if (titleInput) {
        titleInput.focus();
      }
    }, 100);
  };

  const handleRemoveProject = (index: number) => {
    const removed = projects[index];
    (removed?.attachments || []).forEach((file) => {
      if (file.objectKey && onRemoveAttachment) {
        void onRemoveAttachment(file.objectKey);
      }
    });
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
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
      <div id="field-projects" className="flex items-start justify-between gap-3 border-b border-blue-100 pb-4 scroll-mt-24">
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
          className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] hover:border-[#2563EB] rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] mr-0.5 mt-0.5"
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
              className="flex items-center gap-2.5 px-3 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl shadow-2xs max-w-full"
            >
              <Paperclip className="w-4 h-4 text-[#2563EB] shrink-0" />
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
              className="btn-attach-document group inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] hover:border-[#2563EB] rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
            >
              <Paperclip className="w-4 h-4 text-[#2563EB] shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
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
          <div ref={accordionContainerRef} className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Added Projects ({projects.length})
              </span>
            </div>

            {projects.map((project, index) => {
              const isExpanded = expandedIndex === index;

              return (
                <div
                  id={`accordion-project-${index}`}
                  key={`${project.title}-${index}`}
                  className="bg-white border border-blue-200/80 hover:border-blue-400/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 scroll-mt-24"
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => toggleAccordion(index)}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 bg-gradient-to-r from-white via-blue-50/20 to-white hover:bg-blue-50/30 cursor-pointer select-none group transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 px-2.5 py-1 text-[11px] font-extrabold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
                        Project {index + 1}
                      </span>
                      <h4 className="text-sm font-bold text-[#0F172A] truncate group-hover:text-[#2563EB] transition-colors">
                        {project.title || "Untitled Project"}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Edit Button - Icon Only */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProject(index);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] hover:border-[#2563EB] rounded-xl transition-all duration-150 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        title="Edit project (swaps into input box)"
                        aria-label="Edit project"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button - Icon Only */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveProject(index);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-xl transition-all duration-150 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        title="Delete project"
                        aria-label="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Accordion Chevron */}
                      <div className="p-1 rounded-lg text-[#64748B] group-hover:text-[#2563EB] group-hover:bg-blue-50/60 transition-colors ml-1">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                            isExpanded ? "rotate-180 text-[#2563EB]" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Accordion Body with Smooth Grid Transition Animation */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isExpanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4 pt-3 border-t border-blue-100/70 space-y-4 bg-gradient-to-b from-blue-50/20 to-white">
                        {/* 1. Project Title Card (matching input field position and style) */}
                        <div className="eval-step-card space-y-2">
                          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                            <span>Project Title</span>
                          </label>
                          <div className="eval-input-field font-semibold text-[#0F172A] bg-white">
                            {project.title || "—"}
                          </div>
                        </div>

                        {/* 2. Side-by-Side Grid for Description and Challenge (matching input field position and style) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                          {/* Project Description Card */}
                          <div className="eval-step-card space-y-3 flex flex-col justify-between h-full">
                            <div>
                              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                                <span>Project Description</span>
                              </label>
                              <div className="eval-textarea-field mt-2 min-h-[96px] whitespace-pre-line leading-relaxed bg-white text-[#334155]">
                                {project.description || "—"}
                              </div>
                            </div>
                          </div>

                          {/* Challenge Card */}
                          <div className="eval-step-card space-y-2 flex flex-col justify-between h-full">
                            <div>
                              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                                <span>Challenge Overcome</span>
                              </label>
                              <div className="eval-textarea-field mt-2 min-h-[96px] whitespace-pre-line leading-relaxed bg-white text-[#334155]">
                                {project.challenge || "—"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 3. Attached Documents (matching input field position and style) */}
                        {(project.attachments || []).length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                              Attached Documents ({(project.attachments || []).length})
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {(project.attachments || []).map((file) => (
                                <div
                                  key={file.objectKey}
                                  className="flex items-center gap-2.5 px-3 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl shadow-2xs max-w-full"
                                >
                                  <Paperclip className="w-4 h-4 text-[#2563EB] shrink-0" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-[#0F172A] truncate max-w-[150px] sm:max-w-[190px]">
                                      {file.fileName}
                                    </span>
                                    {file.sizeLabel && (
                                      <span className="text-[10px] text-[#64748B]">({file.sizeLabel})</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsStep;
