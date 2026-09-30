import React, { useState, useEffect } from "react";
import { Plus, Users, CheckCircle2 } from "lucide-react";
import { AssignmentType, CreateReviewAssignmentModalProps } from "../../types/appraisal.types";
import { Modal, Button, Card } from "../../../components/ui";

export const CreateReviewAssignmentModal: React.FC<CreateReviewAssignmentModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  initialType = null,
}) => {
  const [selectedType, setSelectedType] = useState<AssignmentType | null>(initialType ?? null);

  // Ensure no default selection when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType ?? null);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (selectedType) {
      onContinue(selectedType);
    }
  };

  const modalTitle = (
    <div className="flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-[#4318FF] shrink-0 shadow-xs">
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </div>
      <div className="text-left">
        <h2 className="text-lg font-bold text-[#1B2559] leading-tight">
          Create Review Assignment
        </h2>
        <p className="text-xs text-[#A3AED0] mt-0.5 font-normal">
          Choose how you want to assign the quarterly review
        </p>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex justify-end w-full">
      <Button
        variant={selectedType ? "primary" : "secondary"}
        size="md"
        disabled={!selectedType}
        onClick={handleContinue}
        className={`px-7 py-2.5 rounded-xl font-bold transition-all duration-200 ${
          selectedType
            ? "bg-[#4318FF] hover:bg-[#3311CC] text-white shadow-md shadow-indigo-100 hover:shadow-lg cursor-pointer"
            : "bg-[#F4F7FE] text-[#A3AED0] hover:bg-[#F4F7FE] border-transparent cursor-not-allowed !shadow-none opacity-100"
        }`}
      >
        Continue
      </Button>
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={modalTitle}
      footer={modalFooter}
      maxWidth="md"
      className="rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 [&>div:first-child]:border-none [&>div:first-child]:pb-2 [&>div:last-child]:border-none [&>div:last-child]:pt-2"
    >
      {/* Options */}
      <div className="space-y-3.5 pt-2">
        {/* Option 1: Individual Member(s) */}
        <Card
          onClick={() => setSelectedType("individual")}
          className={`group flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-none ${
            selectedType === "individual"
              ? "border-[#4318FF] ring-2 ring-[#4318FF]/15 bg-white"
              : "border-[#E0E5F2] hover:border-gray-300 bg-white"
          }`}
        >
          {/* Custom Radio */}
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              selectedType === "individual"
                ? "border-[#4318FF]"
                : "border-[#CBD5E1] group-hover:border-gray-400"
            }`}
          >
            {selectedType === "individual" && (
              <div className="w-2.5 h-2.5 rounded-full bg-[#4318FF]" />
            )}
          </div>

          {/* Icon */}
          <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] text-[#4318FF] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#1B2559]">
              Individual Member(s)
            </h3>
            <p className="text-xs text-[#A3AED0] mt-0.5 truncate">
              Select specific employees from your team
            </p>
          </div>
        </Card>

        {/* Option 2: All Members */}
        <Card
          onClick={() => setSelectedType("all")}
          className={`group flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-none ${
            selectedType === "all"
              ? "border-[#4318FF] ring-2 ring-[#4318FF]/15 bg-white"
              : "border-[#E0E5F2] hover:border-gray-300 bg-white"
          }`}
        >
          {/* Custom Radio */}
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              selectedType === "all"
                ? "border-[#4318FF]"
                : "border-[#CBD5E1] group-hover:border-gray-400"
            }`}
          >
            {selectedType === "all" && (
              <div className="w-2.5 h-2.5 rounded-full bg-[#4318FF]" />
            )}
          </div>

          {/* Icon */}
          <div className="w-11 h-11 rounded-2xl bg-[#E6F9F0] text-[#05CD99] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#1B2559]">
              All Members
            </h3>
            <p className="text-xs text-[#A3AED0] mt-0.5 truncate">
              Assign to your entire team at once
            </p>
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default CreateReviewAssignmentModal;
