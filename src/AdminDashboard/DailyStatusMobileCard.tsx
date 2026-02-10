import { Clock } from "lucide-react";
import { AttendanceStatus } from "./enums";

import { DailyStatusMobileCardProps } from "./types";

const DailyStatusMobileCard = ({ employees }: DailyStatusMobileCardProps) => {
  const getStatusBadgeClass = (status: string) => {
    const colors: any = {
      [AttendanceStatus.FullDay]: "bg-[#D1FAE5] text-[#05CD99]",
      [AttendanceStatus.HalfDay]: "bg-[#FEF3C7] text-[#FFB020]",
      [AttendanceStatus.Leave]: "bg-[#FEE2E2] text-[#EE5D50]",
      [AttendanceStatus.NotUpdated]: "bg-[#FEF3C7] text-[#FFB020]",
      [AttendanceStatus.Holiday]: "bg-[#DBEAFE] text-[#1890FF]",
      [AttendanceStatus.Weekend]: "bg-[#FEE2E2] text-[#EE5D50]",
      [AttendanceStatus.Pending]: "bg-[#FEF3C7] text-[#FFB020]",
    };
    return `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${colors[status] || "bg-gray-100 text-gray-700"}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {employees.map((emp) => (
        <div
          key={emp.id}
          className="bg-white rounded-2xl p-5 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4318FF] to-[#5BC4FF] flex items-center justify-center text-white font-black text-xs shadow-inner">
                {emp.avatar}
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-[#2B3674] text-base group-hover:text-[#4318FF] transition-colors">
                  {emp.fullName || emp.name}
                </h3>
                <p className="text-[10px] font-bold text-[#A3AED0] tracking-widest uppercase">
                  ID:{" "}
                  <span className="text-[#475569]">
                    {emp.employeeId || emp.id}
                  </span>
                </p>
              </div>
            </div>
            <span className={getStatusBadgeClass(emp.status)}>
              {emp.status}
            </span>
          </div>

          <div className="h-px bg-gray-50 -mx-5" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[#A3AED0] text-[10px] font-black uppercase tracking-widest mb-2">
                Department
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shadow-sm"
                  style={{ backgroundColor: emp.deptColor }}
                ></div>
                <span className="text-xs font-bold text-[#475569]">
                  {emp.department}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[#A3AED0] text-[10px] font-black uppercase tracking-widest mb-1 text-right">
                Today's Hours
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex justify-between text-[10px] font-bold text-[#475569]">
                  <span>{emp.todayHours} / 9h</span>
                  <Clock size={10} className="text-[#A3AED0]" />
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-[#4318FF] to-[#5BC4FF] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((emp.todayHours / 9) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DailyStatusMobileCard;
