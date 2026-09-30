import { Info } from "lucide-react";
import { Tooltip } from "antd";
import "./MobileAttendanceStatsCards.css";

export interface MobileAttendanceStatsCardsProps {
  loading?: boolean;
  isInternThisMonth: boolean;
  isConversionMonth: boolean;
  entitlement: number;
  dynamicCarryOver: number;
  paidUsed: number;
  approvedUsed: number;
  finalLOP: number;
  balanceMonthly: number;
  internQuota?: number;
  internLeavesTaken?: number;
  fullTimerAdded?: number;
}

const MobileAttendanceStatsCards = ({
  loading = false,
  isInternThisMonth,
  isConversionMonth,
  entitlement,
  dynamicCarryOver,
  paidUsed,
  approvedUsed,
  finalLOP,
  balanceMonthly,
  internQuota = 0,
  internLeavesTaken = 0,
  fullTimerAdded = 0,
}: MobileAttendanceStatsCardsProps) => {
  return (
    <div
      className={`mobile-stats-container ${
        loading ? "mobile-stats-loading" : ""
      }`}
    >
      <div
        className={`mobile-stats-grid ${
          isInternThisMonth ? "intern-grid" : ""
        }`}
      >
        {/* Card 1 - Annual Leave Quota */}
        <div className="mobile-stat-item">
          <div className="mobile-stat-card">
           
            <span className="mobile-stat-value">{entitlement}</span>
          </div>
          <div className="mobile-stat-title">
            <span>Annual Leave</span>

            {isConversionMonth && (
              <Tooltip
                title={
                  <div className="p-2 text-xs space-y-1.5 min-w-[170px] text-white">
                    <div className="font-extrabold border-b border-white/20 pb-1 mb-1">
                      Conversion Quota
                    </div>

                    <div className="flex justify-between gap-4 font-medium">
                      <span>Intern Quota:</span>
                      <span className="font-bold">
                        {internQuota.toFixed(1)}
                        {internLeavesTaken > 0
                          ? ` (${internLeavesTaken.toFixed(1)} Taken)`
                          : ""}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 font-medium">
                      <span>Added (FT):</span>
                      <span className="font-bold text-green-300">
                        +{fullTimerAdded.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-t border-dashed border-white/20 pt-1 mt-1 font-bold">
                      <span>Total Quota:</span>
                      <span>{entitlement.toFixed(1)}</span>
                    </div>
                  </div>
                }
                color="#1B2559"
                placement="top"
                overlayInnerStyle={{
                  borderRadius: "12px",
                  padding: "8px 12px",
                }}
              >
                <span className="mobile-stat-info">
                  <Info size={11} strokeWidth={2.5} />
                </span>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Card 2 - Carry Forward */}
        {!isInternThisMonth && (
          <div className="mobile-stat-item">
            <div className="mobile-stat-card">
            
              <span className="mobile-stat-value">
                {(Number(dynamicCarryOver) || 0).toFixed(1)}
              </span>
            </div>
            <div className="mobile-stat-title">
              <span>Carry Forward</span>
            </div>
          </div>
        )}

        {/* Card 3 - Leaves Taken */}
        <div className="mobile-stat-item">
          <div className="mobile-stat-card">
            <span className="mobile-stat-value">
              {(
                Number(isInternThisMonth ? paidUsed : approvedUsed) || 0
              ).toFixed(1)}
            </span>
          </div>
          <div className="mobile-stat-title">
            <span>Leave Used</span>
          </div>
        </div>

        {/* Card 4 - LOP */}
        <div className="mobile-stat-item">
          <div className="mobile-stat-card">
            
            <span className="mobile-stat-value">{finalLOP}</span>
          </div>
          <div className="mobile-stat-title">
            <span>LOP</span>
          </div>
        </div>

        {/* Card 5 - Available Leave Balance */}
        <div className="mobile-stat-item">
          <div className="mobile-stat-card mobile-card-balance">
           
            <span className="mobile-stat-value">
              {balanceMonthly.toFixed(1)}
            </span>
          </div>
          <div className="mobile-stat-title">
            <span>Available Leave</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAttendanceStatsCards;