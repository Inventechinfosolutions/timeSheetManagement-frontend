import { Pencil, RefreshCw, Eye } from "lucide-react";

import { EmployeeListMobileCardProps } from "./types";

const EmployeeListMobileCard = ({
  employees,
  onViewDetails,
  onViewDashboard,
  onResendActivation,
  onToggleStatus,
  isAdmin,
}: EmployeeListMobileCardProps) => {
  // ... existing body ...
  // ... around line 113 inside the actions div ...

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {employees.map((emp) => {
        const is24HoursOld =
          new Date(emp.createdAt).getTime() < Date.now() - 24 * 60 * 60 * 1000;
        const shouldShowResendButton =
          emp.isActive && !emp.lastLoggedIn && is24HoursOld;

        return (
          <div
            key={emp.id}
            className="bg-white rounded-2xl p-5 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-[#2B3674] text-lg lg:text-xl group-hover:text-[#4318FF] transition-colors">
                  {emp.name}
                </h3>
                <p className="text-sm font-bold text-[#A3AED0] tracking-wider uppercase">
                  ID: <span className="text-[#475569]">{emp.id}</span>
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-50 -mx-5" />

            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#A3AED0] text-xs font-bold uppercase tracking-widest mb-1">
                  Department
                </p>
                <div className="inline-flex px-3 py-1 rounded-full bg-[#F4F7FE] text-[#4318FF] text-xs font-bold border border-[#4318FF]/10">
                  {emp.department || "General"}
                </div>
              </div>

              {/* Status Section */}
              <div>
                <p className="text-[#A3AED0] text-xs font-bold uppercase tracking-widest mb-1">
                  Status
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (emp.isActive && isAdmin) {
                      onToggleStatus(emp.rawId);
                    }
                  }}
                  disabled={!emp.isActive || !isAdmin}
                  className={`relative w-20 h-7 rounded-full transition-all duration-300 flex items-center ${
                    emp.isActive
                      ? isAdmin
                        ? "bg-[#0095FF] cursor-pointer"
                        : "bg-[#0095FF]/60 cursor-not-allowed"
                      : "bg-red-300 cursor-not-allowed"
                  }`}
                  title={
                    !isAdmin
                      ? "Only admins can change employee status"
                      : !emp.isActive
                        ? "Status cannot be changed once Inactive"
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
              </div>

              <div className="flex items-center gap-2">
                {shouldShowResendButton && (
                  <button
                    onClick={() => onResendActivation(emp.rawId)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-600 font-bold text-xs hover:bg-amber-100 border border-amber-200 transition-all active:scale-95"
                    title="Resend Activation Link"
                  >
                    <RefreshCw size={14} />
                    {/* Resend */}
                  </button>
                )}
                <button
                  onClick={() => onViewDashboard(emp.rawId)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4318FF]/5 text-[#4318FF] font-bold text-sm hover:bg-[#4318FF] hover:text-white transition-all active:scale-95 shadow-sm"
                  title="View Dashboard"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => onViewDetails(emp.rawId)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4318FF]/5 text-[#4318FF] font-bold text-sm hover:bg-[#4318FF] hover:text-white transition-all active:scale-95 shadow-sm"
                  title="Edit Details"
                >
                  <Pencil size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeListMobileCard;
