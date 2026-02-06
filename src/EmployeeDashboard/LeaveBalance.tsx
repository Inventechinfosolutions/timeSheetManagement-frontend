import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector, useAppDispatch } from "../hooks";
import {
  getLeaveBalance,
  getLeaveStats,
  getAllLeaveRequests,
} from "../reducers/leaveRequest.reducer";
import { Calendar, CheckCircle, Clock, TrendingUp, Ban } from "lucide-react";
import { Select } from "antd";
import { ChevronDown } from "lucide-react";

// Fallback entitlement when backend balance API is not used
const ENTITLEMENT = {
  FULL_TIMER: 18,
  INTERN: 12,
} as const;

const LeaveBalance = () => {
  const dispatch = useAppDispatch();
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const { currentUser } = useAppSelector((state) => state.user);
  const { stats, entities, leaveBalance, loading } = useAppSelector(
    (state) => state.leaveRequest,
  );

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const employeeId = useMemo(
    () =>
      currentUser?.loginId ||
      entity?.employeeId ||
      entity?.id ||
      localStorage.getItem("userLoginId") ||
      "",
    [currentUser?.loginId, entity?.employeeId, entity?.id],
  );

  // Prefer backend balance API; fallback to stats + designation
  useEffect(() => {
    if (!employeeId) return;
    setBalanceLoading(true);
    dispatch(getLeaveBalance({ employeeId, year: selectedYear }))
      .finally(() => setBalanceLoading(false))
      .catch(() => {});
  }, [dispatch, employeeId, selectedYear]);

  useEffect(() => {
    if (!employeeId) return;
    dispatch(getLeaveStats({ employeeId, year: String(selectedYear) }));
  }, [dispatch, employeeId, selectedYear]);

  useEffect(() => {
    if (!employeeId) return;
    dispatch(
      getAllLeaveRequests({
        employeeId,
        year: String(selectedYear),
        limit: 500, // Fetch more to calculate LOP/Paid
      }),
    );
  }, [dispatch, employeeId, selectedYear]);

  const isIntern = useMemo(() => {
    const designation = (entity?.designation ?? entity?.designation_name ?? "")
      .toString()
      .toLowerCase();
    return designation.includes("intern");
  }, [entity?.designation, entity?.designation_name]);
  const entitlementLabel = isIntern
    ? "Intern (1 per month)"
    : "Full timer (1.5 per month)";

  const fromBackend =
    leaveBalance &&
    String(leaveBalance.year) === String(selectedYear) &&
    leaveBalance.employeeId === employeeId;

  const entitlement = fromBackend
    ? leaveBalance.entitlement
    : isIntern
      ? ENTITLEMENT.INTERN
      : ENTITLEMENT.FULL_TIMER;

  // LOP logic for interns
  const { paidUsed, lopUsed, approvedUsed } = useMemo(() => {
    if (!Array.isArray(entities))
      return { paidUsed: 0, lopUsed: 0, approvedUsed: 0 };

    const approvedLeaves = entities.filter(
      (e: any) =>
        (e.requestType === "Apply Leave" || e.requestType === "Leave") &&
        e.status === "Approved",
    );

    if (!isIntern) {
      return {
        paidUsed: approvedLeaves.length,
        lopUsed: 0,
        approvedUsed: approvedLeaves.length,
      };
    }

    // Group by month: YYYY-MM
    const monthlyLeaves: Record<string, number> = {};
    approvedLeaves.forEach((e: any) => {
      if (e.fromDate) {
        const month = e.fromDate.substring(0, 7);
        monthlyLeaves[month] = (monthlyLeaves[month] || 0) + 1;
      }
    });

    let paid = 0;
    let lop = 0;
    Object.values(monthlyLeaves).forEach((count) => {
      paid += 1; // First leave of month is paid
      lop += count - 1; // Others are LOP
    });

    return {
      paidUsed: paid,
      lopUsed: lop,
      approvedUsed: approvedLeaves.length,
    };
  }, [entities, isIntern]);

  const used = fromBackend ? leaveBalance.used : approvedUsed;
  const pendingFromEntities = useMemo(() => {
    if (!Array.isArray(entities)) return 0;
    return entities.filter(
      (e: any) =>
        (e.requestType === "Apply Leave" || e.requestType === "Leave") &&
        (e.status === "Pending" || e.status === "pending"),
    ).length;
  }, [entities]);
  const pendingCount = fromBackend ? leaveBalance.pending : pendingFromEntities;
  const balance = fromBackend
    ? leaveBalance.balance
    : Math.max(0, entitlement - (paidUsed + lopUsed));

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="overflow-y-auto custom-scrollbar px-5 md:px-8 pt-6 pb-8 w-full max-w-[1000px] mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#2B3674]">Leave Balance</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#A3AED0]">Year</span>
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            className="w-28 font-semibold"
            suffixIcon={<ChevronDown size={16} className="text-[#4318FF]" />}
            options={yearOptions.map((y) => ({ label: String(y), value: y }))}
          />
        </div>
      </div>

      <p className="text-sm text-[#A3AED0]">
        View your annual leave entitlement, leaves taken, pending requests, and
        balance. Full timers get 18 leaves/year (1.5 per month), interns get 12
        leaves/year (1 per month).
      </p>

      {balanceLoading || (loading && !leaveBalance && !stats) ? (
        <div className="flex items-center justify-center py-12 text-[#667eea] font-medium">
          Loading…
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-4 md:p-8 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] border border-gray-100 animate-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 md:gap-4 relative">
            {/* Entitlement Section */}
            <div className="flex flex-col items-center justify-center text-center p-2 group hover:scale-105 transition-transform duration-300">
              <div className="p-3 rounded-2xl bg-blue-50/80 mb-3 group-hover:bg-blue-100 transition-colors duration-300">
                <TrendingUp className="w-6 h-6 text-[#4318FF]" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-black text-[#1B2559] leading-none mb-1">
                  {entitlement}
                </span>
                <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">
                  Entitlement
                </span>
                <p className="text-[10px] text-[#707EAE] mt-1 font-medium italic opacity-80">
                  {entitlementLabel}
                </p>
              </div>
            </div>

            {/* divider only for large screens */}
            <div className="hidden lg:block absolute left-[20%] top-1/4 bottom-1/4 w-px bg-gray-100"></div>

            {/* Leaves Taken Section */}
            <div className="flex flex-col items-center justify-center text-center p-2 group hover:scale-105 transition-transform duration-300">
              <div className="p-3 rounded-2xl bg-green-50/80 mb-3 group-hover:bg-green-100 transition-colors duration-300">
                <CheckCircle className="w-6 h-6 text-[#05CD99]" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-black text-[#1B2559] leading-none mb-1">
                  {isIntern ? paidUsed : approvedUsed}
                </span>
                <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">
                  Leaves Taken
                </span>
                <p className="text-[10px] text-[#707EAE] mt-1 font-medium opacity-80">
                  Approved in {selectedYear}
                </p>
              </div>
            </div>

            {/* divider only for large screens */}
            <div className="hidden lg:block absolute left-[40%] top-1/4 bottom-1/4 w-px bg-gray-100"></div>

            {/* LOP Section */}
            <div className="flex flex-col items-center justify-center text-center p-2 group hover:scale-105 transition-transform duration-300">
              <div className="p-3 rounded-2xl bg-red-50/80 mb-3 group-hover:bg-red-100 transition-colors duration-300">
                <Ban className="w-6 h-6 text-[#EE5D50]" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-black text-[#1B2559] leading-none mb-1">
                  {lopUsed}
                </span>
                <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">
                  LOP
                </span>
                <p className="text-[10px] text-[#707EAE] mt-1 font-medium opacity-80">
                  Loss of Pay
                </p>
              </div>
            </div>

            {/* divider only for large screens */}
            <div className="hidden lg:block absolute left-[60%] top-1/4 bottom-1/4 w-px bg-gray-100"></div>

            {/* Pending Section */}
            <div className="flex flex-col items-center justify-center text-center p-2 group hover:scale-105 transition-transform duration-300">
              <div className="p-3 rounded-2xl bg-amber-50/80 mb-3 group-hover:bg-amber-100 transition-colors duration-300">
                <Clock className="w-6 h-6 text-[#FFB547]" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-black text-[#1B2559] leading-none mb-1">
                  {pendingCount}
                </span>
                <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">
                  Pending
                </span>
                <p className="text-[10px] text-[#707EAE] mt-1 font-medium opacity-80">
                  Awaiting
                </p>
              </div>
            </div>

            {/* divider only for large screens */}
            <div className="hidden lg:block absolute left-[80%] top-1/4 bottom-1/4 w-px bg-gray-100"></div>

            {/* Balance Section */}
            <div className="flex flex-col items-center justify-center text-center p-2 group hover:scale-105 transition-transform duration-300 col-span-2 lg:col-span-1 border-t md:border-t-0 border-gray-50 pt-6 md:pt-2 mt-2 md:mt-0">
              <div className="p-3 rounded-2xl bg-[#F4F7FE] mb-3 group-hover:bg-[#EAEFFD] transition-colors duration-300">
                <Calendar className="w-6 h-6 text-[#4318FF]" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl md:text-4xl font-extrabold text-[#4318FF] leading-none mb-1">
                  {balance}
                </span>
                <span className="text-[11px] font-bold text-[#4318FF] uppercase tracking-wider">
                  Current Balance
                </span>
                <p className="text-[10px] text-[#707EAE] mt-1 font-medium opacity-80">
                  Remaining in {selectedYear}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] border border-gray-100">
        <h3 className="text-lg font-bold text-[#2B3674] mb-2">Policy</h3>
        <ul className="text-sm text-[#2B3674] space-y-1.5">
          <li>
            <strong>Full timer:</strong> 18 leaves per year (1.5 per month)
          </li>
          <li>
            <strong>Intern:</strong> 12 leaves per year (1 per month)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LeaveBalance;
