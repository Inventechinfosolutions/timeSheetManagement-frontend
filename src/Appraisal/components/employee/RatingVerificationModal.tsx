import React, { useEffect, useState } from "react";
import { Check, Eye, EyeOff, Send } from "lucide-react";
import { Button, Dropdown, Input, Modal } from "../../../components/ui";
import { WorksphereLogoLoader } from "../../../components/ApiLoadingSpinner";
import { useAppSelector } from "../../../hooks";
import { AssignButtonState } from "../../enums/appraisal.enums";
import "../manager/AssignQuarterlyReviewModal.css";
import {
  AppraisalCopy,
} from "../../constants/appraisal.constants";
import {
  AnnualSummaryRecord,
  AppraisalApi,
  MasterFinancialYearOption,
  readApiError,
} from "../../services/appraisal.api";

interface RatingVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const appraisalButtonClass =
  "!bg-gradient-to-b !from-[#3B82F6] !to-[#1D4ED8] hover:!from-[#2563EB] hover:!to-[#1E40AF] !text-white !shadow-md !shadow-blue-500/25";

const ratingText = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  return String(value);
};

const hasStoredRating = (record: AnnualSummaryRecord): boolean =>
  [record.q1Rating, record.q2Rating, record.q3Rating, record.q4Rating, record.annualAverageRating].some(
    (value) => ratingText(value) !== "",
  );

export const RatingVerificationModal: React.FC<RatingVerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const employeeId = currentUser?.employeeId || currentUser?.loginId || "";
  const [financialYear, setFinancialYear] = useState("");
  const [yearOptions, setYearOptions] = useState<MasterFinancialYearOption[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [buttonState, setButtonState] = useState<AssignButtonState>(AssignButtonState.IDLE);
  const [summary, setSummary] = useState<AnnualSummaryRecord | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFinancialYear("");
      setPassword("");
      setShowPassword(false);
      setError("");
      setButtonState(AssignButtonState.IDLE);
      setSummary(null);
      return;
    }
    setYearsLoading(true);
    void AppraisalApi.getMasterFinancialYears()
      .then((years) => setYearOptions(years || []))
      .catch(() => setYearOptions([]))
      .finally(() => setYearsLoading(false));
  }, [isOpen]);

  const handleYearChange = (value: string) => {
    setFinancialYear(value);
    setPassword("");
    setError("");
    setSummary(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!financialYear) {
      setError(AppraisalCopy.selectFinancialYear);
      return;
    }
    if (!employeeId) {
      setError(AppraisalCopy.missingEmployee);
      return;
    }
    if (!password.trim()) {
      setError(AppraisalCopy.passwordLabel);
      return;
    }
    setButtonState(AssignButtonState.ANIMATING);
    setError("");
    setSummary(null);
    try {
      const record = await AppraisalApi.revealAnnualSummary(employeeId, financialYear, password.trim());
      if (!record.passwordVerified) {
        setError(AppraisalCopy.passwordMismatch);
        setButtonState(AssignButtonState.IDLE);
        return;
      }
      setPassword("");
      setButtonState(AssignButtonState.ASSIGNED);
      window.setTimeout(() => setSummary(record), 420);
    } catch (requestError) {
      setSummary(null);
      setButtonState(AssignButtonState.IDLE);
      setError(readApiError(requestError));
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={AppraisalCopy.ratingModalTitle}
      maxWidth="sm"
      footer={
        summary ? (
          <Button type="button" onClick={onClose} className={appraisalButtonClass}>
            {AppraisalCopy.closeAction}
          </Button>
        ) : (
          <button
            type="submit"
            form="rating-password-form"
            disabled={
              !financialYear ||
              buttonState === AssignButtonState.ANIMATING ||
              buttonState === AssignButtonState.ASSIGNED
            }
            className={`assign-modal-submit-btn ${
              buttonState === AssignButtonState.ANIMATING
                ? "assign-btn-animating"
                : buttonState === AssignButtonState.ASSIGNED
                  ? "assign-btn-assigned"
                  : ""
            }`}
          >
            <span className="assign-btn-icon-wrapper">
              {buttonState === AssignButtonState.ASSIGNED ? (
                <Check className="w-4 h-4 text-white stroke-[3] assign-icon-check" />
              ) : (
                <Send
                  className={`w-4 h-4 fill-white -rotate-12 ${
                    buttonState === AssignButtonState.ANIMATING ? "assign-icon-launching" : ""
                  }`}
                />
              )}
            </span>
            <span className="assign-btn-text">
              {buttonState === AssignButtonState.ASSIGNED
                ? "Shown"
                : buttonState === AssignButtonState.ANIMATING
                  ? "Checking"
                  : AppraisalCopy.passwordAction}
            </span>
          </button>
        )
      }
    >
      {summary ? (
        hasStoredRating(summary) ? (
        <div className="space-y-2">
          <p className="text-sm font-bold text-[#0F172A]">{summary.financialYear}</p>
          <div className="grid grid-cols-2 gap-2">
            {(["q1Rating", "q2Rating", "q3Rating", "q4Rating"] as const).map((key, index) => (
              <div
                key={key}
                className="rounded-xl border border-blue-100 bg-[#EFF6FF] px-3 py-2"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Q{index + 1}
                </p>
                <p className="text-sm font-bold text-[#2563EB]">{ratingText(summary[key]) || "—"}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-blue-100 bg-white px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Annual rating</p>
            <p className="text-sm font-bold text-[#0F172A]">
              {ratingText(summary.annualAverageRating) || "—"} {summary.annualRatingDescription || ""}
            </p>
          </div>
        </div>
        ) : (
          <p className="py-6 text-center text-sm font-bold text-[#64748B]">{AppraisalCopy.noReviewsYet}</p>
        )
      ) : (
        <form id="rating-password-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
              {AppraisalCopy.financialYearLabel}
            </label>
            <Dropdown
              placeholder="Select financial year"
              allowClear={false}
              defaultValue=""
              options={yearOptions.map((year) => ({
                value: year.financialYear,
                label: year.financialYear,
              }))}
              value={financialYear}
              onChange={handleYearChange}
              loading={yearsLoading}
              className="w-full"
              buttonClassName="w-full justify-between border border-blue-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-[#0F172A] shadow-none hover:border-blue-500"
            />
          </div>
          {financialYear ? (
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                {AppraisalCopy.passwordLabel}
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={AppraisalCopy.passwordLabel}
                suffixIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-[#2563EB]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>
          ) : null}
          {buttonState === AssignButtonState.ANIMATING ? (
            <div className="flex justify-center py-2">
              <WorksphereLogoLoader />
            </div>
          ) : null}
          {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
        </form>
      )}
    </Modal>
  );
};

export default RatingVerificationModal;
