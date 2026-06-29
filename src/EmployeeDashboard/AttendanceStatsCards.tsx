import { useMemo } from "react";
import dayjs from "dayjs";
import { WorkTrendData } from "../reducers/employeeAttendance.reducer";
import { useAppSelector } from "../hooks";
import AttendanceStatsCardsDesktop from "./AttendanceStatsCards.desktop";
import AttendanceStatsCardsMobile from "./AttendanceStatsCards.mobile";
import "./AttendanceStatsCards.css";

interface MonthlyLeaveBalance {
  carryOver: number;
  monthlyAccrual: number;
  leavesTaken: number;
  lop: number;
  balance: number;
  ytdUsed: number;
  ytdLop: number;
}

interface Props {
  year: number;
  month: number;
  leaveBalance: any;
  attendanceRecords: any[];
  isIntern: boolean;
  joiningDate?: string | Date;
  conversionDate?: string | Date;
  trends?: WorkTrendData[];
  monthlyLeaveBalance?: MonthlyLeaveBalance | null;
  loading?: boolean;
}

export interface AttendanceStatsCardValues {
  isInternThisMonth: boolean;
  isConversionMonth: boolean;
  internQuota: number;
  fullTimerAdded: number;
  internLeavesTaken: number;
  entitlement: number;
  carryForward: number;
  leaveUsed: number;
  lop: number;
  availableBalance: number;
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
  conversionDate,
  trends = [],
  monthlyLeaveBalance,
  loading = false,
}: Props) => {
  // @ts-ignore
  const { holidays } = useAppSelector(
    (state) => (state as any).masterHolidays || { holidays: [] },
  );

  const isInternThisMonth = useMemo(() => {
    if (isIntern) return true;
    if (!conversionDate) return false;

    const convDate = dayjs(conversionDate);
    if (!convDate.isValid()) return false;

    const selectedDate = dayjs(new Date(year, month - 1, 1));
    const convYear = convDate.year();
    const convMonth = convDate.month() + 1;
    const selectedYear = selectedDate.year();
    const selectedMonth = selectedDate.month() + 1;

    if (selectedYear < convYear) return true;
    if (selectedYear === convYear && selectedMonth < convMonth) return true;

    return false;
  }, [isIntern, conversionDate, year, month]);

  const isConversionMonth = useMemo(() => {
    if (!conversionDate) return false;

    const convDate = dayjs(conversionDate);
    if (!convDate.isValid()) return false;

    const selectedDate = dayjs(new Date(year, month - 1, 1));
    return (
      selectedDate.year() === convDate.year() &&
      selectedDate.month() + 1 === convDate.month() + 1
    );
  }, [conversionDate, year, month]);

  const { internQuota, fullTimerAdded, internLeavesTaken } = useMemo(() => {
    let joinMonth = 1;
    let joinYear = year;
    if (joiningDate) {
      const jd = new Date(joiningDate);
      if (!isNaN(jd.getTime())) {
        joinMonth = jd.getMonth() + 1;
        joinYear = jd.getFullYear();
      }
    }

    const getMonthlyUsageForQuota = (m: number) => {
      if (!Array.isArray(attendanceRecords)) return 0;

      return attendanceRecords
        .filter((r) => {
          const dateStr = dayjs(r.workingDate).format("YYYY-MM-DD");
          const [recordYear, recordMonth] = dateStr.split("-");
          return parseInt(recordYear) === year && parseInt(recordMonth) === m;
        })
        .reduce((acc, r) => {
          const dateObj = new Date(r.workingDate);
          const day = dateObj.getDay();
          const isWeekend = day === 0 || day === 6;
          const dateStrLocal = dayjs(r.workingDate).format("YYYY-MM-DD");
          const isHoliday = holidays?.some((h: any) => {
            const hDateStr = dayjs(h.holidayDate || h.date).format(
              "YYYY-MM-DD",
            );
            return hDateStr === dateStrLocal;
          });

          if (isWeekend || isHoliday) return acc;

          const status = (r.status || "").toLowerCase();
          if (r.firstHalf || r.secondHalf) {
            const processHalf = (half: string | null) => {
              if (!half) return 0;
              return half.toLowerCase().includes("leave") ? 0.5 : 0;
            };
            return acc + processHalf(r.firstHalf) + processHalf(r.secondHalf);
          }

          if (status.includes("leave")) return acc + 1;
          if (status.includes("half day")) return acc + 0.5;
          return acc;
        }, 0);
    };

    const isInternForMonth = (m: number) => {
      if (isIntern) return true;
      if (!conversionDate) return false;

      const convDate = new Date(conversionDate);
      const targetDate = new Date(year, m - 1, 15);
      return targetDate < convDate;
    };

    let calculatedInternQuota = 0;
    let calculatedFullTimerAdded = 0;
    let calculatedInternLeavesTaken = 0;

    for (let m = 1; m <= 12; m++) {
      if (year < joinYear || (year === joinYear && m < joinMonth)) continue;

      const internMonth = isInternForMonth(m);
      const jd = joiningDate ? new Date(joiningDate) : null;
      let monthlyAccrual = internMonth ? 1.0 : 1.5;

      if (year === joinYear && m === joinMonth && jd && jd.getDate() > 10) {
        monthlyAccrual = 0;
      }

      if (internMonth) {
        calculatedInternQuota += monthlyAccrual;
        calculatedInternLeavesTaken += getMonthlyUsageForQuota(m);
      } else {
        calculatedFullTimerAdded += monthlyAccrual;
      }
    }

    return {
      internQuota: calculatedInternQuota,
      fullTimerAdded: calculatedFullTimerAdded,
      internLeavesTaken: calculatedInternLeavesTaken,
    };
  }, [attendanceRecords, year, isIntern, conversionDate, joiningDate, holidays]);

  const { closingBalance, monthlyLOP, monthlyUsed, monthlyOpening } = useMemo(() => {
    if (monthlyLeaveBalance) {
      return {
        closingBalance: monthlyLeaveBalance.balance,
        monthlyLOP: monthlyLeaveBalance.lop,
        monthlyUsed: monthlyLeaveBalance.leavesTaken,
        monthlyOpening: monthlyLeaveBalance.carryOver,
      };
    }

    const isInternForMonth = (m: number) => {
      if (isIntern) return true;
      if (!conversionDate) return false;

      const convDate = new Date(conversionDate);
      const targetDate = new Date(year, m - 1, 15);
      return targetDate < convDate;
    };

    let currentBalance = !isInternForMonth(1) ? leaveBalance?.carryOver || 0 : 0;
    let joinMonth = 0;
    let joinYear = 0;

    if (joiningDate) {
      const jd = new Date(joiningDate);
      if (!isNaN(jd.getTime())) {
        joinMonth = jd.getMonth() + 1;
        joinYear = jd.getFullYear();
      }
    }

    const getMonthlyUsage = (m: number) => {
      if (!Array.isArray(attendanceRecords)) return 0;

      return attendanceRecords
        .filter((r) => {
          const dateStr = dayjs(r.workingDate).format("YYYY-MM-DD");
          const [recordYear, recordMonth] = dateStr.split("-");
          return parseInt(recordYear) === year && parseInt(recordMonth) === m;
        })
        .reduce((acc, r) => {
          const dateObj = new Date(r.workingDate);
          const day = dateObj.getDay();
          const isWeekend = day === 0 || day === 6;
          const dateStrLocal = dayjs(r.workingDate).format("YYYY-MM-DD");
          const isHoliday = holidays?.some((h: any) => {
            const hDateStr = dayjs(h.holidayDate || h.date).format(
              "YYYY-MM-DD",
            );
            return hDateStr === dateStrLocal;
          });

          if (isWeekend || isHoliday) return acc;

          const status = (r.status || "").toLowerCase();
          if (r.firstHalf || r.secondHalf) {
            const processHalf = (half: string | null) => {
              if (!half) return 0;
              const halfStatus = half.toLowerCase();
              return halfStatus.includes("leave") || halfStatus.includes("absent")
                ? 0.5
                : 0;
            };
            return acc + processHalf(r.firstHalf) + processHalf(r.secondHalf);
          }

          if (status.includes("leave") || status.includes("absent")) return acc + 1;
          if (status.includes("half day")) return acc + 0.5;
          return acc;
        }, 0);
    };

    let finalBalance = 0;
    let finalLOP = 0;
    let finalUsed = 0;
    let finalOpening = 0;

    for (let m = 1; m <= month; m++) {
      if (year < joinYear || (year === joinYear && m < joinMonth)) {
        currentBalance = 0;
        if (m === month) {
          finalOpening = 0;
          finalBalance = 0;
        }
        continue;
      }

      const internMonth = isInternForMonth(m);
      const jd = joiningDate ? dayjs(joiningDate) : null;
      let monthlyAccrual = internMonth ? 1 : 1.5;

      if (year === joinYear && m === joinMonth && jd?.isValid() && jd.date() > 10) {
        monthlyAccrual = 0;
      }

      if (internMonth) currentBalance = 0;
      if (m === month) finalOpening = currentBalance;

      currentBalance += monthlyAccrual;

      const used = getMonthlyUsage(m);
      currentBalance -= used;

      let lop = 0;
      if (currentBalance < 0) {
        lop = Math.abs(currentBalance);
        currentBalance = 0;
      }

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
      monthlyOpening: finalOpening,
    };
  }, [
    attendanceRecords,
    year,
    month,
    isIntern,
    conversionDate,
    leaveBalance,
    joiningDate,
    holidays,
    monthlyLeaveBalance,
  ]);

  const trendForMonth = useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return trends.find(
      (t) => t.month === monthNames[month - 1] && t.year === year,
    );
  }, [trends, month, year]);

  const entitlement = useMemo(() => {
    if (isInternThisMonth) return ENTITLEMENT.INTERN;
    if (leaveBalance && String(leaveBalance.year) === String(year)) {
      return leaveBalance.entitlement;
    }
    return isIntern ? ENTITLEMENT.INTERN : ENTITLEMENT.FULL_TIMER;
  }, [leaveBalance, year, isIntern, isInternThisMonth]);

  const leaveUsed = monthlyLeaveBalance
    ? monthlyLeaveBalance.leavesTaken
    : trendForMonth
      ? trendForMonth.totalLeaves
      : monthlyUsed;

  const values: AttendanceStatsCardValues = {
    isInternThisMonth,
    isConversionMonth,
    internQuota,
    fullTimerAdded,
    internLeavesTaken,
    entitlement,
    carryForward: monthlyOpening,
    leaveUsed,
    lop: monthlyLeaveBalance ? monthlyLeaveBalance.lop : monthlyLOP,
    availableBalance: closingBalance,
  };

  return (
    <div
      className={`attendance-stats ${
        loading ? "attendance-stats--loading" : ""
      }`}
    >
      <AttendanceStatsCardsMobile values={values} />
      <AttendanceStatsCardsDesktop values={values} />
    </div>
  );
};

export default AttendanceStatsCards;
