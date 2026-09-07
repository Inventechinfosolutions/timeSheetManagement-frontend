import React, { useState, useEffect } from "react";
import { Modal, Button, DatePicker, Select, Spin, message, Alert } from "antd";
import { Calendar, Save, AlertCircle, Clock } from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";
import { DEFAULT_YEAR } from "./QuarterlyReview.types";

const { Option } = Select;

export interface QuarterDateItem {
  quarter: string;
  startDate: string;
  endDate: string;
}

interface QuarterDateConfigModalProps {
  open: boolean;
  selectedYear: string;
  yearOptions: string[];
  onClose: () => void;
  onSuccess: () => void;
}

const QUARTER_LABELS: Record<string, { label: string; subLabel: string }> = {
  Q1: { label: "Q1", subLabel: "January to March" },
  Q2: { label: "Q2", subLabel: "April to June" },
  Q3: { label: "Q3", subLabel: "July to September" },
  Q4: { label: "Q4", subLabel: "October to December" },
};

const getDefaultDatesForQuarter = (yearStr: string, q: string): { startDate: string; endDate: string } => {
  let startYear = parseInt(yearStr.split("-")[0], 10);
  if (isNaN(startYear)) startYear = new Date().getFullYear();

  switch (q) {
    case "Q1":
      return { startDate: `${startYear}-01-01`, endDate: `${startYear}-03-31` };
    case "Q2":
      return { startDate: `${startYear}-04-01`, endDate: `${startYear}-06-30` };
    case "Q3":
      return { startDate: `${startYear}-07-01`, endDate: `${startYear}-09-30` };
    case "Q4":
      return { startDate: `${startYear}-10-01`, endDate: `${startYear}-12-31` };
    default:
      return { startDate: `${startYear}-01-01`, endDate: `${startYear}-03-31` };
  }
};

