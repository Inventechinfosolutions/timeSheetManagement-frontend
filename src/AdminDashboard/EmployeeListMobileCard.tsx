import { Pencil, RefreshCw, Eye, Mail, User } from "lucide-react";
import { UserStatus } from "../enums";

interface Employee {
  id: string;
  name: string;
  department: string;
  role?: string;
  rawId: string;
  resetRequired: boolean;
  isActive: boolean;
  userStatus?: string;
  createdAt: string;
  lastLoggedIn?: string | null;
  lastLinkSentAt?: string | null;
  isAdmin: boolean;
}

interface EmployeeListMobileCardProps {
  employees: Employee[];
  onViewDetails: (empId: string) => void;
  onViewDashboard: (empId: string) => void;
  onResendActivation: (empId: string) => void;
  onToggleStatus: (empId: string) => void;
  isAdmin: boolean;
}

const EmployeeListMobileCard = ({
  employees,
  onViewDetails,
  onViewDashboard,
  onResendActivation,
  onToggleStatus,
  isAdmin,
}: EmployeeListMobileCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {employees.map((emp) => {
        const canSendActivation =
          isAdmin &&
          emp.userStatus === UserStatus.DRAFT &&
          (() => {
            if (!emp.lastLinkSentAt) return true;
            const lastSent = new Date(emp.lastLinkSentAt);
            const now = new Date();
            const hours =
              (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
            return hours >= 24;
          })();

        return (
          <div
            key={emp.id}
            className="bg-white rounded-2xl p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col hover:shadow-md transition-all"
          >
            {/* 1. EMPLOYEE */}
            <div className="pb-3">
              <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-wider mb-1">
                EMPLOYEE
              </p>
              <h3 className="text-base font-bold text-[#2B3674] tracking-tight">
                {emp.name}{" "}
                <span className="font-semibold text-[#64748B]">
                  ({emp.id})
                </span>
              </h3>
            </div>

            {/* 2. DEPARTMENT */}
            <div className="py-3 border-t border-gray-100">
              <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-wider mb-1.5">
                DEPARTMENT
              </p>
              <span className="inline-block px-3 py-1 rounded-md bg-gray-100/60 text-[#475569] text-xs font-bold border border-gray-200/50">
                {emp.department || "General"}
              </span>
            </div>

            {/* 3. ROLE */}
            <div className="py-3 border-t border-gray-100">
              <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-wider mb-1">
                ROLE
              </p>
              <p className="text-sm font-semibold text-[#2B3674]">
                {emp.role || "—"}
              </p>
            </div>

            {/* 4. ACTIVATION (if in Draft status) */}
            {emp.userStatus === UserStatus.DRAFT && (
              <div className="py-3 border-t border-gray-100">
                <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-wider mb-1.5">
                  ACTIVATION
                </p>
                {canSendActivation ? (
                  <button
                    onClick={() => onResendActivation(emp.rawId)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                      !emp.lastLinkSentAt
                        ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                        : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                    }`}
                    title={
                      !emp.lastLinkSentAt
                        ? "Send Activation Link"
                        : "Resend Activation Link"
                    }
                  >
                    {!emp.lastLinkSentAt ? (
                      <Mail size={14} />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    <span>
                      {!emp.lastLinkSentAt ? "Send Link" : "Resend Link"}
                    </span>
                  </button>
                ) : (
                  <span className="text-[#A3AED0] text-xs font-bold uppercase tracking-widest">
                    —
                  </span>
                )}
              </div>
            )}

            {/* 5. STATUS & ACTIONS */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-wider mb-2">
                STATUS
              </p>
              <div className="flex items-center justify-between gap-3">
                {/* Status Toggle or Draft Badge on Left */}
                <div>
                  {emp.userStatus === UserStatus.DRAFT ? (
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700 border border-gray-300">
                      Draft
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          (emp.userStatus === UserStatus.ACTIVE ||
                            emp.userStatus === UserStatus.INACTIVE) &&
                          isAdmin
                        ) {
                          onToggleStatus(emp.rawId);
                        }
                      }}
                      disabled={!isAdmin || emp.userStatus === UserStatus.DRAFT}
                      className={`relative w-20 h-7 rounded-full transition-all duration-300 flex items-center ${
                        emp.isActive
                          ? isAdmin
                            ? "bg-[#0095FF] cursor-pointer"
                            : "bg-[#0095FF]/60 cursor-not-allowed"
                          : isAdmin
                            ? "bg-red-500 cursor-pointer"
                            : "bg-red-300 cursor-not-allowed"
                      }`}
                      title={
                        emp.userStatus === UserStatus.DRAFT
                          ? "Activate first to change status"
                          : !isAdmin
                            ? "Only admins can change employee status"
                            : "Toggle Status"
                      }
                    >
                      <span
                        className={`absolute text-[10px] font-bold text-white uppercase transition-all duration-300 ${
                          emp.isActive ? "left-2" : "right-2"
                        }`}
                      >
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                      <div
                        className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                          emp.isActive ? "translate-x-[54px]" : "translate-x-1"
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Action Icon Buttons on Right */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewDashboard(emp.rawId)}
                    className="p-2 text-blue-600 bg-blue-50/70 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-200 hover:shadow-md hover:shadow-blue-200 active:scale-90"
                    title="View Dashboard"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onViewDetails(emp.rawId)}
                    className="p-2 text-blue-600 bg-blue-50/70 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-200 hover:shadow-md hover:shadow-blue-200 active:scale-90"
                    title={isAdmin ? "Edit Details" : "View Details"}
                  >
                    {isAdmin ? <Pencil size={18} /> : <User size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeListMobileCard;
