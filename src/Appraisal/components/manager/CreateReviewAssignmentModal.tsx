import React, { useState, useEffect } from "react";
import { Plus, Users, CheckCircle2 } from "lucide-react";
import { AssignmentType, CreateReviewAssignmentModalProps } from "../../types/appraisal.types";
import { Modal, Button, Card } from "../../../components/ui";
import "./CreateReviewAssignmentModal.css";

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
      <div className="create-modal-header-icon">
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </div>
      <div className="text-left">
        <h2 className="create-modal-title">
          Create Review Assignment
        </h2>
        <p className="create-modal-subtitle">
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
        className={`create-modal-continue-btn ${
          selectedType ? "is-active" : "is-disabled"
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
      overlayClassName="create-assignment-modal-overlay"
      closeBtnClassName="create-modal-close-btn"
      closeOnBackdrop={false}
      closeOnEsc={false}
      className="create-assignment-modal-dialog p-6 sm:p-7 [&>div:first-child]:border-none [&>div:first-child]:pb-2 [&>div:last-child]:border-none [&>div:last-child]:pt-2"
    >
      {/* Options */}
      <div className="space-y-3.5 pt-2">
        {/* Option 1: Individual Member(s) */}
        <Card
          onClick={() => setSelectedType("individual")}
          className={`group flex items-center gap-3.5 create-modal-option create-modal-option-individual ${
            selectedType === "individual" ? "is-selected" : ""
          }`}
        >
          {/* Custom Radio */}
          <div className="create-option-radio">
            {selectedType === "individual" && (
              <div className="create-option-radio-dot-individual" />
            )}
          </div>

          {/* Icon */}
          <div className="create-option-icon-wrap-individual">
            <Users className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="create-option-title">
              Individual Member(s)
            </h3>
            <p className="create-option-desc truncate">
              Select specific employees from your team
            </p>
          </div>
        </Card>

        {/* Option 2: All Members */}
        <Card
          onClick={() => setSelectedType("all")}
          className={`group flex items-center gap-3.5 create-modal-option create-modal-option-all ${
            selectedType === "all" ? "is-selected" : ""
          }`}
        >
          {/* Custom Radio */}
          <div className="create-option-radio">
            {selectedType === "all" && (
              <div className="create-option-radio-dot-all" />
            )}
          </div>

          {/* Icon */}
          <div className="create-option-icon-wrap-all">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="create-option-title">
              All Members
            </h3>
            <p className="create-option-desc truncate">
              Assign to your entire team at once
            </p>
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default CreateReviewAssignmentModal;
