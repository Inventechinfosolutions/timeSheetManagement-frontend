import React, { useState } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { AlertCircle, X } from "lucide-react";

export const LearningGoalsStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
}) => {
  const draft = formData.learningGoals || "";
  const goals = formData.learningGoalItems || [];
  const [addError, setAddError] = useState("");
  const listError = errors?.learningGoals;

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

  const handleRemoveGoal = (index: number) => {
    const saved = goals.filter((_, itemIndex) => itemIndex !== index);
    onChange("learningGoalItems", saved);
    onChange("skillsAcquired", saved.join("\n"));
    onChange("nextQuarterLearningGoals", saved.join("\n"));
  };

  return (
    <div className="space-y-6">
      <div id="field-learningGoals" className="flex items-start justify-between gap-3 border-b border-[#D3A29D]/30 pb-4">
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
          className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#A36361] bg-gradient-to-r from-[#FAF2EE] via-white to-[#F8EFEA] border border-[#D3A29D]/50 hover:border-[#A36361] rounded-xl transition-all duration-200 cursor-pointer"
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
          <div className="space-y-2">
            {goals.map((goal, index) => (
              <div
                key={`${goal}-${index}`}
                className="flex items-start justify-between gap-3 px-3.5 py-3 bg-white border border-[#D3A29D]/40 rounded-xl"
              >
                <p className="text-sm text-[#0F172A] whitespace-pre-line">{goal}</p>
                <button
                  type="button"
                  onClick={() => handleRemoveGoal(index)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer"
                  title="Remove goal"
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

export default LearningGoalsStep;
