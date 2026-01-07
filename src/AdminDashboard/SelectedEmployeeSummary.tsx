import { CalendarCheck, Clock, AlertTriangle } from "lucide-react";
import { TimesheetEntry } from "../types";

interface Props {
  employeeName: string;
  entries: TimesheetEntry[];
}

const SelectedEmployeeSummary = ({ employeeName, entries }: Props) => {
  const presentDays = entries.filter(
    (e) => e.status === "Present" || e.status === "Half Day"
  ).length;

  const totalWorkingMinutes = entries.reduce((acc, curr) => {
    if (!curr.loginTime || !curr.logoutTime) return acc;

    const parseTime = (timeStr: string) => {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const login = parseTime(curr.loginTime as string);
    const logout = parseTime(curr.logoutTime as string);
    let diff = logout - login;
    if (diff < 0) diff = 0;
    return acc + diff;
  }, 0);

  const totalHours = Math.round(totalWorkingMinutes / 60);

  const incompleteDays = entries.filter(
    (day) =>
      !day.isFuture &&
      !day.isToday &&
      !day.isWeekend &&
      !day.loginTime &&
      day.status !== "Absent"
  ).length;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-5 duration-700">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold text-[#2B3674]">
          {employeeName}'s Summary
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Present Days */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#E6FFFA] flex items-center justify-center text-[#01B574] group-hover:scale-110 transition-transform">
              <CalendarCheck size={24} />
            </div>
            <span className="px-3 py-1 bg-[#E6FFFA] text-[#01B574] rounded-full text-[10px] font-bold uppercase tracking-wider">
              This Month
            </span>
          </div>
          <div>
            <h4 className="text-4xl font-bold text-[#2B3674] mb-1">
              {presentDays}
            </h4>
            <p className="text-gray-500 text-sm font-medium">Present Days</p>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
            <span className="px-3 py-1 bg-[#F4F7FE] text-[#4318FF] rounded-full text-[10px] font-bold uppercase tracking-wider">
              This Month
            </span>
          </div>
          <div>
            <h4 className="text-4xl font-bold text-[#2B3674] mb-1">
              {totalHours}
            </h4>
            <p className="text-gray-500 text-sm font-medium">
              Total Working Hours
            </p>
          </div>
        </div>

        {/* Incomplete Days */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFF9E5] flex items-center justify-center text-[#FFB020] group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
            <span className="px-3 py-1 bg-[#FFF9E5] text-[#FFB020] rounded-full text-[10px] font-bold uppercase tracking-wider">
              Action Needed
            </span>
          </div>
          <div>
            <h4 className="text-4xl font-bold text-[#2B3674] mb-1">
              {incompleteDays}
            </h4>
            <p className="text-gray-500 text-sm font-medium">Incomplete Days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedEmployeeSummary;
