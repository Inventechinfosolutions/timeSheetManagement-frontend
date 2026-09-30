import React from "react";
import { StepProps } from "../../../types/appraisal.types";
import { GraduationCap, BookOpen, Compass } from "lucide-react";

export const LearningGoalsStep: React.FC<StepProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-[#1B2559]">Step 4: Continuous Learning & Goals</h3>
        <p className="text-xs text-[#707EAE] mt-0.5">
          Record your skill development, courses or certifications taken, and future learning ambitions.
        </p>
      </div>

      <div className="space-y-5">
        {/* Skills Acquired */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>New Tools & Technical / Soft Skills Acquired <span className="text-red-500">*</span></span>
          </label>
          <textarea
            rows={3}
            value={formData.skillsAcquired}
            onChange={(e) => onChange("skillsAcquired", e.target.value)}
            placeholder="Highlight any technical frameworks, tools, architectures, or soft skills you developed..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>

        {/* Certifications or Courses */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>Certifications, Courses, or Workshops Attended</span>
          </label>
          <textarea
            rows={3}
            value={formData.certificationsOrCourses}
            onChange={(e) => onChange("certificationsOrCourses", e.target.value)}
            placeholder="List any internal or external courses, webinars, workshops, or certifications..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>

        {/* Next Quarter Learning Goals */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <Compass className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>Learning & Career Development Goals for Next Quarter <span className="text-red-500">*</span></span>
          </label>
          <textarea
            rows={3}
            value={formData.nextQuarterLearningGoals}
            onChange={(e) => onChange("nextQuarterLearningGoals", e.target.value)}
            placeholder="What specific competencies or milestones do you intend to focus on next?..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default LearningGoalsStep;
