import { useState, useEffect } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import { TimesheetEntry } from "../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { MobileTimesheetCard } from "./mobileView";

interface FullTimesheetProps {
  entries: TimesheetEntry[];
  calculateTotal: (login: string, logout: string) => string;
  displayDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  scrollToDate: number | null;
  setScrollToDate: (date: number | null) => void;
}

const FullTimesheet = ({
  entries,
  calculateTotal,
  displayDate,
  onPrevMonth,
  onNextMonth,
  scrollToDate,
  setScrollToDate,
}: FullTimesheetProps) => {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  useEffect(() => {
    if (entries.length > 0 && scrollToDate !== null) {
      const targetIndex = entries.findIndex((e) => e.date === scrollToDate);
      if (targetIndex !== -1) {
        // Determine screen type to pick the right ID
        const isMobile = window.innerWidth < 1024; // Align with tailwind 'md' or 'lg'
        const targetId = isMobile
          ? `mobile-full-row-${targetIndex}`
          : `full-row-${scrollToDate}`;
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
          setHighlightedRow(scrollToDate);
          // Longer highlight for a more "wow" effect on mobile
          setTimeout(() => setHighlightedRow(null), 3000);
          setScrollToDate(null);
        } else {
          // Fallback to whichever exists if primary is missing
          const fallbackElement =
            document.getElementById(`full-row-${scrollToDate}`) ||
            document.getElementById(`mobile-full-row-${targetIndex}`);
          if (fallbackElement) {
            fallbackElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            setHighlightedRow(scrollToDate);
            setTimeout(() => setHighlightedRow(null), 3000);
            setScrollToDate(null);
          }
        }
      }
    }
  }, [entries, scrollToDate, setScrollToDate]);

  // Default dates: First and Last day of the current display month
  const firstDay = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth(),
    1
  );
  const lastDay = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth() + 1,
    0
  );

  // Format for input: yyyy-mm-dd
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const todayStr = formatDateForInput(new Date());

  const [startDate, setStartDate] = useState(formatDateForInput(firstDay));
  const [endDate, setEndDate] = useState(
    formatDateForInput(lastDay) > todayStr
      ? todayStr
      : formatDateForInput(lastDay)
  );

  const handleDownload = () => {
    const doc = new jsPDF();

    // Employee Info (Mocking based on USER request for EMP ID)
    const employeeInfo = {
      name: "Natashia Khaleira",
      id: "EMP-2024-001",
      department: "Engineering",
      designation: "Senior Developer",
    };

    // Header
    doc.setFillColor(43, 54, 116); // #2B3674
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("INVENTECH", 20, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Info Solutions Pvt. Ltd.", 20, 26);

    doc.setFontSize(16);
    doc.text("TIMESHEET REPORT", 140, 25);

    // Employee Details Section
    doc.setTextColor(43, 54, 116);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE DETAILS", 20, 50);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 53, 190, 53);

    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${employeeInfo.name}`, 20, 60);
    doc.text(`Employee ID: ${employeeInfo.id}`, 20, 67);
    doc.text(`Department: ${employeeInfo.department}`, 120, 60);
    doc.text(`Designation: ${employeeInfo.designation}`, 120, 67);

    doc.setFont("helvetica", "bold");
    doc.text(`Period: ${startDate} to ${endDate}`, 20, 77);

    // Generate data for the selected range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const reportData: any[] = [];

    // Simple helper to generate entries for PDF range
    const tempDate = new Date(start);
    while (tempDate <= end) {
      const isWeekend = tempDate.getDay() === 0 || tempDate.getDay() === 6;
      const dateStr = tempDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const dayName = tempDate.toLocaleDateString("en-US", { weekday: "long" });

      if (isWeekend) {
        reportData.push([
          dateStr,
          dayName,
          "---",
          "---",
          "---",
          "---",
          "WEEKEND",
        ]);
      } else {
        // Mocking data for past days in range for the PDF
        const login = "09:00";
        const logout = "18:00";
        const status = "PRESENT";
        reportData.push([
          dateStr,
          dayName,
          "Office",
          login,
          logout,
          calculateTotal(login, logout),
          status,
        ]);
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Table
    autoTable(doc, {
      startY: 85,
      head: [
        ["Date", "Day", "Location", "Login", "Logout", "Total Hours", "Status"],
      ],
      body: reportData,
      headStyles: {
        fillColor: [43, 54, 116],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [244, 247, 254] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        6: { fontStyle: "bold" }, // Status column
      },
    });

    // Save
    const fileName = `Timesheet_${employeeInfo.id}_${employeeInfo.name.replace(
      /\s+/g,
      "_"
    )}.pdf`;
    doc.save(fileName);
    setIsDownloadModalOpen(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F4F7FE]">
      {/* Download Modal */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#2B3674]/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsDownloadModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-[#2B3674]">
                Download Timesheet
              </h3>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <style>{`
                                    input[type="date"]::-webkit-calendar-picker-indicator {
                                        background: transparent;
                                        bottom: 0;
                                        color: transparent;
                                        cursor: pointer;
                                        height: auto;
                                        left: 0;
                                        position: absolute;
                                        right: 0;
                                        top: 0;
                                        width: auto;
                                    }
                                `}</style>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Start Date
                </label>
                <div className="relative group">
                  <input
                    type="date"
                    value={startDate}
                    max={todayStr}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[#2B3674] font-medium outline-none focus:border-[#00A3C4] focus:ring-2 focus:ring-teal-50 transition-all appearance-none"
                  />
                  <CalendarIcon
                    size={20}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00A3C4] pointer-events-none transition-transform group-focus-within:scale-110"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  End Date
                </label>
                <div className="relative group">
                  <input
                    type="date"
                    value={endDate}
                    max={todayStr}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[#2B3674] font-medium outline-none focus:border-[#00A3C4] focus:ring-2 focus:ring-teal-50 transition-all appearance-none"
                  />
                  <CalendarIcon
                    size={20}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00A3C4] pointer-events-none transition-transform group-focus-within:scale-110"
                  />
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full bg-[#00A3C4] hover:bg-[#0093b1] text-white rounded-xl py-4 font-bold shadow-lg shadow-teal-100 flex items-center justify-center gap-3 transition-all transform active:scale-95 mt-4"
              >
                <Download size={20} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Refined Header area - Mobile Responsive */}
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8 py-4 md:py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-[#2B3674] tracking-tight text-center md:text-left">
          Full Timesheet
        </h2>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex items-center justify-between md:justify-start gap-4 text-sm font-bold text-[#2B3674] bg-white px-4 py-2 md:py-1.5 rounded-xl md:rounded-lg shadow-sm border border-gray-100/50">
            <button
              onClick={onPrevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-[#00A3C4] active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="min-w-[120px] md:min-w-[140px] text-center font-bold tracking-wide">
              {displayDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={onNextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-[#00A3C4] active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <button
            title="Download Timesheet"
            onClick={() => setIsDownloadModalOpen(true)}
            className="p-2.5 md:p-2 bg-white border border-gray-100 rounded-xl md:rounded-lg text-[#00A3C4] shadow-sm hover:bg-[#00A3C4] hover:text-white hover:border-[#00A3C4] hover:-translate-y-0.5 transition-all transform active:scale-95 group relative"
          >
            <Download size={20} />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A3C4] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00A3C4] border border-white group-hover:bg-white transition-colors duration-200 shadow-sm"></span>
            </span>
          </button>
        </div>
      </header>

      <div className="p-4 md:p-8">
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {entries.map((day, index) => (
              <MobileTimesheetCard
                key={day.date}
                day={day}
                index={index}
                isEditable={false}
                calculateTotal={calculateTotal}
                highlightedRow={highlightedRow === day.date ? index : null}
                // Custom ID for Full Timesheet mobile cards to avoid conflicts with My Timesheet
                containerId={`mobile-full-row-${index}`}
              />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            {/* Table Header - Removed Action Column */}
            <div className="grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-4 text-center items-center">
              <div className="text-left pl-4">Date</div>
              <div className="text-left">Day</div>
              <div className="">Location</div>
              <div className="">Login</div>
              <div className="">Logout</div>
              <div className="">Total Hours</div>
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
                    <div
                      key={day.date}
                      id={`full-row-${day.date}`}
                      className={`grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl transition-all duration-500
                                                ${
                                                  highlightedRow === day.date
                                                    ? "bg-blue-100 ring-2 ring-blue-400 scale-[1.02] z-20 shadow-lg"
                                                    : "bg-red-50/50 text-gray-400"
                                                }`}
                    >
                      <div className="font-bold text-red-300 pl-2">
                        {day.formattedDate}
                      </div>
                      <div className="text-red-300">{day.dayName}</div>
                      <div className="col-span-5 text-center text-red-200 text-xs font-medium uppercase tracking-widest bg-red-50/50 py-2 rounded-lg border border-red-100/50">
                        Weekend
                      </div>
                    </div>
                  );
                }

                // Future Row
                if (day.isFuture) {
                  return (
                    <div
                      key={day.date}
                      id={`full-row-${day.date}`}
                      className={`grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl transition-all duration-500
                                                ${
                                                  highlightedRow === day.date
                                                    ? "bg-blue-100 ring-2 ring-blue-400 scale-[1.02] z-20 shadow-lg"
                                                    : "text-gray-300 opacity-100 border border-gray-100"
                                                }`}
                    >
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
                  <div
                    key={day.date}
                    id={`full-row-${day.date}`}
                    className={`grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl transition-all duration-500
                                            ${
                                              highlightedRow === day.date
                                                ? "bg-blue-100 ring-2 ring-blue-400 scale-[1.02] z-20 shadow-lg"
                                                : rowBg
                                            }`}
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

                    {/* Location (Read Only) */}
                    <div className="flex justify-center">
                      <div className="text-[#2B3674] font-medium text-[13px]">
                        {day.location || "--"}
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
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider min-w-[100px] text-center
                                                ${
                                                  day.status === "Present"
                                                    ? "bg-[#01B574] text-white shadow-[0_2px_10px_-2px_rgba(1,181,116,0.4)]"
                                                    : day.status === "WFH"
                                                    ? "bg-[#A3AED0] text-white shadow-[0_2px_8px_-1px_rgba(163,174,208,0.3)]"
                                                    : day.status === "Absent"
                                                    ? "bg-[#EE5D50] text-white shadow-[0_2px_10px_-2px_rgba(238,93,80,0.4)]"
                                                    : day.status === "Half Day"
                                                    ? "bg-[#FFB547] text-white shadow-[0_2px_10px_-2px_rgba(255,181,71,0.4)]"
                                                    : day.status ===
                                                      "Client Visit"
                                                    ? "bg-[#6366F1] text-white shadow-[0_2px_8px_-1px_rgba(99,102,241,0.25)]"
                                                    : day.status ===
                                                        "Pending" ||
                                                      (!day.isFuture &&
                                                        !day.isToday &&
                                                        day.loginTime &&
                                                        !day.logoutTime)
                                                    ? "bg-[#F6AD55] text-white shadow-[0_2px_10px_-2px_rgba(246,173,85,0.4)]"
                                                    : "text-gray-400"
                                                }
                                            `}
                      >
                        {!day.isFuture &&
                        !day.isToday &&
                        day.loginTime &&
                        !day.logoutTime
                          ? "NOT UPDATED"
                          : day.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullTimesheet;