const QuarterDateConfigModal: React.FC<QuarterDateConfigModalProps> = ({
  open,
  selectedYear,
  yearOptions,
  onClose,
  onSuccess,
}) => {
  const [year, setYear] = useState<string>(selectedYear || DEFAULT_YEAR);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [configs, setConfigs] = useState<QuarterDateItem[]>([
    { quarter: "Q1", startDate: "", endDate: "" },
    { quarter: "Q2", startDate: "", endDate: "" },
    { quarter: "Q3", startDate: "", endDate: "" },
    { quarter: "Q4", startDate: "", endDate: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedYear) {
      setYear(selectedYear);
    }
  }, [selectedYear]);

  // Fetch configs whenever modal opens or year changes
  useEffect(() => {
    if (open) {
      fetchQuarterConfigs(year);
    }
  }, [open, year]);

  const fetchQuarterConfigs = async (targetYear: string) => {
    try {
      setLoading(true);
      setErrors({});
      const res = await axios.get("/api/manager-quarterly-review/quarter-configs", {
        params: { year: targetYear },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        const fetchedList: QuarterDateItem[] = res.data.data;
        const quarters = ["Q1", "Q2", "Q3", "Q4"];
        const merged = quarters.map((q) => {
          const found = fetchedList.find((item) => item.quarter === q);
          if (found && found.startDate && found.endDate) {
            return {
              quarter: q,
              startDate: found.startDate,
              endDate: found.endDate,
            };
          }
          const defaults = getDefaultDatesForQuarter(targetYear, q);
          return {
            quarter: q,
            startDate: defaults.startDate,
            endDate: defaults.endDate,
          };
        });
        setConfigs(merged);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Failed to load quarter date configuration.");
    } finally {
      setLoading(false);
    }
  };

  const validateDates = (updatedConfigs: QuarterDateItem[]) => {
    const newErrors: Record<string, string> = {};
    updatedConfigs.forEach((cfg) => {
      if (!cfg.startDate || !cfg.endDate) {
        newErrors[cfg.quarter] = "Start and End dates are required.";
      } else {
        const startMs = new Date(cfg.startDate).getTime();
        const endMs = new Date(cfg.endDate).getTime();
        if (startMs >= endMs) {
          newErrors[cfg.quarter] = "Start date must be before end date.";
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (q: string, field: "startDate" | "endDate", valueStr: string) => {
    const nextConfigs = configs.map((cfg) => {
      if (cfg.quarter === q) {
        return { ...cfg, [field]: valueStr };
      }
      return cfg;
    });
    setConfigs(nextConfigs);
    validateDates(nextConfigs);
  };

  const handleSave = async () => {
    if (!validateDates(configs)) {
      message.error("Please fix invalid quarter date ranges before saving.");
      return;
    }

    try {
      setSaving(true);
      const res = await axios.post("/api/manager-quarterly-review/quarter-configs", {
        year,
        configs,
      });

      if (res.data?.success) {
        message.success("Quarter date configuration saved successfully.");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Failed to save quarter date configuration.");
    } finally {
      setSaving(false);
    }
  };

  const hasAnyError = Object.values(errors).some((msg) => !!msg);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      destroyOnClose
      className="mqr-wrapper font-sans"
      title={
        <div className="flex items-center gap-2.5 text-[#2B3674] pb-2 border-b border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2B3674] leading-tight">
              Quarter Date Range Configuration
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Define cycle start and end dates applicable for employees and managers.
            </p>
          </div>
        </div>
      }
    >
      <div className="pt-4 pb-2 flex flex-col gap-4">
        {/* Year Selector Row */}
        <div className="flex items-center justify-between bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700">Financial Year Cycle:</span>
          </div>
          <Select
            value={year}
            onChange={(y) => setYear(y)}
            className="!w-40 !rounded-xl"
            dropdownStyle={{ minWidth: 180 }}
          >
            {yearOptions.map((y) => (
              <Option key={y} value={y}>
                FY {y}
              </Option>
            ))}
          </Select>
        </div>

        {hasAnyError && (
          <Alert
            type="error"
            showIcon
            icon={<AlertCircle className="w-4 h-4 text-red-600" />}
            message="Invalid Date Range"
            description="Start date must be strictly before end date for all quarters."
            className="!rounded-xl !bg-red-50 !border-red-200"
          />
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" tip="Loading quarter dates..." />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {configs.map((cfg) => {
              const meta = QUARTER_LABELS[cfg.quarter] || {
                label: cfg.quarter,
                subLabel: "",
              };
              const errorMsg = errors[cfg.quarter];

              return (
                <div
                  key={cfg.quarter}
                  className={`p-3.5 rounded-xl border transition-all ${
                    errorMsg
                      ? "bg-red-50/40 border-red-300"
                      : "bg-white border-slate-200 hover:border-indigo-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Quarter Name & Subtitle */}
                    <div className="min-w-[140px]">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-extrabold text-xs">
                          {meta.label}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {meta.subLabel}
                        </span>
                      </div>
                    </div>

                    {/* Date Pickers */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-slate-500">
                          Start Date <span className="text-red-500">*</span>
                        </span>
                        <DatePicker
                          value={cfg.startDate ? dayjs(cfg.startDate) : null}
                          onChange={(d) =>
                            handleDateChange(
                              cfg.quarter,
                              "startDate",
                              d ? d.format("YYYY-MM-DD") : ""
                            )
                          }
                          format="DD MMM YYYY"
                          placeholder="Select Start Date"
                          className="!w-36 !rounded-lg"
                        />
                      </div>

                      <span className="text-slate-400 font-bold self-end pb-2.5">
                        to
                      </span>

                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-slate-500">
                          End Date <span className="text-red-500">*</span>
                        </span>
                        <DatePicker
                          value={cfg.endDate ? dayjs(cfg.endDate) : null}
                          onChange={(d) =>
                            handleDateChange(
                              cfg.quarter,
                              "endDate",
                              d ? d.format("YYYY-MM-DD") : ""
                            )
                          }
                          format="DD MMM YYYY"
                          placeholder="Select End Date"
                          className="!w-36 !rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="mt-2 text-xs font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button onClick={onClose} disabled={saving} className="!rounded-lg">
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSave}
            loading={saving}
            disabled={hasAnyError || loading}
            className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-lg !font-semibold"
          >
            Save Dates
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuarterDateConfigModal;
