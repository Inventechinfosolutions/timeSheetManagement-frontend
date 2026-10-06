import React from "react";
import { ArrowLeft, Star, ShieldCheck, Info } from "lucide-react";
import { Card, CardTitle, CardContent, Button } from "../../../components/ui";
import "./AppraisalDashboard.css";

interface AnnualRatingViewProps {
  onBack: () => void;
  employeeName?: string;
  employeeRole?: string;
}

interface FinancialYearRow {
  fy: string;
  isCurrent?: boolean;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  total: number;
  calculationText: string;
}

const MOCK_FY_RATINGS: FinancialYearRow[] = [
  {
    fy: "FY 2026-27",
    isCurrent: true,
    q1: 5,
    q2: 5,
    q3: null,
    q4: null,
    total: 2.50,
    calculationText: "(5 + 5) ÷ 4 = 2.50",
  },
  {
    fy: "FY 2025-26",
    isCurrent: false,
    q1: 3,
    q2: 5,
    q3: 2.6,
    q4: 4,
    total: 3.65,
    calculationText: "(3 + 5 + 2.6 + 4) ÷ 4 = 3.65",
  },
  {
    fy: "FY 2024-25",
    isCurrent: false,
    q1: 4,
    q2: 4,
    q3: 4.5,
    q4: 4.5,
    total: 4.25,
    calculationText: "(4 + 4 + 4.5 + 4.5) ÷ 4 = 4.25",
  },
];

const renderQuarterCell = (val: number | null) => {
  if (val === null || val === undefined) {
    return (
      <span className="text-[#94A3B8] font-semibold text-sm select-none">
        —
      </span>
    );
  }

  return (
    <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-[#EBCED6] shadow-2xs">
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)] shrink-0" />
      <span className="text-sm font-bold text-[#0F172A]">{val}</span>
    </div>
  );
};

export const AnnualRatingView: React.FC<AnnualRatingViewProps> = ({
  onBack,
  employeeName = "Current Employee",
  employeeRole = "Software Engineer",
}) => {
  return (
    <div className="w-full min-h-screen relative overflow-hidden font-sans p-4 sm:p-6 lg:p-8 manager-review-bg-container">
      {/* Luxury Background Canvas */}
      <div className="manager-review-canvas" aria-hidden="true">
        <div className="manager-review-dot-grid" />
        <div className="manager-review-aurora-tr" />
        <div className="manager-review-aurora-tl" />
        <div className="manager-review-aurora-br" />
        <div className="manager-review-aurora-bl" />
        <div className="manager-review-wave-top" />
        <div className="manager-review-wave-bottom" />
        <div className="manager-review-star-1" />
        <div className="manager-review-star-2" />
        <div className="manager-review-star-3" />
        <div className="manager-review-star-4" />
        <div className="manager-review-star-5" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        {/* Top Header Card */}
        <Card className="p-5 sm:p-6 manager-review-glass-card rounded-3xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="text-[#6D5284] hover:text-[#4A355E] !p-2 rounded-xl cursor-pointer"
                title="Back to Dashboard"
              />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                    Financial Rating
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8D73A8]/10 text-[#6D5284] border border-[#8D73A8]/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Authenticated
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                  Annual rating breakdown across financial quarters for{" "}
                  <span className="font-bold text-[#0F172A]">{employeeName}</span> ({employeeRole})
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Financial Rating Table: ONLY FY, Q1, Q2, Q3, Q4, Total */}
        <Card className="w-full p-5 sm:p-7 manager-review-glass-card rounded-3xl animate-in fade-in duration-300 shadow-sm">
          <div className="flex items-center justify-between mb-5 border-b border-[#D7B6C7]/30 pb-4">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-[#0F172A]">
                Financial Year Rating Summary
              </CardTitle>
              <p className="text-xs text-[#64748B] mt-1">
                Quarterly evaluations and total annualized rating.
              </p>
            </div>
          </div>

          <CardContent className="p-0 space-y-4">
            <div className="quarterly-review-table-card">
              <div className="quarterly-review-table-scroll">
                <table className="quarterly-review-table qr-header-indigo">
                  <thead>
                    <tr>
                      <th className="text-left min-w-[130px] font-bold">FY</th>
                      <th className="text-center min-w-[90px] font-bold">Q1</th>
                      <th className="text-center min-w-[90px] font-bold">Q2</th>
                      <th className="text-center min-w-[90px] font-bold">Q3</th>
                      <th className="text-center min-w-[90px] font-bold">Q4</th>
                      <th className="text-center min-w-[120px] font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_FY_RATINGS.map((row) => (
                      <tr
                        key={row.fy}
                        className="hover:bg-purple-50/30 transition-colors"
                      >
                        {/* 1. FY */}
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#0F172A]">
                              {row.fy}
                            </span>
                            {row.isCurrent && (
                              <span className="text-[10px] font-bold bg-[#8D73A8]/15 text-[#6D5284] px-2 py-0.5 rounded-full border border-[#8D73A8]/30">
                                Current
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Q1 */}
                        <td className="text-center py-4">{renderQuarterCell(row.q1)}</td>

                        {/* 3. Q2 */}
                        <td className="text-center py-4">{renderQuarterCell(row.q2)}</td>

                        {/* 4. Q3 */}
                        <td className="text-center py-4">{renderQuarterCell(row.q3)}</td>

                        {/* 5. Q4 */}
                        <td className="text-center py-4">{renderQuarterCell(row.q4)}</td>

                        {/* 6. Total (Show only the total score) */}
                        <td className="text-center py-4">
                          <span className="inline-block text-sm font-extrabold text-[#6D5284] bg-[#F7EEF2] px-3.5 py-1.5 rounded-xl border border-[#D7B6C7] shadow-2xs">
                            {row.total.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note below the table with calculation */}
            <div className="p-4 rounded-2xl bg-[#FAF5F7] border border-[#EBCED6] flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F7EEF2] text-[#6D5284] flex items-center justify-center shrink-0 border border-[#D7B6C7]/60 shadow-2xs">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-xs text-[#64748B] space-y-1">
                <p className="font-bold text-[#0F172A] text-xs">
                  Note on Total Rating:
                </p>
                <p>
                  The Total rating is calculated as the sum of all quarter ratings divided by 4:
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 font-mono text-[11px] text-[#6D5284] font-semibold">
                  <span>• FY 2026-27: (5 + 5) ÷ 4 = 2.50</span>
                  <span>• FY 2025-26: (3 + 5 + 2.6 + 4) ÷ 4 = 3.65</span>
                  <span>• FY 2024-25: (4 + 4 + 4.5 + 4.5) ÷ 4 = 4.25</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnnualRatingView;
