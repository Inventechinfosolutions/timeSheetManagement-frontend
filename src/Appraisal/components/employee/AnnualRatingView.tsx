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
      <span className="text-[#9EABA2] font-semibold text-sm select-none">
        —
      </span>
    );
  }

  return (
    <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 border border-[#E8B298]/40 shadow-2xs">
      <Star className="w-3.5 h-3.5 fill-[#EECC8C] text-[#EECC8C] drop-shadow-[0_0_3px_rgba(238,204,140,0.5)] shrink-0" />
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
                className="text-[#A36361] hover:text-[#8D4E4D] !p-2 rounded-xl cursor-pointer"
                title="Back to Dashboard"
              />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight w-fit">
                    <span className="manager-review-title-anim">Financial Rating</span>
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D3A29D]/15 text-[#A36361] border border-[#D3A29D]/40 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Authenticated
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-0.5 font-normal w-fit">
                  <span className="manager-review-subtitle-anim">
                    Annual rating breakdown across financial quarters for{" "}
                    <strong className="font-bold text-[#0F172A]">{employeeName}</strong> ({employeeRole})
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Financial Rating Table: ONLY FY, Q1, Q2, Q3, Q4, Total */}
        <Card className="w-full p-5 sm:p-7 manager-review-glass-card rounded-3xl animate-in fade-in duration-300 shadow-sm">
          <div className="flex items-center justify-between mb-5 border-b border-[#D3A29D]/30 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight w-fit">
                <span className="manager-review-title-anim">Financial Year Rating Summary</span>
              </h2>
              <p className="text-xs mt-1 font-normal w-fit">
                <span className="manager-review-subtitle-anim">
                  Quarterly evaluations and total annualized rating.
                </span>
              </p>
            </div>
          </div>

          <CardContent className="p-0 space-y-4">
            <div className="quarterly-review-table-card w-full overflow-hidden">
              <table className="quarterly-review-table financial-rating-table qr-header-indigo w-full table-fixed">
                <thead>
                  <tr>
                    <th className="text-left w-[24%] font-bold px-4 py-3.5">Financial Year</th>
                    <th className="text-center w-[15%] font-bold px-2 py-3.5">Q1</th>
                    <th className="text-center w-[15%] font-bold px-2 py-3.5">Q2</th>
                    <th className="text-center w-[15%] font-bold px-2 py-3.5">Q3</th>
                    <th className="text-center w-[15%] font-bold px-2 py-3.5">Q4</th>
                    <th className="text-center w-[16%] font-bold px-3 py-3.5">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_FY_RATINGS.map((row) => (
                    <tr
                      key={row.fy}
                      className="hover:bg-[#FAF2EE]/60 transition-colors border-b border-[#F5E8E2]/70 last:border-b-0"
                    >
                      {/* 1. FY */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#0F172A] whitespace-nowrap">
                            {row.fy}
                          </span>
                          {row.isCurrent && (
                            <span className="text-[10px] font-bold bg-[#D3A29D]/15 text-[#A36361] px-2 py-0.5 rounded-full border border-[#D3A29D]/40 shrink-0">
                              Current
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Q1 */}
                      <td className="text-center px-2 py-3.5">{renderQuarterCell(row.q1)}</td>

                      {/* 3. Q2 */}
                      <td className="text-center px-2 py-3.5">{renderQuarterCell(row.q2)}</td>

                      {/* 4. Q3 */}
                      <td className="text-center px-2 py-3.5">{renderQuarterCell(row.q3)}</td>

                      {/* 5. Q4 */}
                      <td className="text-center px-2 py-3.5">{renderQuarterCell(row.q4)}</td>

                      {/* 6. Total (With Star) */}
                      <td className="text-center px-3 py-3.5">
                        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF2EE] border border-[#D3A29D] shadow-2xs whitespace-nowrap">
                          <Star className="w-3.5 h-3.5 fill-[#EECC8C] text-[#EECC8C] drop-shadow-[0_0_3px_rgba(238,204,140,0.5)] shrink-0" />
                          <span className="text-sm font-extrabold text-[#A36361]">
                            {row.total.toFixed(2)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note below the table with calculation */}
            <div className="p-4 rounded-2xl bg-[#FAF2EE]/80 border border-[#E8B298]/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FAF2EE] text-[#A36361] flex items-center justify-center shrink-0 border border-[#D3A29D]/60 shadow-2xs">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-xs text-[#64748B] space-y-1">
                <p className="font-bold text-[#0F172A] text-xs">
                  Note on Total Rating:
                </p>
                <p>
                  The Total rating is calculated as the sum of all quarter ratings divided by 4:
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 font-mono text-[11px] text-[#A36361] font-semibold">
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
