import { useMemo } from "react";
import {
  Calendar as CalendarIcon,
  TrendingUp,
  CheckCircle,
  Ban,
  Clock,
  ClipboardList,
} from "lucide-react";

interface Props {
  year: number;
  month: number;
  leaveBalance: any;
  attendanceRecords: any[];
  isIntern: boolean;
  joiningDate?: string | Date;
}

const ENTITLEMENT = {
  FULL_TIMER: 18,
  INTERN: 12,
} as const;

const AttendanceStatsCards = ({
  year,
  month,
  leaveBalance,
  attendanceRecords,
  isIntern,
  joiningDate,
}: Props) => {
  const currentYearMonth = `${year}-${month.toString().padStart(2, "0")}`;

  // Calculate Recursive Stats based on User Rules
  // Rule 1: Add Accrual (1.5) at start of month
  // Rule 2: Deduct leaves taken
  // Rule 3: LOP if balance < 0
  // Rule 4: Floor balance at 0
  const {
    closingBalance,
    monthlyLOP,
    monthlyUsed,
    annualUsedYTD,
    monthlyOpening,
    totalLOP_YTD,
  } = useMemo(() => {
    let currentBalance = !isIntern ? leaveBalance?.carryOver || 0 : 0; // Opening Balance (Year)
    const monthlyAccrual = isIntern ? 1 : 1.5;

    // Parse Joining Date
    let joinMonth = 0;
    let joinYear = 0;
    if (joiningDate) {
      const jd = new Date(joiningDate);
      if (!isNaN(jd.getTime())) {
        joinMonth = jd.getMonth() + 1;
        joinYear = jd.getFullYear();
      }
    }

    // Helper to get usage for a specific month
    const getMonthlyUsage = (m: number) => {
      if (!Array.isArray(attendanceRecords)) return 0;
      return attendanceRecords
        .filter((r) => {
          const d = new Date(r.workingDate);
          return d.getFullYear() === year && d.getMonth() + 1 === m;
        })
        .reduce((acc, r) => {
          if (r.status === "Leave" || r.status === "Absent") return acc + 1;
          if (r.status === "Half Day") return acc + 0.5;
          return acc;
        }, 0);
    };

    let finalBalance = 0;
    let finalLOP = 0;
    let finalUsed = 0;
    let totalUsedYTD = 0;
    let finalOpening = 0; // Capture opening balance for the month
    let totalLOP_YTD = 0; // Cumulative LOP

    // Iterate from Jan up to current Month
    for (let m = 1; m <= month; m++) {
      // Validation: Check Joining Date
      // If employee hasn't joined yet for this month iteration, skip logic
      // This ensures Jan/Feb are ignored if joined in March
      if (year < joinYear || (year === joinYear && m < joinMonth)) {
        currentBalance = 0; // No balance before joining

        // Even if simplified, we must ensure if this IS the selected month (unlikely if strictly checking)
        // But if user selects Jan and joined in March? Then Stats show 0.
        if (m === month) {
          finalOpening = 0;
          finalBalance = 0;
          // other finals are 0 init
        }
        continue;
      }

      // If this is the selected month, capture opening balance BEFORE accrual
      if (m === month) {
        finalOpening = currentBalance;
      }

      // Add Accrual at Start of Month
      currentBalance += monthlyAccrual;

      // Deduct Usage
      const used = getMonthlyUsage(m);
      currentBalance -= used;
      totalUsedYTD += used;

      // Check LOP
      let lop = 0;
      if (currentBalance < 0) {
        lop = Math.abs(currentBalance);
        currentBalance = 0; // Floor at 0
      }
      totalLOP_YTD += lop;

      // If this is the selected month, capture stats
      if (m === month) {
        finalBalance = currentBalance;
        finalLOP = lop;
        finalUsed = used;
      }
    }

    return {
      closingBalance: finalBalance,
      monthlyLOP: finalLOP,
      monthlyUsed: finalUsed,
      annualUsedYTD: totalUsedYTD,
      monthlyOpening: finalOpening,
      totalLOP_YTD,
    };
  }, [attendanceRecords, year, month, isIntern, leaveBalance, joiningDate]);

  // Map new stats to existing variables for UI
  const paidUsed = monthlyUsed;
  const lopUsed = 0; // handled by monthlyLOP
  const approvedUsed = monthlyUsed;
  const finalLOP = monthlyLOP;

  const entitlement = useMemo(() => {
    if (leaveBalance && String(leaveBalance.year) === String(year)) {
      return leaveBalance.entitlement;
    }
    return isIntern ? ENTITLEMENT.INTERN : ENTITLEMENT.FULL_TIMER;
  }, [leaveBalance, year, isIntern]);

  const carryOverValue = useMemo(() => {
    return !isIntern ? leaveBalance?.carryOver || 0 : 0;
  }, [isIntern, leaveBalance]);

  // Annual Balance = (Entitlement + CarryOver) - (Total Used - Total LOP)
  // i.e., Entitlement + CarryOver - Paid Leaves Used
  const paidUsedYTD_Total = annualUsedYTD - totalLOP_YTD;
  const balance = entitlement + carryOverValue - paidUsedYTD_Total;

  const balanceMonthly = closingBalance;

  // We need these for compatibility if used elsewhere, but mainly we use the above
  const paidUsedYTD = annualUsedYTD;
  const paidUsedBefore = annualUsedYTD - monthlyUsed;

  // Display Static Carry Over as per user request
  // Logical calculation for availability stays in LOP/Balance
  const dynamicCarryOver = useMemo(() => {
    return monthlyOpening;
  }, [monthlyOpening]);

  const pendingCount = useMemo(() => {
    if (!Array.isArray(attendanceRecords)) return 0;
    const recordsMonthly = attendanceRecords.filter((r) => {
      const d = new Date(r.workingDate);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    return recordsMonthly.filter((r) => r.status === "Pending").length;
  }, [month, year, attendanceRecords]);

  const calculatedMonthlyHours = useMemo(() => {
    if (!Array.isArray(attendanceRecords)) return 0;
    return attendanceRecords
      .filter((r) => {
        const d = new Date(r.workingDate);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      })
      .reduce((acc, r) => acc + (r.totalHours || 0), 0);
  }, [month, year, attendanceRecords]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {/* Card 1 - Total Monthly Hours */}
      <div className="bg-linear-to-br from-[#36B9CC] to-[#258391] rounded-[20px] p-4 shadow-lg shadow-cyan-500/20 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-inner z-10">
          <CalendarIcon size={20} strokeWidth={2.5} />
        </div>
        <div className="w-full z-10">
          <div className="text-white/90 font-bold text-[10px] uppercase tracking-wider mb-1">
            Monthly Hours
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              {calculatedMonthlyHours.toFixed(1)}
            </span>
            <span className="text-[9px] font-bold text-white/70 uppercase mt-1">
              In{" "}
              {new Date(year, month - 1).toLocaleDateString("en-US", {
                month: "short",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Card 2 - Entitlement */}
      <div className="bg-white rounded-[20px] p-4 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-[#4318FF] transition-colors group-hover:bg-blue-100">
          <TrendingUp size={20} strokeWidth={2.5} />
        </div>
        <div className="w-full">
          <div className="text-[#A3AED0] font-bold text-[10px] uppercase tracking-wider mb-1">
            Entitlement
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-[#1B2559] tracking-tight">
              {entitlement}
            </span>
            <span className="text-[9px] font-bold text-[#A3AED0] uppercase mt-1">
              Annual Pack
            </span>
          </div>
        </div>
      </div>

      {/* Card 3 - Carry Over (Full-timers only) */}
      {!isIntern && (
        <div className="bg-white rounded-[20px] p-4 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 text-[#7551FF] transition-colors group-hover:bg-indigo-100">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <div className="w-full">
            <div className="text-[#A3AED0] font-bold text-[10px] uppercase tracking-wider mb-1">
              Carry Over
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold text-[#1B2559] tracking-tight">
                {dynamicCarryOver.toFixed(1)}
              </span>
              <span className="text-[9px] font-bold text-[#A3AED0] uppercase mt-1">
                Rolled Over
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Card 4 - Leaves Taken */}
      <div className="bg-white rounded-[20px] p-4 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-green-50 text-[#05CD99] transition-colors group-hover:bg-green-100">
          <CheckCircle size={20} strokeWidth={2.5} />
        </div>
        <div className="w-full">
          <div className="text-[#A3AED0] font-bold text-[10px] uppercase tracking-wider mb-1">
            Leaves Taken
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-[#1B2559] tracking-tight">
              {isIntern ? paidUsed : approvedUsed}
            </span>
            <span className="text-[9px] font-bold text-[#A3AED0] uppercase mt-1">
              Approved
            </span>
          </div>
        </div>
      </div>

      {/* Card 5 - LOP */}
      <div className="bg-white rounded-[20px] p-4 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-[#EE5D50] transition-colors group-hover:bg-red-100">
          <Ban size={20} strokeWidth={2.5} />
        </div>
        <div className="w-full">
          <div className="text-[#A3AED0] font-bold text-[10px] uppercase tracking-wider mb-1">
            LOP
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-[#1B2559] tracking-tight">
              {finalLOP}
            </span>
            <span className="text-[9px] font-bold text-[#A3AED0] uppercase mt-1">
              Loss of Pay
            </span>
          </div>
        </div>
      </div>

      {/* Card 6 - Pending */}
      <div className="bg-white rounded-[20px] p-4 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-50 text-[#FFB547] transition-colors group-hover:bg-amber-100">
          <Clock size={20} strokeWidth={2.5} />
        </div>
        <div className="w-full">
          <div className="text-[#A3AED0] font-bold text-[10px] uppercase tracking-wider mb-1">
            Pending
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-[#1B2559] tracking-tight">
              {pendingCount}
            </span>
            <span className="text-[9px] font-bold text-[#A3AED0] uppercase mt-1">
              Awaiting Approval
            </span>
          </div>
        </div>
      </div>

      {/* Card 7 - Balance */}
      <div className="bg-linear-to-br from-[#4318FF] to-[#3B15E0] rounded-[20px] p-4 shadow-lg shadow-blue-500/30 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-inner z-10">
          <ClipboardList size={20} strokeWidth={2.5} />
        </div>
        <div className="w-full z-10">
          <div className="text-white/90 font-bold text-[10px] uppercase tracking-wider mb-1">
            Balance
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {balance}
              </span>
              <span className="text-[10px] font-bold text-white/60 uppercase">
                Annual
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold text-white/90">
                {balanceMonthly.toFixed(1)}
              </span>
              <span className="text-[10px] font-medium text-white/60">
                This Month
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceStatsCards;
