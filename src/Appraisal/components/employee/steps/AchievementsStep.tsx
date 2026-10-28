import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { StepProps, PerformanceProject, ProjectRoleEnum, ResponsibilityTypeEnum } from "../../../types/appraisal.types";
import { AlertCircle, X, Paperclip, ChevronDown, Pencil, Trash2, Check, Plus, UserCheck, ShieldCheck, Loader2 } from "lucide-react";
import { message, Modal } from "antd";
import { readApiError } from "../../../reducers/appraisal.reducer";
import AttachmentItem from "../../common/AttachmentItem";
import "../AppraisalDashboard.css";

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
            className="flex-1 min-w-0 bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm font-normal text-[#0F172A]"
            autoFocus
          />
        ) : (
          <span
            className={`flex-1 min-w-0 text-left truncate ${
              !value ? "text-slate-400 font-normal text-sm" : "text-[#0F172A] text-sm font-normal"
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
  readOnly = false,
  onSaveProject,
  onPersistDraft,
  onDeleteProject,
}) => {
  const projectName = formData.projectName || "";
  const projectDescription = formData.projectDescription ?? "";
  const projectRole = formData.projectRole ?? "";
  const responsibilityType = formData.responsibilityType ?? "";
  const leadershipQualities = formData.leadershipQualities ?? "";
  const clientReviewFeedback = formData.clientReviewFeedback ?? "";
  const keyResponsibilities = formData.keyResponsibilities ?? "";
  const challengesFaced = formData.challengesFaced || formData.projectChallenge || "";
  const projectChallenge = formData.projectChallenge || formData.challengesFaced || "";
  const solutionsImplemented = formData.solutionsImplemented ?? "";
  const keyAchievementsOutcomes = formData.keyAchievementsOutcomes ?? "";
  const technologiesUsed = formData.technologiesUsed || [];
  const projects = formData.projects || [];
  const attachments = formData.projectAttachments || [];

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const accordionContainerRef = useRef<HTMLDivElement | null>(null);
  const [techInput, setTechInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [expandedIndex, setExpandedIndex] = useState<number | null>(readOnly && projects.length > 0 ? 0 : null);
  const [projectToDelete, setProjectToDelete] = useState<{ index: number; name: string } | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const editingIndex =
    formData.editingProjectIndex !== undefined && formData.editingProjectIndex !== null
      ? formData.editingProjectIndex
      : null;
  const setEditingIndex = (idx: number | null) => {
    onChange("editingProjectIndex", idx);
  };
  const currentProjectNumber =
    editingIndex !== null && editingIndex >= 0
      ? editingIndex + 1
      : projects.length + 1;

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
    !projectRole.trim() &&
    !responsibilityType.trim() &&
    !keyResponsibilities.trim() &&
    !challengesFaced.trim() &&
    !keyAchievementsOutcomes.trim() &&
    technologiesUsed.length === 0;
  const hasSavedProject = projects.length > 0;
  const showDraftErrors = !(draftIsEmpty && hasSavedProject);
  const nameError = showDraftErrors ? errors?.projectName || addErrors.projectName : "";
  const descriptionError = showDraftErrors ? errors?.projectDescription || addErrors.projectDescription : "";
  const challengesError = showDraftErrors ? errors?.challengesFaced || errors?.projectChallenge || addErrors.challengesFaced : "";
  const roleError = showDraftErrors ? errors?.projectRole || addErrors.projectRole : "";
  const responsibilityTypeError = showDraftErrors ? errors?.responsibilityType || addErrors.responsibilityType : "";
  const keyResponsibilitiesError = showDraftErrors ? errors?.keyResponsibilities || addErrors.keyResponsibilities : "";
  const outcomesError = showDraftErrors ? errors?.keyAchievementsOutcomes || addErrors.keyAchievementsOutcomes : "";
  const techError = showDraftErrors ? errors?.technologiesUsed || addErrors.technologiesUsed : "";

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
    if (clearError) {
      clearError("projectRole");
      clearError("projects");
    }
  };

  const handleResponsibilityTypeChange = (val: string) => {
    onChange("responsibilityType", val);
    setAddErrors((prev) => ({ ...prev, responsibilityType: "" }));
    if (clearError) {
      clearError("responsibilityType");
      clearError("projects");
    }
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
    setAddErrors((prev) => ({ ...prev, keyResponsibilities: "" }));
    if (clearError) {
      clearError("keyResponsibilities");
      clearError("projects");
    }
  };

  const handleSolutionsChange = (val: string) => {
    onChange("solutionsImplemented", val);
    if (clearError) clearError("solutionsImplemented");
  };

  const handleOutcomesChange = (val: string) => {
    onChange("keyAchievementsOutcomes", val);
    setAddErrors((prev) => ({ ...prev, keyAchievementsOutcomes: "" }));
    if (clearError) {
      clearError("keyAchievementsOutcomes");
      clearError("projects");
    }
  };

  const handleAddTechnology = (tech: string) => {
    const trimmed = tech.trim();
    if (!trimmed) return;
    const existing = technologiesUsed.find(
      (item) => item.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      const duplicateMessage = `${existing} is already added.`;
      setAddErrors((prev) => ({ ...prev, technologiesUsed: duplicateMessage }));
      message.error(duplicateMessage);
      setTechInput("");
      return;
    }
    onChange("technologiesUsed", [...technologiesUsed, trimmed]);
    setAddErrors((prev) => ({ ...prev, technologiesUsed: "" }));
    if (clearError) {
      clearError("technologiesUsed");
      clearError("projects");
    }
    setTechInput("");
  };

  const handleRemoveTechnology = (techToRemove: string) => {
    const nextTechs = technologiesUsed.filter((item) => item !== techToRemove);
    onChange("technologiesUsed", nextTechs);
    if (nextTechs.length === 0) {
      setAddErrors((prev) => ({ ...prev, technologiesUsed: "At least one technology is required." }));
    }
  };

  const handleSaveProject = async () => {
    const name = projectName.trim();
    const description = projectDescription.trim();
    const challenge = challengesFaced.trim() || projectChallenge.trim();
    const role = projectRole.trim();
    const respType = responsibilityType.trim();
    const keyResp = keyResponsibilities.trim();
    const outcomes = keyAchievementsOutcomes.trim();
    const techs = technologiesUsed;

    const nextErrors: Record<string, string> = {};
    if (!name) nextErrors.projectName = "Project name is required.";
    if (!description) nextErrors.projectDescription = "Project description is required.";
    if (!role) nextErrors.projectRole = "Project role is required.";
    if (!respType) nextErrors.responsibilityType = "Responsibility type is required.";
    if (!keyResp) nextErrors.keyResponsibilities = "Key responsibilities is required.";
    if (!challenge) nextErrors.challengesFaced = "Challenges faced is required.";
    if (!outcomes) nextErrors.keyAchievementsOutcomes = "Key achievements / outcomes is required.";
    if (techs.length === 0) nextErrors.technologiesUsed = "At least one technology is required.";

    setAddErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (!name) {
        document.getElementById("input-projectName")?.focus();
      } else if (!description) {
        document.getElementById("input-projectDescription")?.focus();
      } else if (!role) {
        document.getElementById("field-projectRole")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (!respType) {
        document.getElementById("field-responsibilityType")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (!keyResp) {
        document.getElementById("input-keyResponsibilities")?.focus();
      } else if (!challenge) {
        document.getElementById("input-challengesFaced")?.focus();
      } else if (!outcomes) {
        document.getElementById("input-keyAchievementsOutcomes")?.focus();
      } else if (techs.length === 0) {
        document.getElementById("field-technologiesUsed")?.scrollIntoView({ behavior: "smooth", block: "center" });
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
    const isEditing = editingIndex !== null && editingIndex >= 0 && editingIndex < projects.length;
    let targetIndex = projects.length;
    if (isEditing && editingIndex !== null) {
      nextProjects = [...projects];
      nextProjects[editingIndex] = savedProject;
      targetIndex = editingIndex;
    } else {
      nextProjects = [...projects, savedProject];
      targetIndex = projects.length;
    }

    if (onSaveProject) {
      setSavingProject(true);
      try {
        const success = await onSaveProject(nextProjects);
        if (!success) {
          message.error("Failed to save project. Please check the fields and try again.");
          return;
        }
        message.success(isEditing ? "Project updated successfully!" : "Project saved successfully!");
      } catch (err: any) {
        message.error(readApiError(err) || "Failed to save project.");
        return;
      } finally {
        setSavingProject(false);
      }
    } else {
      onChange("projects", nextProjects);
    }

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
    setExpandedIndex(targetIndex);
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

  const storeDraft = async (nextProjects: PerformanceProject[], draftIndex: number) => {
    if (onPersistDraft) {
      const saved = await onPersistDraft(nextProjects, draftIndex);
      if (!saved) {
        message.error("Failed to save draft.");
        return false;
      }
    }
    onChange("projects", nextProjects);
    return true;
  };

  const handleAddMoreClick = async () => {
    if (editingIndex !== null) {
      const originalProject = projects[editingIndex];
      // Only preserve as draft if this item was ALREADY a draft
      if (originalProject?.isDraft && !draftIsEmpty) {
        const nextProjects = [...projects];
        nextProjects[editingIndex] = {
          ...nextProjects[editingIndex],
          projectName: projectName.trim() || nextProjects[editingIndex]?.projectName || "Untitled Project",
          description: projectDescription.trim(),
          challenge: challengesFaced.trim(),
          challengesFaced: challengesFaced.trim(),
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
        const saved = await storeDraft(nextProjects, editingIndex);
        if (!saved) return;
      }
      handleCancelEdit();
    } else if (!draftIsEmpty) {
      // If user was drafting a new project and clicked "+ Add more", save it as draft
      const currentDraft: PerformanceProject = {
        projectName: projectName.trim() || "Untitled Project",
        description: projectDescription.trim(),
        challenge: challengesFaced.trim(),
        challengesFaced: challengesFaced.trim(),
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
      const nextProjects = [...projects, currentDraft];
      const saved = await storeDraft(nextProjects, nextProjects.length - 1);
      if (!saved) return;
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

  const handleEditProject = async (targetIndex: number) => {
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
          challenge: challengesFaced.trim(),
          challengesFaced: challengesFaced.trim(),
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
        const saved = await storeDraft(nextProjects, nextProjects.length - 1);
        if (!saved) return;
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
          challenge: challengesFaced.trim(),
          challengesFaced: challengesFaced.trim(),
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
        const saved = await storeDraft(nextProjects, editingIndex);
        if (!saved) return;
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

  const handleConfirmRemoveProject = (index: number) => {
    const proj = projects[index];
    const name = proj?.projectName?.trim() || `Project ${index + 1}`;
    setProjectToDelete({ index, name });
  };

  const handleCancelDelete = () => {
    if (isDeletingProject) return;
    setProjectToDelete(null);
  };

  const handleExecuteDelete = async () => {
    if (!projectToDelete || isDeletingProject) return;
    setIsDeletingProject(true);
    try {
      await handleRemoveProject(projectToDelete.index);
    } finally {
      setIsDeletingProject(false);
      setProjectToDelete(null);
    }
  };

  const handleRemoveProject = async (index: number) => {
    const removed = projects[index];
    // Call DELETE API for any attachments in this project
    if (removed?.attachments && removed.attachments.length > 0 && onRemoveAttachment) {
      for (const file of removed.attachments) {
        if (file.objectKey) {
          try {
            await onRemoveAttachment(file.objectKey);
          } catch (err) {
            console.error("[Appraisal] Failed to delete attachment via DELETE API:", err);
          }
        }
      }
    }

    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }

    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }

    const nextProjects = projects.filter((_, itemIndex) => itemIndex !== index);
    if (onDeleteProject) {
      try {
        const success = await onDeleteProject(index, nextProjects);
        if (success) {
          message.success("Project deleted successfully");
          console.info("[Appraisal] Project deleted via DELETE API successfully:", removed?.projectName);
        } else {
          message.error("Failed to delete project");
        }
      } catch (err: any) {
        message.error(readApiError(err) || "Failed to delete project");
        console.error("[Appraisal] Failed to delete project:", err);
      }
    } else if (onSaveProject) {
      try {
        const success = await onSaveProject(nextProjects);
        if (success) {
          message.success("Project deleted successfully");
          console.info("[Appraisal] Project deleted successfully:", removed?.projectName);
        } else {
          message.error("Failed to delete project");
        }
      } catch (err: any) {
        message.error(readApiError(err) || "Failed to delete project");
        console.error("[Appraisal] Failed to delete project:", err);
      }
    } else {
      onChange("projects", nextProjects);
      message.success("Project deleted successfully");
    }
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
      const err = "You can attach up to 5 files.";
      setUploadError(err);
      message.warning(err);
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const stored = await onUploadAttachment(file);
      onChange("projectAttachments", [...attachments, stored]);
      message.success(`Document "${file.name}" uploaded successfully`);
      console.info("[Appraisal] Document attached to project:", file.name);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : readApiError(error);
      setUploadError(errMsg);
      message.error(errMsg);
      console.error("[Appraisal] Failed to upload document:", error);
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
      <div id="field-projects" className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] pb-4 scroll-mt-24">
        <div>
          <h3 className="text-lg font-bold text-[#0F172A]">
            <span className="eval-title-anim">Step 2: Key Achievements & Projects</span>
            <span className="eval-title-accent-line" />
          </h3>
          <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
            Detail your project deliverables, project role, key responsibilities, challenges, and solutions.
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={handleAddMoreClick}
            className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] hover:border-[#2563EB] rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] mr-0.5 mt-0.5"
          >
            <span className="tracking-wide">+ Add more project</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Project Number Indicator */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="shrink-0 px-2.5 py-0.5 text-[11px] font-extrabold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md shadow-2xs">
            Project {currentProjectNumber}
          </span>
          {editingIndex !== null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md">
              <Pencil className="w-2.5 h-2.5" />
              Editing
            </span>
          )}
        </div>

        {/* 1. Project Name (Text area) */}
        <div id="field-projectName" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-projectName"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
          >
            <span>
              Project Name <span className="text-red-500">*</span>
            </span>
          </label>
          <textarea
            id="input-projectName"
            rows={2}
            value={projectName}
            onChange={(e) => handleNameChange(e.target.value)}
            className={`eval-textarea-field leading-relaxed text-sm font-normal ${
              nameError ? "eval-input-error" : ""
            }`}
          />
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
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
          >
            <span>
              Project Description <span className="text-red-500">*</span>
            </span>
          </label>
          <textarea
            id="input-projectDescription"
            rows={3}
            value={projectDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className={`eval-textarea-field leading-relaxed text-sm font-normal ${
              descriptionError ? "eval-input-error" : ""
            }`}
          />
          {descriptionError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{descriptionError}</span>
            </p>
          )}
        </div>

        {/* 3 & 4. Project Role & Responsibility Type (Side-by-Side Dropdowns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Project Role Dropdown */}
          <div id="field-projectRole" className="space-y-1.5 flex flex-col">
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
            >
              <span>
                Project Role <span className="text-red-500">*</span>
              </span>
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
            {roleError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{roleError}</span>
              </p>
            )}
          </div>

          {/* Responsibility Type Dropdown */}
          <div id="field-responsibilityType" className="space-y-1.5 flex flex-col">
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
            >
              <span>
                Responsibility Type <span className="text-red-500">*</span>
              </span>
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
            {responsibilityTypeError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{responsibilityTypeError}</span>
              </p>
            )}
          </div>
        </div>

        {/* 5. Key Responsibilities (Text area) */}
        <div id="field-keyResponsibilities" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-keyResponsibilities"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
          >
            <span>
              Key Responsibilities <span className="text-red-500">*</span>
            </span>
          </label>
          <textarea
            id="input-keyResponsibilities"
            rows={3}
            value={keyResponsibilities}
            onChange={(e) => handleKeyResponsibilitiesChange(e.target.value)}
            className={`eval-textarea-field leading-relaxed text-sm font-normal ${
              keyResponsibilitiesError ? "eval-input-error" : ""
            }`}
          />
          {keyResponsibilitiesError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{keyResponsibilitiesError}</span>
            </p>
          )}
        </div>

        {/* 6 & 7. Challenges Faced & Solutions Implemented (Side-by-Side Text areas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Challenges Faced Card */}
          <div id="field-challengesFaced" className="space-y-1.5 flex flex-col">
            <label
              htmlFor="input-challengesFaced"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
            >
              <span>
                Challenges Faced <span className="text-red-500">*</span>
              </span>
            </label>
            <textarea
              id="input-challengesFaced"
              rows={3}
              value={challengesFaced}
              onChange={(e) => handleChallengesChange(e.target.value)}
              className={`eval-textarea-field leading-relaxed text-sm font-normal ${
                challengesError ? "eval-input-error" : ""
              }`}
            />
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
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
            >
              Solutions Implemented
            </label>
            <textarea
              id="input-solutionsImplemented"
              rows={3}
              value={solutionsImplemented}
              onChange={(e) => handleSolutionsChange(e.target.value)}
              className="eval-textarea-field leading-relaxed text-sm font-normal"
            />
          </div>
        </div>

        {/* Leadership Qualities & Client Review & Feedback (Side-by-Side Text areas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Leadership Qualities Card */}
          <div id="field-leadershipQualities" className="space-y-1.5 flex flex-col">
            <label
              htmlFor="input-leadershipQualities"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
            >
              Leadership Qualities
            </label>
            <textarea
              id="input-leadershipQualities"
              rows={3}
              value={leadershipQualities}
              onChange={(e) => handleLeadershipQualitiesChange(e.target.value)}
              className="eval-textarea-field leading-relaxed text-sm font-normal"
            />
          </div>

          {/* Client Review & Feedback Card */}
          <div id="field-clientReviewFeedback" className="space-y-1.5 flex flex-col">
            <label
              htmlFor="input-clientReviewFeedback"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
            >
              Client Review & Feedback
            </label>
            <textarea
              id="input-clientReviewFeedback"
              rows={3}
              value={clientReviewFeedback}
              onChange={(e) => handleClientReviewFeedbackChange(e.target.value)}
              className="eval-textarea-field leading-relaxed text-sm font-normal"
            />
          </div>
        </div>

        {/* 8. Key Achievements / Outcomes (Text area) */}
        <div id="field-keyAchievementsOutcomes" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-keyAchievementsOutcomes"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
          >
            <span>
              Key Achievements / Outcomes <span className="text-red-500">*</span>
            </span>
          </label>
          <textarea
            id="input-keyAchievementsOutcomes"
            rows={3}
            value={keyAchievementsOutcomes}
            onChange={(e) => handleOutcomesChange(e.target.value)}
            className={`eval-textarea-field leading-relaxed text-sm font-normal ${
              outcomesError ? "eval-input-error" : ""
            }`}
          />
          {outcomesError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{outcomesError}</span>
            </p>
          )}
        </div>

        {/* 9. Technologies Used (Multi-select) */}
        <div id="field-technologiesUsed" className="space-y-1.5 flex flex-col">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1">
            <span>
              Technologies Used <span className="text-red-500">*</span>
            </span>
          </label>
          <div className={`eval-step-card !p-3 space-y-2.5 ${techError ? "eval-field-has-error border-red-300" : ""}`}>
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
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A] mr-1">
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
                onChange={(e) => {
                  setTechInput(e.target.value);
                  setAddErrors((prev) => ({ ...prev, technologiesUsed: "" }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTechnology(techInput);
                  }
                }}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-[#0F172A] outline-none focus:border-blue-500 font-normal"
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
          {techError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{techError}</span>
            </p>
          )}
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
                canDelete={!readOnly}
                onDelete={handleRemoveFile}
              />
            ))}
            {!readOnly && attachments.length < 5 && (
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
            {editingIndex !== null && !readOnly && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={savingProject}
                className="px-3.5 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-200 cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
            {!readOnly && (
              <button
                type="button"
                id="btn-save-project"
                disabled={savingProject}
                onClick={handleSaveProject}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed border border-[#2563EB] rounded-xl transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.98]"
              >
                {savingProject ? (
                  <>
                    <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{editingIndex !== null ? "Updating..." : "Saving..."}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingIndex !== null ? "Update Project" : "Save Project"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        {/* Added Projects Accordion */}
        {projects.length > 0 && (
          <div ref={accordionContainerRef} className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Added Projects ({projects.length})
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
              {projects.map((project, index) => {
                const isExpanded = expandedIndex === index;
                const displayProjectName = project.projectName || `Project ${index + 1}`;
                const projectError =
                  errors?.[`project_${index}`] ||
                  errors?.[`projects.${index}.description`] ||
                  errors?.[`projects.${index}.projectName`] ||
                  errors?.[`projects.${index}.projectRole`] ||
                  errors?.[`projects.${index}.responsibilityType`] ||
                  errors?.[`projects.${index}.keyResponsibilities`] ||
                  errors?.[`projects.${index}.challengesFaced`] ||
                  errors?.[`projects.${index}.challenge`] ||
                  errors?.[`projects.${index}.keyAchievementsOutcomes`] ||
                  errors?.[`projects.${index}.technologiesUsed`];

                const isDraftOrIncomplete =
                  project.isDraft ||
                  !project.projectName?.trim() ||
                  !project.description?.trim() ||
                  !project.projectRole?.trim() ||
                  !project.responsibilityType?.trim() ||
                  !project.keyResponsibilities?.trim() ||
                  !(project.challengesFaced?.trim() || project.challenge?.trim()) ||
                  !project.keyAchievementsOutcomes?.trim() ||
                  !Array.isArray(project.technologiesUsed) ||
                  project.technologiesUsed.length === 0;

                return (
                  <div
                    id={`accordion-project-${index}`}
                    key={`${displayProjectName}-${index}`}
                    className={`transition-colors ${
                      projectError ? "bg-red-50/15" : isDraftOrIncomplete ? "bg-amber-50/10" : "bg-white"
                    }`}
                  >
                    {/* Accordion Header (Old Design for Badge and Action Icons) */}
                    <div
                      onClick={() => toggleAccordion(index)}
                      className="flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50/70 cursor-pointer select-none group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="shrink-0 px-2.5 py-0.5 text-[11px] font-extrabold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md">
                          Project {index + 1}
                        </span>
                        <h4 className="text-sm font-bold text-[#0F172A] truncate group-hover:text-[#2563EB] transition-colors">
                          {displayProjectName}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {project.isDraft && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-[#10B981] rounded-md tracking-wide">
                            Draft
                          </span>
                        )}

                        {/* Edit Button */}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(index);
                            }}
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all duration-150 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                              editingIndex === index
                                ? "text-white bg-[#2563EB] border-[#2563EB]"
                                : "text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border-[#BFDBFE] hover:border-[#2563EB]"
                            }`}
                            title={editingIndex === index ? "Currently editing" : "Edit project"}
                            aria-label="Edit project"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Button */}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmRemoveProject(index);
                            }}
                            className="inline-flex items-center justify-center w-7 h-7 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-lg transition-all duration-150 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                            title="Delete project"
                            aria-label="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Accordion Chevron */}
                        <div className="p-1 rounded-lg text-[#64748B] group-hover:text-[#2563EB] transition-colors">
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ease-in-out ${
                              isExpanded ? "rotate-180 text-[#2563EB]" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Inline Validation Banner for Draft / Incomplete Projects */}
                    {(isDraftOrIncomplete || Boolean(projectError)) && (
                      <div
                        className={`px-4 py-1.5 border-t flex items-center justify-between gap-2 text-[11px] ${
                          projectError
                            ? "bg-red-50/90 border-red-200 text-red-700"
                            : "bg-amber-50/70 border-amber-200/70 text-amber-800"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-medium min-w-0">
                          <AlertCircle
                            className={`w-3.5 h-3.5 shrink-0 ${
                              projectError ? "text-red-500" : "text-amber-600"
                            }`}
                          />
                          <span className="truncate">
                            {projectError ||
                              (!project.projectName?.trim()
                                ? "Project name is required."
                                : !project.description?.trim()
                                ? "Project description is required."
                                : !project.projectRole?.trim()
                                ? "Project role is required."
                                : !project.responsibilityType?.trim()
                                ? "Responsibility type is required."
                                : !project.keyResponsibilities?.trim()
                                ? "Key responsibilities is required."
                                : !(project.challengesFaced?.trim() || project.challenge?.trim())
                                ? "Challenges faced is required."
                                : !project.keyAchievementsOutcomes?.trim()
                                ? "Key achievements / outcomes is required."
                                : (!project.technologiesUsed || project.technologiesUsed.length === 0)
                                ? "At least one technology is required."
                                : "Incomplete draft project.")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(index);
                          }}
                          className={`font-bold underline underline-offset-2 cursor-pointer shrink-0 ${
                            projectError ? "text-red-700 hover:text-red-900" : "text-amber-800 hover:text-amber-950"
                          }`}
                        >
                          Edit
                        </button>
                      </div>
                    )}

                    {/* Accordion Body with Clear Field Titles */}
                    <div
                      className={`grid transition-all duration-200 ease-in-out ${
                        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4 pt-2.5 space-y-3 text-xs border-t border-slate-100">
                          {/* Project Description with proper title */}
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A] block mb-1">
                              Project Description
                            </span>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-md p-2.5">
                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line break-words font-normal">
                                {project.description || "No description provided."}
                              </p>
                            </div>
                          </div>

                          {/* Role & Responsibility Type */}
                          {(project.projectRole || project.responsibilityType) && (
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                              {project.projectRole && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A]">
                                    Project Role:
                                  </span>
                                  <span className="font-normal text-slate-800">{project.projectRole}</span>
                                </div>
                              )}
                              {project.projectRole && project.responsibilityType && (
                                <span className="text-slate-300">•</span>
                              )}
                              {project.responsibilityType && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A]">
                                    Responsibility Type:
                                  </span>
                                  <span className="font-normal text-slate-800">{project.responsibilityType}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Key Responsibilities & Key Achievements */}
                          {(Boolean(project.keyResponsibilities) || Boolean(project.keyAchievementsOutcomes)) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {Boolean(project.keyResponsibilities) && (
                                <div className="bg-slate-50/70 border border-slate-100 rounded-md p-2.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A] block mb-1">
                                    Key Responsibilities
                                  </span>
                                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                                    {project.keyResponsibilities}
                                  </p>
                                </div>
                              )}
                              {Boolean(project.keyAchievementsOutcomes) && (
                                <div className="bg-slate-50/70 border border-slate-100 rounded-md p-2.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A] block mb-1">
                                    Key Achievements / Outcomes
                                  </span>
                                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                                    {project.keyAchievementsOutcomes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Challenges Faced & Solutions Implemented */}
                          {(Boolean(project.challengesFaced || project.challenge) || Boolean(project.solutionsImplemented?.trim())) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {(project.challengesFaced || project.challenge) && (
                                <div className="bg-slate-50/70 border border-slate-100 rounded-md p-2.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A] block mb-1">
                                    Challenges Faced
                                  </span>
                                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                                    {project.challengesFaced || project.challenge}
                                  </p>
                                </div>
                              )}
                              {Boolean(project.solutionsImplemented?.trim()) && (
                                <div className="bg-slate-50/70 border border-slate-100 rounded-md p-2.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A] block mb-1">
                                    Solutions Implemented
                                  </span>
                                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                                    {project.solutionsImplemented}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Leadership Qualities & Client Review Feedback (if entered) */}
                          {(Boolean(project.leadershipQualities) || Boolean(project.clientReviewFeedback)) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {Boolean(project.leadershipQualities) && (
                                <div className="bg-slate-50/70 border border-slate-100 rounded-md p-2.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A] block mb-1">
                                    Leadership Qualities
                                  </span>
                                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                                    {project.leadershipQualities}
                                  </p>
                                </div>
                              )}
                              {Boolean(project.clientReviewFeedback) && (
                                <div className="bg-slate-50/70 border border-slate-100 rounded-md p-2.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A] block mb-1">
                                    Client Review & Feedback
                                  </span>
                                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                                    {project.clientReviewFeedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Technologies Used */}
                          {(project.technologiesUsed || []).length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A] mr-1">
                                Technologies Used:
                              </span>
                              {(project.technologiesUsed || []).map((tech) => (
                                <span
                                  key={tech}
                                  className="px-2 py-0.5 text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200/60 rounded"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Attachments */}
                          {(project.attachments || []).length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A] mr-1">
                                Attachments:
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
          </div>
        )}
      </div>

      {/* Modern Custom Project Delete Confirmation Modal */}
      {projectToDelete && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0F172A]/25 backdrop-blur-[3.5px] animate-in fade-in duration-200"
          style={{ backdropFilter: "blur(3.5px)", WebkitBackdropFilter: "blur(3.5px)" }}
          onClick={handleCancelDelete}
        >
          <div
            className="relative w-full max-w-[420px] bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-100 text-[#0F172A] animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />

            {/* Close Button */}
            <button
              type="button"
              disabled={isDeletingProject}
              onClick={handleCancelDelete}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header: Icon + Title & Description in clean structured layout */}
            <div className="flex items-start gap-3.5 pt-1">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200/80 flex items-center justify-center text-red-600 shrink-0 shadow-xs">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight leading-snug">
                  Delete Project?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Are you sure you want to remove this project? This will permanently delete its details, challenges, solutions, and attached files.
                </p>
              </div>
            </div>

            {/* Project Preview Badge - clean, full width, no Irreversible tag */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 my-4 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none mb-1">
                  Project to be deleted
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={projectToDelete.name}>
                  {projectToDelete.name}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={handleCancelDelete}
                className="flex-1 sm:flex-initial py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={handleExecuteDelete}
                className="flex-1 sm:flex-initial py-2 px-5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeletingProject ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
                    <span>Delete Project</span>
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

export default AchievementsStep;
