import {
  Ban,
  CheckCircle,
  ClipboardList,
  Info,
  TrendingUp,
} from "lucide-react";
import { Tooltip } from "antd";
import type { AttendanceStatsCardValues } from "./AttendanceStatsCards";

interface Props {
  values: AttendanceStatsCardValues;
}

const AttendanceStatsCardsDesktop = ({ values }: Props) => {
  return (
    <div className="attendance-stats-desktop">
      <div className="attendance-stats-grid attendance-stats-grid--desktop">
        <div className="attendance-stat-card">
          <div className="attendance-stat-icon attendance-stat-icon--blue">
            <TrendingUp size={16} strokeWidth={2.5} />
          </div>
          <div className="attendance-stat-body">
            <div className="attendance-stat-label attendance-stat-label--with-icon">
              <span>Annual Leave Quota</span>
              {values.isConversionMonth && (
                <Tooltip
                  title={
                    <div className="attendance-stat-tooltip">
                      <div className="attendance-stat-tooltip-title">
                        Conversion Quota
                      </div>
                      <div className="attendance-stat-tooltip-row">
                        <span>Intern Quota:</span>
                        <span>
                          {values.internQuota.toFixed(1)}
                          {values.internLeavesTaken > 0
                            ? ` (${values.internLeavesTaken.toFixed(1)} Taken)`
                            : ""}
                        </span>
                      </div>
                      <div className="attendance-stat-tooltip-row">
                        <span>Added (FT):</span>
                        <span className="attendance-stat-tooltip-positive">
                          +{values.fullTimerAdded.toFixed(1)}
                        </span>
                      </div>
                      <div className="attendance-stat-tooltip-row attendance-stat-tooltip-total">
                        <span>Total Quota:</span>
                        <span>{values.entitlement.toFixed(1)}</span>
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
                  <span className="attendance-stat-info">
                    <Info size={11} strokeWidth={2.5} />
                  </span>
                </Tooltip>
              )}
            </div>
            <span className="attendance-stat-value">{values.entitlement}</span>
          </div>
        </div>

        {!values.isInternThisMonth ? (
          <div className="attendance-stat-card">
            <div className="attendance-stat-icon attendance-stat-icon--amber">
              <TrendingUp size={16} strokeWidth={2.5} />
            </div>
            <div className="attendance-stat-body">
              <div className="attendance-stat-label">Carry Forward</div>
              <span className="attendance-stat-value">
                {(Number(values.carryForward) || 0).toFixed(1)}
              </span>
              <p className="attendance-stat-note attendance-stat-note--muted">
                FROM PREVIOUS MONTH
              </p>
            </div>
          </div>
        ) : (
          <div />
        )}

        <div className="attendance-stat-card">
          <div className="attendance-stat-icon attendance-stat-icon--green">
            <CheckCircle size={16} strokeWidth={2.5} />
          </div>
          <div className="attendance-stat-body">
            <div className="attendance-stat-label">Leave Used</div>
            <span className="attendance-stat-value">
              {(Number(values.leaveUsed) || 0).toFixed(1)}
            </span>
            <p className="attendance-stat-note attendance-stat-note--muted">
              APPROVED
            </p>
          </div>
        </div>

        <div className="attendance-stat-card">
          <div className="attendance-stat-icon attendance-stat-icon--red">
            <Ban size={16} strokeWidth={2.5} />
          </div>
          <div className="attendance-stat-body">
            <div className="attendance-stat-label">LOP</div>
            <span className="attendance-stat-value">{values.lop}</span>
            <p className="attendance-stat-note attendance-stat-note--muted">
              LOSS OF PAY
            </p>
          </div>
        </div>

        <div className="attendance-balance-card">
          <div className="attendance-balance-orb attendance-balance-orb--top" />
          <div className="attendance-balance-orb attendance-balance-orb--bottom" />
          <div className="attendance-balance-content">
            <div className="attendance-balance-icon">
              <ClipboardList size={15} strokeWidth={2.5} />
            </div>
            <p className="attendance-stat-label">AVAILABLE LEAVE BALANCE</p>
            <div className="attendance-balance-row">
              <span className="attendance-stat-value">{values.availableBalance.toFixed(1)}</span>
              <small>this month</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceStatsCardsDesktop;
