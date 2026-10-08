import React, { useEffect, useRef, useState } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { AlertCircle, ChevronDown, Pencil, Trash2 } from "lucide-react";

export const LearningGoalsStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
}) => {
  const draft = formData.learningGoals || "";
  const goals = formData.learningGoalItems || [];
  const accordionContainerRef = useRef<HTMLDivElement | null>(null);
  const [addError, setAddError] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const listError = errors?.learningGoals;

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
          const itemEl = document.getElementById(`accordion-goal-${index}`);
          if (itemEl) {
            itemEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 60);
        return index;
      }
      return null;
    });
  };

  const handleChange = (val: string) => {
    onChange("learningGoals", val);
    setAddError("");
    if (clearError) {
      clearError("learningGoals");
    }
  };

  const handleAddGoal = () => {
    const next = draft.trim();
    if (!next) {
      setAddError("Learning goal is required.");
      return;
    }
    const saved = [...goals, next];
    onChange("learningGoalItems", saved);
    onChange("learningGoals", "");
    onChange("skillsAcquired", saved.join("\n"));
    onChange("nextQuarterLearningGoals", saved.join("\n"));
    setAddError("");
    if (clearError) {
      clearError("learningGoals");
    }
  };

  const handleEditGoal = (targetIndex: number) => {
    const goalToEdit = goals[targetIndex];
    if (!goalToEdit) return;

    const currentDraft = draft.trim();
    const updatedGoals = [...goals];

    if (currentDraft) {
      // Swap currently drafted text into the accordion list at targetIndex
      updatedGoals[targetIndex] = currentDraft;
      if (expandedIndex === targetIndex) {
        setExpandedIndex(null);
      }
    } else {
      // Remove from list if input was empty
      updatedGoals.splice(targetIndex, 1);
      if (expandedIndex === targetIndex) {
        setExpandedIndex(null);
      } else if (expandedIndex !== null && expandedIndex > targetIndex) {
        setExpandedIndex(expandedIndex - 1);
      }
    }

    onChange("learningGoalItems", updatedGoals);
    onChange("skillsAcquired", updatedGoals.join("\n"));
    onChange("nextQuarterLearningGoals", updatedGoals.join("\n"));
    onChange("learningGoals", goalToEdit);

    setAddError("");
    if (clearError) {
      clearError("learningGoals");
    }

    // Smooth scroll to the input form and focus textarea
    const inputElement = document.getElementById("field-learningGoals");
    if (inputElement) {
      inputElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTimeout(() => {
      const textarea = document.getElementById("input-learningGoals");
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  };

  const handleRemoveGoal = (index: number) => {
    const saved = goals.filter((_, itemIndex) => itemIndex !== index);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
    onChange("learningGoalItems", saved);
    onChange("skillsAcquired", saved.join("\n"));
    onChange("nextQuarterLearningGoals", saved.join("\n"));
  };

  return (
    <div className="space-y-6">
      <div
        id="field-learningGoals"
        className="flex items-start justify-between gap-3 border-b border-blue-100 pb-4 scroll-mt-24"
      >
        <div>
          <h3 className="text-lg font-bold text-[#0F172A]">
            <span className="eval-title-anim">Step 4: Continuous Learning & Goals</span>
            <span className="eval-title-accent-line" />
          </h3>
          <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
            Document the technical skills acquired, certifications completed, and future learning ambitions.
          </p>
          {listError && (
            <p className="text-xs text-red-600 font-semibold mt-2">{listError}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddGoal}
          className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] hover:border-[#2563EB] rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] mr-0.5 mt-0.5"
        >
          <span className="tracking-wide">+ Add more</span>
        </button>
      </div>

      <div className="space-y-4">
        <div
          className={`eval-step-card space-y-2.5 transition-all duration-200 ${
            addError ? "eval-field-has-error" : ""
          }`}
        >
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
            <span>
              Learning Goals <span className="text-red-500">*</span>
            </span>
          </label>
          <textarea
            id="input-learningGoals"
            rows={7}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Highlight new technical frameworks learned, courses or certifications completed, and your core learning and career development goals for the upcoming quarter..."
            className={`eval-textarea-field leading-relaxed text-sm ${
              addError ? "eval-input-error" : ""
            }`}
          />
          {addError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{addError}</span>
            </p>
          )}
        </div>

        {goals.length > 0 && (
          <div ref={accordionContainerRef} className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Added Goals ({goals.length})
              </span>
            </div>

            {goals.map((goal, index) => {
              const isExpanded = expandedIndex === index;

              return (
                <div
                  id={`accordion-goal-${index}`}
                  key={`${goal.slice(0, 30)}-${index}`}
                  className="bg-white border border-blue-200/80 hover:border-blue-400/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 scroll-mt-24"
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => toggleAccordion(index)}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 bg-gradient-to-r from-white via-blue-50/20 to-white hover:bg-blue-50/30 cursor-pointer select-none group transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 px-2.5 py-1 text-[11px] font-extrabold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
                        Goal {index + 1}
                      </span>
                      <h4 className="text-sm font-bold text-[#0F172A] truncate group-hover:text-[#2563EB] transition-colors">
                        {goal.split("\n")[0] || "Untitled Goal"}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Edit Button - Icon Only */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditGoal(index);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] hover:border-[#2563EB] rounded-xl transition-all duration-150 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        title="Edit goal (swaps into input box)"
                        aria-label="Edit goal"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button - Icon Only */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGoal(index);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-xl transition-all duration-150 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        title="Delete goal"
                        aria-label="Delete goal"
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
                        <div className="eval-step-card space-y-2">
                          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                            <span>Learning Goal Details</span>
                          </label>
                          <div className="eval-textarea-field mt-2 min-h-[96px] whitespace-pre-line leading-relaxed bg-white text-[#334155]">
                            {goal || "—"}
                          </div>
                        </div>
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

export default LearningGoalsStep;
