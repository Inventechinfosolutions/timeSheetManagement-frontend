import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { StepProps, PerformanceProject, ProjectRoleEnum, ResponsibilityTypeEnum } from "../../../types/appraisal.types";
import { AlertCircle, X, Paperclip, ChevronDown, Pencil, Trash2, Check, Plus, UserCheck, ShieldCheck } from "lucide-react";
import { readApiError } from "../../../reducers/appraisal.reducer";
import AttachmentItem from "../../common/AttachmentItem";

const PROJECT_ROLE_OPTIONS = [
  ProjectRoleEnum.FRONTEND_DEVELOPER,
  ProjectRoleEnum.BACKEND_DEVELOPER,
  ProjectRoleEnum.FULL_STACK_DEVELOPER,
  ProjectRoleEnum.QA_ENGINEER,
  ProjectRoleEnum.UI_UX_DESIGNER,
  ProjectRoleEnum.DEVOPS_ENGINEER,
  ProjectRoleEnum.BUSINESS_ANALYST,
  ProjectRoleEnum.PROJECT_MANAGER,
  ProjectRoleEnum.OTHER,
];

const RESPONSIBILITY_TYPE_OPTIONS = [
  ResponsibilityTypeEnum.PROJECT_LEADER,
  ResponsibilityTypeEnum.TEAM_LEAD,
  ResponsibilityTypeEnum.PROJECT_MANAGER,
  ResponsibilityTypeEnum.MODULE_OWNER,
  ResponsibilityTypeEnum.INDIVIDUAL_CONTRIBUTOR,
  ResponsibilityTypeEnum.TEAM_MEMBER,
  ResponsibilityTypeEnum.OTHER,
];

interface AppraisalSelectWithOtherProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  customPlaceholder?: string;
  prefixIcon?: React.ReactNode;
}

