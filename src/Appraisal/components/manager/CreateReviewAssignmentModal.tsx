import React, { useState, useEffect } from "react";
import { Plus, Users, CheckCircle2, Building2, ChevronRight, ArrowRight } from "lucide-react";
import { AssignmentType, CreateReviewAssignmentModalProps } from "../../types/appraisal.types";
import { Modal, Button, Card, Dropdown } from "../../../components/ui";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { fetchDepartments } from "../../../reducers/masterDepartment.reducer";
import "./CreateReviewAssignmentModal.css";

export const CreateReviewAssignmentModal: React.FC<CreateReviewAssignmentModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  initialType = null,
  initialDepartment = "",
  isAdmin = false,
}) => {
  const dispatch = useAppDispatch();
  const { departments } = useAppSelector((state) => state.masterDepartments);
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartment || "");
  const [selectedType, setSelectedType] = useState<AssignmentType | null>(initialType ?? null);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType ?? null);
      setSelectedDept(initialDepartment || "");
      if (isAdmin && (!departments || departments.length === 0)) {
        dispatch(fetchDepartments());
      }
    }
  }, [isOpen, initialType, initialDepartment, isAdmin, dispatch, departments]);

  if (!isOpen) return null;

  const departmentOptions = [
    { value: "", label: "Select Department" },
    ...(departments || []).map((dept) => ({
      value: dept.departmentName,
      label: dept.departmentName,
    })),
  ];

  const canContinue = Boolean(selectedType && (!isAdmin || selectedDept));

  const handleContinue = () => {
    if (selectedType && (!isAdmin || selectedDept)) {
      onContinue(selectedType, selectedDept);
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
          {isAdmin
            ? "Select a department and choose how to assign the quarterly review"
            : "Choose how you want to assign the quarterly review"}
        </p>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex justify-end w-full">
      <Button
        variant={canContinue ? "primary" : "secondary"}
        size="md"
        disabled={!canContinue}
        onClick={handleContinue}
        rightIcon={
          <span className="relative inline-flex items-center justify-center w-3.5 h-3.5 shrink-0">
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0 transition-all duration-200 group-hover:opacity-0 group-hover:translate-x-1" />
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0 absolute inset-0 m-auto opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1" />
          </span>
        }
        className={`group create-modal-continue-btn ${
          canContinue ? "is-active" : "is-disabled"
        }`}
      >
        <span>Continue</span>
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
      {/* Admin Department Selection */}
      {isAdmin && (
        <div className="pb-3 border-b border-gray-100 mb-3">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Select Department</span>
            <span className="text-red-500">*</span>
          </label>
          <Dropdown
            options={departmentOptions}
            value={selectedDept}
            onChange={(val) => setSelectedDept(val)}
            placeholder="Choose Department"
            className="w-full"
            maxLabelWidth="max-w-none"
            buttonClassName="create-modal-dept-dropdown-btn w-full"
          />
        </div>
      )}

      {/* Options */}
      <div className="space-y-3.5 pt-1">
        {/* Option 1: Individual Member(s) */}
        <Card
          onClick={() => setSelectedType("individual")}
          className={`group flex items-center gap-3.5 create-modal-option create-modal-option-individual ${selectedType === "individual" ? "is-selected" : ""
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
          className={`group flex items-center gap-3.5 create-modal-option create-modal-option-all ${selectedType === "all" ? "is-selected" : ""
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
