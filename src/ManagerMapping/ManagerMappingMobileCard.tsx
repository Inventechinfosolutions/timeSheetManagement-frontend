import React from "react";
import { Eye, Users, Filter } from "lucide-react";

export interface MappingHistoryItem {
  managerName: string;
  managerId: string;
  employeeCount: number;
  department: string;
  status: string;
}

interface ManagerMappingMobileCardProps {
  mappings: MappingHistoryItem[];
  onViewTeam: (managerId: string) => void;
}

const ManagerMappingMobileCard: React.FC<ManagerMappingMobileCardProps> = ({
  mappings,
  onViewTeam,
}) => {
  if (mappings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-[#A3AED0]">
        <Filter size={36} className="mx-auto mb-2 opacity-30 text-[#4318FF]" />
        <p className="text-sm font-semibold">No mapping history available</p>
      </div>
    );
  }

  const getStatusBadgeStyle = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "ACTIVE") {
      return "bg-green-50 text-green-600 border-green-200";
    }
    if (s === "DRAFT") {
      return "bg-amber-50 text-amber-600 border-amber-200";
    }
    if (s === "INACTIVE") {
      return "bg-red-50 text-red-600 border-red-200";
    }
    return "bg-blue-50 text-blue-600 border-blue-200";
  };

  return (
    <div className="space-y-3">
      {mappings.map((mapping) => {
        const initials = mapping.managerName
          ? mapping.managerName
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
          : "M";

        return (
          <div
            key={`${mapping.managerId}-${mapping.department}`}
            onClick={() => onViewTeam(mapping.managerId)}
            className="bg-white rounded-2xl p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
          >
            {/* Top Row: Manager Avatar + Name + ID, and Status Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4318FF] to-[#868CFF] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-[#2B3674] truncate">
                    {mapping.managerName}
                  </h4>
                  <p className="text-xs font-semibold text-[#64748B]">
                    ID: <span className="font-bold text-[#2B3674]">{mapping.managerId}</span>
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider border shrink-0 ${getStatusBadgeStyle(
                  mapping.status,
                )}`}
              >
                {mapping.status}
              </span>
            </div>

            {/* Middle Grid: Department & Team Size */}
            <div className="grid grid-cols-2 gap-2.5 py-2.5 border-y border-gray-100 bg-[#F8F9FC]/70 rounded-xl px-3">
              <div className="min-w-0">
                <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-wider mb-0.5">
                  DEPARTMENT
                </p>
                <p className="text-xs font-bold text-[#2B3674] truncate" title={mapping.department}>
                  {mapping.department || "General"}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-wider mb-0.5">
                  TEAM SIZE
                </p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4318FF]">
                  <Users size={13} className="shrink-0" />
                  <span>
                    {mapping.employeeCount} {mapping.employeeCount === 1 ? "member" : "members"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Row: View Team action */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[11px] font-semibold text-[#A3AED0]">
                Reporting Team
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTeam(mapping.managerId);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-[#4318FF]/10 text-[#4318FF] hover:bg-[#4318FF] hover:text-white active:scale-95 shadow-sm cursor-pointer"
                title="View mapped employees"
              >
                <Eye size={14} />
                <span>View Team</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ManagerMappingMobileCard;