const AppraisalSelectWithOther: React.FC<AppraisalSelectWithOtherProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  customPlaceholder = "Type custom value...",
  prefixIcon,
}) => {
  const isStandard = options.filter((opt) => opt !== "Other").includes(value);
  const [isCustom, setIsCustom] = useState(Boolean(value && !isStandard));
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value && !isStandard) {
      setIsCustom(true);
    } else if (isStandard || !value) {
      setIsCustom(false);
    }
  }, [value, isStandard]);

  const placeMenu = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: Math.max(16, rect.left),
      width: rect.width,
      minWidth: rect.width,
      zIndex: 10050,
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    placeMenu();
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [isOpen, placeMenu]);

  const handleSelectOption = (opt: string) => {
    if (opt === "Other") {
      setIsCustom(true);
      onChange("");
      setIsOpen(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setIsCustom(false);
      onChange(opt);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsCustom(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        id={id}
        onClick={() => {
          if (!isCustom) {
            setIsOpen(!isOpen);
          }
        }}
        className={`eval-step-card !py-2.5 !px-3.5 flex items-center gap-2.5 transition-all duration-200 ${
          isCustom ? "cursor-text" : "cursor-pointer select-none"
        }`}
      >
        {prefixIcon && <span className="text-[#4318FF] shrink-0">{prefixIcon}</span>}

        {isCustom ? (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={customPlaceholder}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm font-semibold text-[#0F172A] placeholder:text-gray-400 placeholder:font-normal"
            autoFocus
          />
        ) : (
          <span
            className={`flex-1 min-w-0 text-left text-sm font-semibold truncate ${
              !value ? "text-gray-400 font-normal" : "text-[#0F172A]"
            }`}
          >
            {value || placeholder}
          </span>
        )}

        <div className="ml-auto inline-flex items-center gap-1.5 shrink-0">
          {(value || isCustom) && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              title="Clear"
            >
              <X size={13} />
            </span>
          )}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-0.5 text-gray-400 hover:text-[#4318FF] cursor-pointer transition-colors"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isOpen ? "rotate-180 text-[#4318FF]" : ""}`}
            />
          </span>
        </div>
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-[10050] animate-in fade-in slide-in-from-top-2 duration-150 max-h-60 overflow-y-auto overflow-x-hidden eval-custom-scrollbar"
          >
            {options.map((option) => {
              const isSelected = isCustom ? option === "Other" : option === value;
              return (
                <button
                  key={option}
                  type="button"
                  title={option}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-[#4318FF] text-white shadow-xs"
                      : "text-[#2B3674] hover:bg-gray-50"
                  }`}
                >
                  <span className="truncate">{option}</span>
                  {isSelected && <Check size={14} className="shrink-0 text-white" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};

const SUGGESTED_PROJECTS = [
  "Timesheet Workflow Modernization & Automation",
  "HRMS Portal & Employee Directory",
  "Quarterly Performance Review 2.0",
  "Client Billing & Invoice Tracking System",
  "Cloud Infrastructure Migration & CI/CD",
  "Analytics Dashboard & Metrics Engine",
];

const COMMON_TECH_STACK = [
  "React",
  "TypeScript",
  "Node.js",
  "NestJS",
  "JavaScript",
  "Python",
  "Java",
  "Spring Boot",
  "MySQL",
  "PostgreSQL",
  "Docker",
  "AWS",
  "Tailwind CSS",
  "Git",
];

export const AchievementsStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
  onUploadAttachment,
  onRemoveAttachment,
}) => {
  const projectName = formData.projectName || "";
  const projectDescription = formData.projectDescription ?? "";
  const projectRole = formData.projectRole ?? "";
  const responsibilityType = formData.responsibilityType ?? "";
  const leadershipQualities = formData.leadershipQualities ?? "";
  const clientReviewFeedback = formData.clientReviewFeedback ?? "";
  const keyResponsibilities = formData.keyResponsibilities ?? "";
  const challengesFaced = formData.challengesFaced || formData.projectChallenge || "";
  const solutionsImplemented = formData.solutionsImplemented ?? "";
  const keyAchievementsOutcomes = formData.keyAchievementsOutcomes ?? "";
  const technologiesUsed = formData.technologiesUsed || [];
  const projects = formData.projects || [];
  const attachments = formData.projectAttachments || [];

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const accordionContainerRef = useRef<HTMLDivElement | null>(null);
  const [techInput, setTechInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const editingIndex =
    formData.editingProjectIndex !== undefined && formData.editingProjectIndex !== null
      ? formData.editingProjectIndex
      : null;
  const setEditingIndex = (idx: number | null) => {
    onChange("editingProjectIndex", idx);
  };

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

  const draftIsEmpty =
    !projectName.trim() &&
    !projectDescription.trim() &&
    !challengesFaced.trim() &&
    !keyResponsibilities.trim();
  const hasSavedProject = projects.some(
    (project) =>
      project.projectName?.trim() &&
      project.description?.trim() &&
      !project.isDraft,
  );
  const showDraftErrors = !(draftIsEmpty && hasSavedProject);
  const nameError = showDraftErrors ? errors?.projectName || addErrors.projectName : "";
  const descriptionError = showDraftErrors ? errors?.projectDescription || addErrors.projectDescription : "";
  const challengesError = showDraftErrors ? errors?.challengesFaced || errors?.projectChallenge || addErrors.challengesFaced : "";

  const handleNameChange = (val: string) => {
    onChange("projectName", val);
    setAddErrors((prev) => ({ ...prev, projectName: "" }));
    if (clearError) {
      clearError("projectName");
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

  const handleChallengesChange = (val: string) => {
    onChange("challengesFaced", val);
    onChange("projectChallenge", val);
    setAddErrors((prev) => ({ ...prev, challengesFaced: "" }));
    if (clearError) {
      clearError("challengesFaced");
      clearError("projectChallenge");
      clearError("projects");
    }
  };

  const handleRoleChange = (val: string) => {
    onChange("projectRole", val);
    setAddErrors((prev) => ({ ...prev, projectRole: "" }));
    if (clearError) clearError("projectRole");
  };

  const handleResponsibilityTypeChange = (val: string) => {
    onChange("responsibilityType", val);
    setAddErrors((prev) => ({ ...prev, responsibilityType: "" }));
    if (clearError) clearError("responsibilityType");
  };

  const handleLeadershipQualitiesChange = (val: string) => {
    onChange("leadershipQualities", val);
    if (clearError) clearError("leadershipQualities");
  };

  const handleClientReviewFeedbackChange = (val: string) => {
    onChange("clientReviewFeedback", val);
    if (clearError) clearError("clientReviewFeedback");
  };

  const handleKeyResponsibilitiesChange = (val: string) => {
    onChange("keyResponsibilities", val);
    if (clearError) clearError("keyResponsibilities");
  };

  const handleSolutionsChange = (val: string) => {
    onChange("solutionsImplemented", val);
    if (clearError) clearError("solutionsImplemented");
  };

  const handleOutcomesChange = (val: string) => {
    onChange("keyAchievementsOutcomes", val);
    if (clearError) clearError("keyAchievementsOutcomes");
  };

  const handleAddTechnology = (tech: string) => {
    const trimmed = tech.trim();
    if (!trimmed) return;
    if (!technologiesUsed.includes(trimmed)) {
      onChange("technologiesUsed", [...technologiesUsed, trimmed]);
    }
    setTechInput("");
  };

  const handleRemoveTechnology = (techToRemove: string) => {
    onChange(
      "technologiesUsed",
      technologiesUsed.filter((item) => item !== techToRemove),
    );
  };

  const handleSaveProject = () => {
    const name = projectName.trim();
    const description = projectDescription.trim();
    const challenge = challengesFaced.trim();
    const nextErrors: Record<string, string> = {};
    if (!name) nextErrors.projectName = "Project name is required.";
    if (!description) nextErrors.projectDescription = "Project description is required.";
    if (!challenge) nextErrors.challengesFaced = "Challenges faced is required.";
    setAddErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (!name) {
        document.getElementById("input-projectName")?.focus();
      } else if (!description) {
        document.getElementById("input-projectDescription")?.focus();
      } else if (!challenge) {
        document.getElementById("input-challengesFaced")?.focus();
      }
      return;
    }

    const savedProject: PerformanceProject = {
      projectName: name,
      description,
      challenge,
      challengesFaced: challenge,
      projectRole,
      responsibilityType,
      leadershipQualities: leadershipQualities.trim(),
      clientReviewFeedback: clientReviewFeedback.trim(),
      keyResponsibilities: keyResponsibilities.trim(),
      solutionsImplemented: solutionsImplemented.trim(),
      keyAchievementsOutcomes: keyAchievementsOutcomes.trim(),
      technologiesUsed: [...technologiesUsed],
      attachments: [...attachments],
      isDraft: false,
    };

    let nextProjects: PerformanceProject[];
    if (editingIndex !== null && editingIndex >= 0 && editingIndex < projects.length) {
      nextProjects = [...projects];
      nextProjects[editingIndex] = savedProject;
    } else {
      nextProjects = [...projects, savedProject];
    }

    onChange("projects", nextProjects);
    onChange("projectName", "");
    onChange("projectDescription", "");
    onChange("projectRole", "");
    onChange("responsibilityType", "");
    onChange("leadershipQualities", "");
    onChange("clientReviewFeedback", "");
    onChange("keyResponsibilities", "");
    onChange("challengesFaced", "");
    onChange("projectChallenge", "");
    onChange("solutionsImplemented", "");
    onChange("keyAchievementsOutcomes", "");
    onChange("technologiesUsed", []);
    onChange("projectAttachments", []);
    setEditingIndex(null);
    setAddErrors({});
    if (clearError) {
      clearError("projects");
      clearError("projectName");
      clearError("projectDescription");
      clearError("challengesFaced");
      clearError("projectChallenge");
    }
  };

  const handleCancelEdit = () => {
    onChange("projectName", "");
    onChange("projectDescription", "");
    onChange("projectRole", "");
    onChange("responsibilityType", "");
    onChange("leadershipQualities", "");
    onChange("clientReviewFeedback", "");
    onChange("keyResponsibilities", "");
    onChange("challengesFaced", "");
    onChange("projectChallenge", "");
    onChange("solutionsImplemented", "");
    onChange("keyAchievementsOutcomes", "");
    onChange("technologiesUsed", []);
    onChange("projectAttachments", []);
    setEditingIndex(null);
    setAddErrors({});
    if (clearError) {
      clearError("projects");
      clearError("projectName");
      clearError("projectDescription");
      clearError("challengesFaced");
      clearError("projectChallenge");
    }
  };

  const handleAddMoreClick = () => {
    if (editingIndex !== null) {
      const originalProject = projects[editingIndex];
      // Only preserve as draft if this item was ALREADY a draft
      if (originalProject?.isDraft && !draftIsEmpty) {
        const nextProjects = [...projects];
        nextProjects[editingIndex] = {
          ...nextProjects[editingIndex],
          projectName: projectName.trim() || nextProjects[editingIndex]?.projectName || "Untitled Project",
          description: projectDescription.trim(),
          challenge: (challengesFaced || projectChallenge).trim(),
          challengesFaced: (challengesFaced || projectChallenge).trim(),
          projectRole,
          responsibilityType,
          leadershipQualities: leadershipQualities.trim(),
          clientReviewFeedback: clientReviewFeedback.trim(),
          keyResponsibilities: keyResponsibilities.trim(),
          solutionsImplemented: solutionsImplemented.trim(),
          keyAchievementsOutcomes: keyAchievementsOutcomes.trim(),
          technologiesUsed: [...technologiesUsed],
          attachments: [...attachments],
          isDraft: true,
        };
        onChange("projects", nextProjects);
      }
      handleCancelEdit();
    } else if (!draftIsEmpty) {
      // If user was drafting a new project and clicked "+ Add more", save it as draft
      const currentDraft: PerformanceProject = {
        projectName: projectName.trim() || "Untitled Project",
        description: projectDescription.trim(),
        challenge: (challengesFaced || projectChallenge).trim(),
        challengesFaced: (challengesFaced || projectChallenge).trim(),
        projectRole,
        responsibilityType,
        leadershipQualities: leadershipQualities.trim(),
        clientReviewFeedback: clientReviewFeedback.trim(),
        keyResponsibilities: keyResponsibilities.trim(),
        solutionsImplemented: solutionsImplemented.trim(),
        keyAchievementsOutcomes: keyAchievementsOutcomes.trim(),
        technologiesUsed: [...technologiesUsed],
        attachments: [...attachments],
        isDraft: true,
      };
      onChange("projects", [...projects, currentDraft]);
      handleCancelEdit();
    }
    const inputElement = document.getElementById("field-projects");
    if (inputElement) {
      inputElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTimeout(() => {
      document.getElementById("input-projectName")?.focus();
    }, 100);
  };

  const handleEditProject = (targetIndex: number) => {
    const projectToEdit = projects[targetIndex];
    if (!projectToEdit) return;

    if (editingIndex === targetIndex) {
      document.getElementById("input-projectName")?.focus();
      return;
    }

    let nextProjects = [...projects];

    if (editingIndex === null) {
      // Only when writing a new project in the input form, save it as a draft item
      if (!draftIsEmpty) {
        const currentDraft: PerformanceProject = {
          projectName: projectName.trim() || "Untitled Project",
          description: projectDescription.trim(),
          challenge: (challengesFaced || projectChallenge).trim(),
          challengesFaced: (challengesFaced || projectChallenge).trim(),
          projectRole,
          responsibilityType,
          leadershipQualities: leadershipQualities.trim(),
          clientReviewFeedback: clientReviewFeedback.trim(),
          keyResponsibilities: keyResponsibilities.trim(),
          solutionsImplemented: solutionsImplemented.trim(),
          keyAchievementsOutcomes: keyAchievementsOutcomes.trim(),
          technologiesUsed: [...technologiesUsed],
          attachments: [...attachments],
          isDraft: true,
        };
        nextProjects.push(currentDraft);
        onChange("projects", nextProjects);
      }
    } else if (editingIndex >= 0 && editingIndex < projects.length) {
      const original = projects[editingIndex];
      // If the project was already saved, it should NEVER become a draft!
      // Only update draft text if it was ALREADY a draft project.
      if (original?.isDraft && !draftIsEmpty) {
        nextProjects[editingIndex] = {
          ...original,
          projectName: projectName.trim() || original.projectName || "Untitled Project",
          description: projectDescription.trim(),
          challenge: (challengesFaced || projectChallenge).trim(),
          challengesFaced: (challengesFaced || projectChallenge).trim(),
          projectRole,
          responsibilityType,
          leadershipQualities: leadershipQualities.trim(),
          clientReviewFeedback: clientReviewFeedback.trim(),
          keyResponsibilities: keyResponsibilities.trim(),
          solutionsImplemented: solutionsImplemented.trim(),
          keyAchievementsOutcomes: keyAchievementsOutcomes.trim(),
          technologiesUsed: [...technologiesUsed],
          attachments: [...attachments],
          isDraft: true,
        };
        onChange("projects", nextProjects);
      }
    }

    const projectToLoad = nextProjects[targetIndex];
    if (!projectToLoad) return;

    setEditingIndex(targetIndex);

    // Populate active form
    const editName = projectToLoad.projectName || "";
    onChange("projectName", editName);
    onChange("projectDescription", projectToLoad.description || "");
    onChange("projectRole", projectToLoad.projectRole || "");
    onChange("responsibilityType", projectToLoad.responsibilityType || "");
    onChange("leadershipQualities", projectToLoad.leadershipQualities || "");
    onChange("clientReviewFeedback", projectToLoad.clientReviewFeedback || "");
    onChange("keyResponsibilities", projectToLoad.keyResponsibilities || "");
    const editChallenge = projectToLoad.challengesFaced || projectToLoad.challenge || "";
    onChange("challengesFaced", editChallenge);
    onChange("projectChallenge", editChallenge);
    onChange("solutionsImplemented", projectToLoad.solutionsImplemented || "");
    onChange("keyAchievementsOutcomes", projectToLoad.keyAchievementsOutcomes || "");
    onChange("technologiesUsed", projectToLoad.technologiesUsed ? [...projectToLoad.technologiesUsed] : []);
    onChange("projectAttachments", projectToLoad.attachments ? [...projectToLoad.attachments] : []);

    setAddErrors({});
    if (clearError) {
      clearError("projects");
      clearError("projectName");
      clearError("projectDescription");
      clearError("challengesFaced");
      clearError("projectChallenge");
    }

    const inputElement = document.getElementById("field-projects");
    if (inputElement) {
      inputElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTimeout(() => {
      document.getElementById("input-projectName")?.focus();
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

    if (editingIndex === index) {
      handleCancelEdit();
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
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
      {/* Header */}
      <div id="field-projects" className="flex items-start justify-between gap-3 border-b border-blue-100 pb-4 scroll-mt-24">
        <div>
          <h3 className="text-lg font-bold text-[#0F172A]">
            <span className="eval-title-anim">Step 2: Key Achievements & Projects</span>
            <span className="eval-title-accent-line" />
          </h3>
          <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
            Detail your project deliverables, project role, key responsibilities, challenges, and solutions.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddMoreClick}
          className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] hover:border-[#2563EB] rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] mr-0.5 mt-0.5"
        >
          <span className="tracking-wide">+ Add more project</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* 1. Project Name (Dropdown or text input) */}
        <div id="field-projectName" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-projectName"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between"
          >
            <span>
              Project Name <span className="text-red-500">*</span>
            </span>
          </label>
          <div
            className={`eval-step-card !py-2.5 !px-3.5 flex items-center transition-all duration-200 cursor-text ${
              nameError ? "eval-field-has-error" : ""
            }`}
            onClick={() => document.getElementById("input-projectName")?.focus()}
          >
            <input
              id="input-projectName"
              type="text"
              value={projectName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Timesheet Workflow Modernization & Automation"
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed font-semibold"
            />
          </div>
          {nameError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{nameError}</span>
            </p>
          )}
        </div>

        {/* 2. Project Description (Text area) */}
        <div id="field-projectDescription" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-projectDescription"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between"
          >
            <span>
              Project Description <span className="text-red-500">*</span>
            </span>
          </label>
          <div
            className={`eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1 ${
              descriptionError ? "eval-field-has-error" : ""
            }`}
            onClick={() => document.getElementById("input-projectDescription")?.focus()}
          >
            <textarea
              id="input-projectDescription"
              rows={3}
              value={projectDescription}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Describe your project scope, core objectives, and deliverables..."
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1"
            />
          </div>
          {descriptionError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{descriptionError}</span>
            </p>
          )}
        </div>

        {/* 3 & 4. Project Role & Responsibility Type (Side-by-Side Dropdowns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project Role Dropdown */}
          <div id="field-projectRole" className="space-y-1.5 flex flex-col">
            <label
              className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
            >
              Project Role
            </label>
            <AppraisalSelectWithOther
              id="select-projectRole"
              value={projectRole}
              onChange={handleRoleChange}
              options={PROJECT_ROLE_OPTIONS}
              placeholder="Select Project Role..."
              customPlaceholder="Type your project role..."
              prefixIcon={<UserCheck size={16} className="text-[#4318FF] shrink-0" />}
            />
          </div>

          {/* Responsibility Type Dropdown */}
          <div id="field-responsibilityType" className="space-y-1.5 flex flex-col">
            <label
              className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
            >
              Responsibility Type
            </label>
            <AppraisalSelectWithOther
              id="select-responsibilityType"
              value={responsibilityType}
              onChange={handleResponsibilityTypeChange}
              options={RESPONSIBILITY_TYPE_OPTIONS}
              placeholder="Select Responsibility Type..."
              customPlaceholder="Type your responsibility type..."
              prefixIcon={<ShieldCheck size={16} className="text-[#4318FF] shrink-0" />}
            />
          </div>
        </div>

        {/* 5. Key Responsibilities (Text area) */}
        <div id="field-keyResponsibilities" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-keyResponsibilities"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
          >
            Key Responsibilities
          </label>
          <div
            className="eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1"
            onClick={() => document.getElementById("input-keyResponsibilities")?.focus()}
          >
            <textarea
              id="input-keyResponsibilities"
              rows={3}
              value={keyResponsibilities}
              onChange={(e) => handleKeyResponsibilitiesChange(e.target.value)}
              placeholder="Outline your primary duties, ownership areas, and core functions for this project..."
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1"
            />
          </div>
        </div>

        {/* 6 & 7. Challenges Faced & Solutions Implemented (Side-by-Side Text areas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Challenges Faced Card */}
          <div id="field-challengesFaced" className="space-y-1.5 flex flex-col">
            <label
              htmlFor="input-challengesFaced"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between"
            >
              <span>
                Challenges Faced <span className="text-red-500">*</span>
              </span>
            </label>
            <div
              className={`eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1 ${
                challengesError ? "eval-field-has-error" : ""
              }`}
              onClick={() => document.getElementById("input-challengesFaced")?.focus()}
            >
              <textarea
                id="input-challengesFaced"
                rows={3}
                value={challengesFaced}
                onChange={(e) => handleChallengesChange(e.target.value)}
                placeholder="Describe the technical or organizational challenges faced..."
                className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1"
              />
            </div>
            {challengesError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{challengesError}</span>
              </p>
            )}
          </div>

          {/* Solutions Implemented Card */}
          <div id="field-solutionsImplemented" className="space-y-1.5 flex flex-col">
            <label
              htmlFor="input-solutionsImplemented"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
            >
              Solutions Implemented
            </label>
            <div
              className="eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1"
              onClick={() => document.getElementById("input-solutionsImplemented")?.focus()}
            >
              <textarea
                id="input-solutionsImplemented"
                rows={3}
                value={solutionsImplemented}
                onChange={(e) => handleSolutionsChange(e.target.value)}
                placeholder="Detail the solutions, architectures, or workarounds you executed..."
                className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1"
              />
            </div>
          </div>
        </div>

        {/* Leadership Qualities & Client Review & Feedback (Side-by-Side Text areas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Leadership Qualities Card */}
          <div id="field-leadershipQualities" className="space-y-1.5 flex flex-col">
            <label
              htmlFor="input-leadershipQualities"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
            >
              Leadership Qualities
            </label>
            <div
              className="eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1"
              onClick={() => document.getElementById("input-leadershipQualities")?.focus()}
            >
              <textarea
                id="input-leadershipQualities"
                rows={3}
                value={leadershipQualities}
                onChange={(e) => handleLeadershipQualitiesChange(e.target.value)}
                placeholder="Mention mentorship, initiative, decision-making, or team leadership examples..."
                className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1"
              />
            </div>
          </div>

          {/* Client Review & Feedback Card */}
          <div id="field-clientReviewFeedback" className="space-y-1.5 flex flex-col">
            <label
              htmlFor="input-clientReviewFeedback"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
            >
              Client Review & Feedback
            </label>
            <div
              className="eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1"
              onClick={() => document.getElementById("input-clientReviewFeedback")?.focus()}
            >
              <textarea
                id="input-clientReviewFeedback"
                rows={3}
                value={clientReviewFeedback}
                onChange={(e) => handleClientReviewFeedbackChange(e.target.value)}
                placeholder="Enter client praise, appreciation, stakeholder ratings, or feedback received..."
                className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1"
              />
            </div>
          </div>
        </div>

        {/* 8. Key Achievements / Outcomes (Text area) */}
        <div id="field-keyAchievementsOutcomes" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-keyAchievementsOutcomes"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
          >
            Key Achievements / Outcomes
          </label>
          <div
            className="eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1"
            onClick={() => document.getElementById("input-keyAchievementsOutcomes")?.focus()}
          >
            <textarea
              id="input-keyAchievementsOutcomes"
              rows={3}
              value={keyAchievementsOutcomes}
              onChange={(e) => handleOutcomesChange(e.target.value)}
              placeholder="Highlight measurable impact, performance gains, business wins, or client satisfaction..."
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1"
            />
          </div>
        </div>

        {/* 9. Technologies Used (Multi-select) */}
        <div id="field-technologiesUsed" className="space-y-1.5 flex flex-col">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
            Technologies Used
          </label>
          <div className="eval-step-card !p-3 space-y-2.5">
            {/* Selected Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              {technologiesUsed.length === 0 ? (
                <span className="text-xs text-[#94A3B8] italic">No technologies selected yet. Click from suggested or type below:</span>
              ) : (
                technologiesUsed.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg shadow-2xs"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTechnology(tech)}
                      className="hover:text-red-600 transition-colors cursor-pointer"
                      title={`Remove ${tech}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Pick Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] mr-1">
                Suggested:
              </span>
              {COMMON_TECH_STACK.map((tech) => {
                const isSelected = technologiesUsed.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleRemoveTechnology(tech);
                      } else {
                        handleAddTechnology(tech);
                      }
                    }}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#2563EB] text-white border-[#2563EB] shadow-2xs"
                        : "bg-white text-[#334155] border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    {isSelected ? `✓ ${tech}` : `+ ${tech}`}
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTechnology(techInput);
                  }
                }}
                placeholder="Or type custom technology and press Enter..."
                className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-[#0F172A] outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddTechnology(techInput)}
                disabled={!techInput.trim()}
                className="px-2.5 py-1 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-[#DBEAFE] rounded-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Attachment & Save Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.zip"
              onChange={handleFileSelect}
            />
            {attachments.map((file) => (
              <AttachmentItem
                key={file.objectKey}
                file={file}
                canDelete
                onDelete={handleRemoveFile}
              />
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

          {/* Save / Update Form Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {editingIndex !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3.5 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-200 cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 border border-[#2563EB] rounded-xl transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingIndex !== null ? "Update Project" : "Save Project"}</span>
            </button>
          </div>
        </div>

        {/* Added Projects Accordion */}
        {projects.length > 0 && (
          <div ref={accordionContainerRef} className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Added Projects ({projects.length})
              </span>
            </div>

            {projects.map((project, index) => {
              const isExpanded = expandedIndex === index;
              const displayProjectName = project.projectName || "Untitled Project";

              return (
                <div
                  id={`accordion-project-${index}`}
                  key={`${displayProjectName}-${index}`}
                  className="bg-white border border-blue-200/80 hover:border-blue-400/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 scroll-mt-24"
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => toggleAccordion(index)}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-gradient-to-r from-white via-blue-50/20 to-white hover:bg-blue-50/30 cursor-pointer select-none group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0 px-2 py-0.5 text-[10px] font-extrabold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md">
                        Project {index + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] truncate group-hover:text-[#2563EB] transition-colors">
                        {displayProjectName}
                      </h4>
                      {project.projectRole && (
                        <span className="hidden sm:inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                          {project.projectRole}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {project.isDraft && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-300 rounded-md shadow-2xs mr-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Draft
                        </span>
                      )}

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProject(index);
                        }}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                          editingIndex === index
                            ? "text-white bg-[#2563EB] border border-[#2563EB]"
                            : "text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] hover:border-[#2563EB]"
                        }`}
                        title={editingIndex === index ? "Currently editing" : "Edit project"}
                        aria-label="Edit project"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveProject(index);
                        }}
                        className="inline-flex items-center justify-center w-7 h-7 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-lg transition-all duration-150 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        title="Delete project"
                        aria-label="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Accordion Chevron */}
                      <div className="p-0.5 rounded-md text-[#64748B] group-hover:text-[#2563EB] transition-colors">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                            isExpanded ? "rotate-180 text-[#2563EB]" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Accordion Body */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-3.5 py-2.5 border-t border-blue-100/70 space-y-2.5 bg-gradient-to-b from-blue-50/15 to-white text-xs">
                        {/* Meta Pills: Role & Responsibility */}
                        {(project.projectRole || project.responsibilityType) && (
                          <div className="flex flex-wrap items-center gap-2">
                            {project.projectRole && (
                              <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-[#0F172A] rounded-md font-semibold text-[11px]">
                                Role: <strong className="text-[#2563EB]">{project.projectRole}</strong>
                              </span>
                            )}
                            {project.responsibilityType && (
                              <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-[#0F172A] rounded-md font-semibold text-[11px]">
                                Type: <strong>{project.responsibilityType}</strong>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Project Description */}
                        <div className="space-y-1 flex flex-col">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-black block">
                            Project Description
                          </span>
                          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5">
                            <p className="text-xs text-black leading-relaxed whitespace-pre-line font-medium max-h-32 overflow-y-auto eval-custom-scrollbar pr-1.5 break-words">
                              {project.description || "—"}
                            </p>
                          </div>
                        </div>

                        {/* Key Responsibilities (if any) */}
                        {Boolean(project.keyResponsibilities) && (
                          <div className="space-y-1 flex flex-col">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-black block">
                              Key Responsibilities
                            </span>
                            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5">
                              <p className="text-xs text-black leading-relaxed whitespace-pre-line font-medium max-h-32 overflow-y-auto eval-custom-scrollbar pr-1.5 break-words">
                                {project.keyResponsibilities}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Side-by-Side: Challenges Faced & Solutions Implemented */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-stretch">
                          {/* Challenges Faced */}
                          <div className="space-y-1 flex flex-col">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-black block">
                              Challenges Faced
                            </span>
                            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex-1">
                              <p className="text-xs text-black leading-relaxed whitespace-pre-line font-medium max-h-32 overflow-y-auto eval-custom-scrollbar pr-1.5 break-words">
                                {project.challengesFaced || project.challenge || "—"}
                              </p>
                            </div>
                          </div>

                          {/* Solutions Implemented */}
                          <div className="space-y-1 flex flex-col">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-black block">
                              Solutions Implemented
                            </span>
                            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex-1">
                              <p className="text-xs text-black leading-relaxed whitespace-pre-line font-medium max-h-32 overflow-y-auto eval-custom-scrollbar pr-1.5 break-words">
                                {project.solutionsImplemented || "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Leadership Qualities & Client Review Feedback (if any) */}
                        {(Boolean(project.leadershipQualities) || Boolean(project.clientReviewFeedback)) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-stretch">
                            {Boolean(project.leadershipQualities) && (
                              <div className="space-y-1 flex flex-col">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-black block">
                                  Leadership Qualities
                                </span>
                                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex-1">
                                  <p className="text-xs text-black leading-relaxed whitespace-pre-line font-medium max-h-32 overflow-y-auto eval-custom-scrollbar pr-1.5 break-words">
                                    {project.leadershipQualities}
                                  </p>
                                </div>
                              </div>
                            )}
                            {Boolean(project.clientReviewFeedback) && (
                              <div className="space-y-1 flex flex-col">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-black block">
                                  Client Review & Feedback
                                </span>
                                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex-1">
                                  <p className="text-xs text-black leading-relaxed whitespace-pre-line font-medium max-h-32 overflow-y-auto eval-custom-scrollbar pr-1.5 break-words">
                                    {project.clientReviewFeedback}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Key Achievements / Outcomes (if any) */}
                        {Boolean(project.keyAchievementsOutcomes) && (
                          <div className="space-y-1 flex flex-col">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-black block">
                              Key Achievements / Outcomes
                            </span>
                            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5">
                              <p className="text-xs text-black leading-relaxed whitespace-pre-line font-medium max-h-32 overflow-y-auto eval-custom-scrollbar pr-1.5 break-words">
                                {project.keyAchievementsOutcomes}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Technologies Used Pills */}
                        {(project.technologiesUsed || []).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-black mr-1">
                              Technologies:
                            </span>
                            {(project.technologiesUsed || []).map((tech) => (
                              <span
                                key={tech}
                                className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Attached Documents */}
                        {(project.attachments || []).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-black mr-1">
                              Attachments ({(project.attachments || []).length}):
                            </span>
                            {(project.attachments || []).map((file) => (
                              <AttachmentItem
                                key={file.objectKey || file.fileName}
                                file={file}
                                readOnly
                              />
                            ))}
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
