import React from "react";
import { StepProps } from "../../../types/appraisal.types";
import { Users, HeartHandshake, UserCheck } from "lucide-react";

export const TeamContributionStep: React.FC<StepProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-[#1B2559]">Step 3: Teamwork & Collaboration</h3>
        <p className="text-xs text-[#707EAE] mt-0.5">
          Reflect on how you collaborated with peers, shared knowledge, and supported the broader team.
        </p>
      </div>

      <div className="space-y-5">
        {/* Cross-functional Collaboration */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <Users className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>Collaboration with Team & Other Departments <span className="text-red-500">*</span></span>
          </label>
          <textarea
            rows={3}
            value={formData.collaborationDetails}
            onChange={(e) => onChange("collaborationDetails", e.target.value)}
            placeholder="How did you work across functions, collaborate with colleagues, and ensure alignment?..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>

        {/* Mentorship */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>Mentorship, Knowledge Sharing & Onboarding</span>
          </label>
          <textarea
            rows={3}
            value={formData.mentorshipAssistance}
            onChange={(e) => onChange("mentorshipAssistance", e.target.value)}
            placeholder="Share instances where you assisted peers, mentored team members, or documented key knowledge..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>

        {/* Peer Support */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>Peer Support & Team Culture Contribution</span>
          </label>
          <textarea
            rows={3}
            value={formData.peerSupport}
            onChange={(e) => onChange("peerSupport", e.target.value)}
            placeholder="Describe your role in fostering a positive, productive, and inclusive team environment..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default TeamContributionStep;
