import { useState } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  AlertTriangle,
  Download,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { TimesheetEntry } from "../../../types";

interface FullTimesheetProps {
  entries: TimesheetEntry[];
  calculateTotal: (login: string, logout: string) => string;
  displayDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  employeeName: string;
}

const EmployeeTimesheetView = ({
  entries,
  calculateTotal,
  displayDate,
  onPrevMonth,
  onNextMonth,
  employeeName,
}: FullTimesheetProps) => {
  // Calculate summary statistics
  const presentDays = entries.filter(
    (e) => e.status === "Full Day" || e.status === "Half Day"
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
      day.status !== "Leave"
  ).length;

  // PDF Download State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleDownloadPDF = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    const filteredEntries = entries.filter((entry) => {
      // Normalize entry date to YYYY-MM-DD string for safe comparison with input values
      const d = new Date(entry.fullDate);
      const entryDateStr = d.toLocaleDateString("en-CA"); // en-CA gives YYYY-MM-DD
      return entryDateStr >= startDate && entryDateStr <= endDate;
    });

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("Employee Timesheet Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Employee Name: ${employeeName}`, 14, 30);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 38);

    const tableBody = filteredEntries.map((entry) => [
      entry.formattedDate,
      entry.dayName,
      entry.status,
      entry.loginTime || "-",
      entry.logoutTime || "-",
      calculateTotal(entry.loginTime || "", entry.logoutTime || ""),
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["Date", "Day", "Status", "Login", "Logout", "Total Hours"]],
      body: tableBody,
    });

    doc.save(`${employeeName}_Timesheet_${startDate}_${endDate}.pdf`);
    setShowDownloadModal(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F4F7FE]">
      {/* Header */}
      <header className="bg-white/50 backdrop-blur-sm sticky top-0 z-20 px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 transition-all">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowDownloadModal(true)}
            className="p-2 bg-[#F4F7FE] text-[#2B3674] hover:bg-[#E6FFFA] hover:text-[#00A3C4] rounded-lg transition-all"
            title="Download PDF"
          >
            <Download size={20} />
          </button>
          <h2 className="text-xl font-bold text-[#2B3674] truncate">
            Full Timesheet
          </h2>
        </div>

        <div className="flex items-center justify-between md:justify-center gap-4 text-sm font-bold text-[#2B3674] bg-white px-4 py-1.5 rounded-lg shadow-sm border border-gray-100 w-full md:w-auto">
          <button
            onClick={onPrevMonth}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-[#00A3C4]"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-[120px] text-center">
            {displayDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={onNextMonth}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-[#00A3C4]"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="p-8">
        {/* Employee Summary Cards */}
        <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-5 duration-700">
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
                <p className="text-gray-500 text-sm font-medium">
                  Present Days
                </p>
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
                <p className="text-gray-500 text-sm font-medium">
                  Incomplete Days
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
          {/* Table Header - Removed Action Column */}
          <div className="hidden md:grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-4 text-center items-center">
            <div className="text-left pl-4">Date</div>
            <div className="text-left">Day</div>
            <div className="">Attendance</div>
            <div className="">Login</div>
            <div className="">Logout</div>
            <div className="">Total</div>
            <div className="">Status</div>
          </div>

          <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

          {/* Table Rows - Full Height (no overflow-y-auto restricted height) */}
          <div className="space-y-4 pb-2">
            {entries.map((day) => {
              // Weekend Row
              if (day.isWeekend) {
                return (
                  <div key={day.date}>
                    {/* Desktop View */}
                    <div className="hidden md:grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl bg-red-50/50 text-gray-400">
                      <div className="font-bold text-red-300 pl-2">
                        {day.formattedDate}
                      </div>
                      <div className="text-red-300">{day.dayName}</div>
                      <div className="col-span-5 text-center text-red-200 text-xs font-medium uppercase tracking-widest bg-red-50/50 py-2 rounded-lg border border-red-100/50">
                        Weekend
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="flex md:hidden flex-col p-4 rounded-xl bg-red-50/50 text-gray-400 border border-red-100/50">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-red-300">
                          {day.formattedDate}
                        </div>
                        <div className="text-red-300">{day.dayName}</div>
                      </div>
                      <div className="text-center text-red-200 text-xs font-medium uppercase tracking-widest bg-red-50/50 py-2 rounded-lg border border-red-100/50">
                        Weekend
                      </div>
                    </div>
                  </div>
                );
              }

              // Past Incomplete Row
              if (
                !day.isFuture &&
                !day.isToday &&
                (!day.loginTime || !day.logoutTime)
              ) {
                return (
                  <div key={day.date}>
                    {/* Desktop View */}
                    <div className="hidden md:grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl bg-yellow-50/50 text-gray-400">
                      <div className="font-bold text-yellow-500 pl-2">
                        {day.formattedDate}
                      </div>
                      <div className="text-yellow-500">{day.dayName}</div>
                      <div className="col-span-5 text-center text-yellow-500 text-xs font-medium uppercase tracking-widest bg-yellow-50/50 py-2 rounded-lg border border-yellow-100/50">
                        Not Updated
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="flex md:hidden flex-col p-4 rounded-xl bg-yellow-50/50 text-gray-400 border border-yellow-100/50">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-yellow-500">
                          {day.formattedDate}
                        </div>
                        <div className="text-yellow-500">{day.dayName}</div>
                      </div>
                      <div className="text-center text-yellow-500 text-xs font-medium uppercase tracking-widest bg-yellow-50/50 py-2 rounded-lg border border-yellow-100/50">
                        Not Updated
                      </div>
                    </div>
                  </div>
                );
              }

              // Future Row
              if (day.isFuture) {
                return (
                  <div key={day.date}>
                    {/* Desktop View */}
                    <div className="hidden md:grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl text-gray-300 opacity-100 border border-gray-100">
                      <div className="font-bold pl-2">{day.formattedDate}</div>
                      <div className="">{day.dayName}</div>
                      <div className="text-center">--</div>
                      <div className="text-center">--:--</div>
                      <div className="text-center">--:--</div>
                      <div className="text-center">--:--</div>
                      <div className="text-center">
                        <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          Upcoming
                        </span>
                      </div>
                    </div>
                    {/* Mobile View */}
                    <div className="flex md:hidden flex-col p-4 rounded-xl border border-gray-100 text-gray-300">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-gray-400">
                          {day.formattedDate}
                        </div>
                        <div className="text-gray-400">{day.dayName}</div>
                      </div>
                      <div className="text-center mt-2">
                        <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          Upcoming
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Read-Only Data Row
              // Highlight Current Day
              const rowBg = day.isToday
                ? "bg-[#F4F7FE] border border-dashed border-[#00A3C4]"
                : "border border-gray-100 hover:bg-gray-50";
              const dateColor = day.isToday
                ? "text-[#00A3C4]"
                : "text-[#2B3674]";

              return (
                <div key={day.date}>
                  {/* Desktop View */}
                  <div
                    className={`hidden md:grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl transition-all ${rowBg}`}
                  >
                    {/* Date & Day */}
                    <div className={`font-bold pl-2 ${dateColor}`}>
                      {day.formattedDate}
                    </div>
                    <div
                      className={`${
                        day.isToday
                          ? "font-bold text-[#00A3C4]"
                          : "text-[#2B3674]"
                      }`}
                    >
                      {day.isToday ? "Today" : day.dayName}
                    </div>

                    {/* Attendance Type (Read Only) */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex items-center gap-1.5 opacity-80">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            day.attendanceType === "login"
                              ? "bg-[#00A3C4]"
                              : "border border-gray-300"
                          }`}
                        ></div>
                        <span
                          className={`text-xs ${
                            day.attendanceType === "login"
                              ? "text-[#00A3C4] font-bold"
                              : "text-gray-400"
                          }`}
                        >
                          In
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-80">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            day.attendanceType === "logout"
                              ? "bg-[#0F6F8C]"
                              : "border border-gray-300"
                          }`}
                        ></div>
                        <span
                          className={`text-xs ${
                            day.attendanceType === "logout"
                              ? "text-[#197c9a] font-bold"
                              : "text-gray-400"
                          }`}
                        >
                          Out
                        </span>
                      </div>
                    </div>

                    {/* Login Time */}
                    <div className="flex justify-center">
                      <div
                        className={`font-medium text-[#2B3674] flex items-center gap-2 ${
                          !day.loginTime && "opacity-30"
                        }`}
                      >
                        {day.loginTime || "--:--"}{" "}
                        <Clock size={12} className="text-gray-400" />
                      </div>
                    </div>

                    {/* Logout Time */}
                    <div className="flex justify-center">
                      <div
                        className={`font-medium text-[#2B3674] flex items-center gap-2 ${
                          !day.logoutTime && "opacity-30"
                        }`}
                      >
                        {day.logoutTime || "--:--"}{" "}
                        <Clock size={12} className="text-gray-400" />
                      </div>
                    </div>

                    {/* Total Hours */}
                    <div className="flex justify-center font-bold text-[#2B3674]">
                      {calculateTotal(day.loginTime, day.logoutTime)}
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-center w-full">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                                            ${
                                              day.status === "Full Day"
                                                ? "bg-[#01B574] text-white shadow-[0_2px_10px_-2px_rgba(1,181,116,0.4)]"
                                                : day.status === "Leave"
                                                ? "bg-[#EE5D50] text-white shadow-[0_2px_10px_-2px_rgba(238,93,80,0.4)]"
                                                : day.status === "Half Day"
                                                ? "bg-[#FFB547] text-white shadow-[0_2px_10px_-2px_rgba(255,181,71,0.4)]"
                                                : "text-gray-400"
                                            }
                                        `}
                      >
                        {day.status}
                      </span>
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div
                    className={`flex md:hidden flex-col p-4 rounded-xl transition-all ${rowBg}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`font-bold text-lg ${dateColor}`}>
                          {day.formattedDate}
                        </div>
                        <div
                          className={`text-sm ${
                            day.isToday
                              ? "font-bold text-[#00A3C4]"
                              : "text-[#2B3674]"
                          }`}
                        >
                          {day.isToday ? "Today" : day.dayName}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
                                            ${
                                              day.status === "Full Day"
                                                ? "bg-[#01B574] text-white shadow-[0_2px_10px_-2px_rgba(1,181,116,0.4)]"
                                                : day.status === "Leave"
                                                ? "bg-[#EE5D50] text-white shadow-[0_2px_10px_-2px_rgba(238,93,80,0.4)]"
                                                : day.status === "Half Day"
                                                ? "bg-[#FFB547] text-white shadow-[0_2px_10px_-2px_rgba(255,181,71,0.4)]"
                                                : "text-gray-400"
                                            }
                                        `}
                      >
                        {day.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm bg-white/50 p-2 rounded-lg">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                          In
                        </span>
                        <div className="font-medium text-[#2B3674]">
                          {day.loginTime || "--:--"}
                        </div>
                      </div>
                      <div className="flex flex-col items-center border-l border-gray-100">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                          Out
                        </span>
                        <div className="font-medium text-[#2B3674]">
                          {day.logoutTime || "--:--"}
                        </div>
                      </div>
                      <div className="flex flex-col items-center border-l border-gray-100">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                          Total
                        </span>
                        <div className="font-bold text-[#2B3674]">
                          {calculateTotal(day.loginTime, day.logoutTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-[#2B3674] mb-4">
              Download Timesheet
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] outline-none"
                />
              </div>

              <button
                onClick={handleDownloadPDF}
                className="w-full py-2.5 bg-[#00A3C4] text-white font-bold rounded-lg hover:bg-[#0093b1] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Download size={18} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTimesheetView;
