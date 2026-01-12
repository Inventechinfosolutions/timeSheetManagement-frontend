import { Calendar, Clock, Save } from "lucide-react";
import { TimesheetEntry } from "../types";

interface MobileTimesheetCardProps {
  day: TimesheetEntry;
  index: number;
  isEditable?: boolean;
  handleUpdateEntry?: (
    index: number,
    field: keyof TimesheetEntry,
    value: any
  ) => void;
  handleSave?: (index: number) => void;
  calculateTotal: (
    login: string | null | undefined,
    logout: string | null | undefined
  ) => string;
  CustomDropdown?: any;
  CustomTimePicker?: any;
  highlightedRow?: number | null;
  containerId?: string;
}

export const MobileTimesheetCard = ({
  day,
  index,
  isEditable,
  handleUpdateEntry,
  handleSave,
  calculateTotal,
  CustomDropdown,
  CustomTimePicker,
  highlightedRow,
  containerId,
}: MobileTimesheetCardProps) => {
  const isHighlighted = highlightedRow === index;
  const scrollId = containerId || `mobile-row-${index}`;

  if (day.isWeekend && !day.loginTime) {
    return (
      <div
        id={scrollId}
        className={`bg-red-50/30 border border-red-100 rounded-2xl p-4 transition-all duration-500 ${
          isHighlighted ? "ring-2 ring-blue-400 scale-[1.02] shadow-lg" : ""
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
              <Calendar size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-red-400">
                {day.formattedDate}
              </div>
              <div className="text-[10px] font-medium text-red-300">
                {day.dayName}
              </div>
            </div>
          </div>
          <span className="px-3 py-1 bg-red-100/50 text-red-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
            Weekend
          </span>
        </div>
      </div>
    );
  }

  if (day.isFuture) {
    return (
      <div
        id={scrollId}
        className={`bg-white border border-gray-100 rounded-2xl p-4 opacity-60 transition-all duration-500 ${
          isHighlighted ? "ring-2 ring-blue-400 scale-[1.02] shadow-lg" : ""
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
              <Calendar size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400">
                {day.formattedDate}
              </div>
              <div className="text-[10px] font-medium text-gray-300">
                {day.dayName}
              </div>
            </div>
          </div>
          <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
            Upcoming
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={scrollId}
      className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm transition-all duration-500 ${
        day.isToday ? "border-dashed border-[#00A3C4] bg-[#F4F7FE]" : ""
      } ${isHighlighted ? "ring-2 ring-blue-400 scale-[1.02] shadow-lg" : ""}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              day.isToday ? "bg-teal-50 text-[#00A3C4]" : "bg-gray-50 text-gray-400"
            }`}
          >
            <Calendar size={20} />
          </div>
          <div>
            <div
              className={`text-sm font-bold ${
                day.isToday ? "text-[#00A3C4]" : "text-[#2B3674]"
              }`}
            >
              {day.formattedDate}
            </div>
            <div className="text-xs font-medium text-gray-400">
              {day.isToday ? "Today" : day.dayName}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
                        ${
                          day.status === "Full Day"
                            ? "bg-[#01B574] text-white"
                            : day.status === "WFH"
                            ? "bg-[#A3AED0] text-white"
                            : day.status === "Leave"
                            ? "bg-[#EE5D50] text-white"
                            : day.status === "Half Day"
                            ? "bg-[#FFB547] text-white"
                            : day.status === "Client Visit"
                            ? "bg-[#6366F1] text-white"
                            : day.status === "Pending" ||
                              (!day.isFuture && day.loginTime && !day.logoutTime)
                            ? "bg-[#F6AD55] text-white"
                            : "text-gray-400"
                        }
                    `}
          >
            {day.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Login
          </p>
          {isEditable && !day.isSaved && CustomTimePicker ? (
            <CustomTimePicker
              value={day.loginTime}
              onChange={(val: any) =>
                handleUpdateEntry && handleUpdateEntry(index, "loginTime", val)
              }
              dashed
            />
          ) : (
            <div className="flex items-center gap-2 text-sm font-bold text-[#2B3674]">
              {day.loginTime || "--:--"} <Clock size={12} className="text-gray-400" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Logout
          </p>
          {isEditable && CustomTimePicker ? (
            <CustomTimePicker
              value={day.logoutTime}
              onChange={(val: any) =>
                handleUpdateEntry && handleUpdateEntry(index, "logoutTime", val)
              }
              dashed
            />
          ) : (
            <div className="flex items-center gap-2 text-sm font-bold text-[#2B3674]">
              {day.logoutTime || "--:--"} <Clock size={12} className="text-gray-400" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Location
          </p>
          {isEditable && !day.isSavedLogout && CustomDropdown ? (
            <CustomDropdown
              value={day.location || "Office"}
              options={["Office", "WFH", "Client Visit"]}
              onChange={(val: any) =>
                handleUpdateEntry && handleUpdateEntry(index, "location", val)
              }
            />
          ) : (
            <p className="text-sm font-bold text-[#2B3674]">
              {day.location || "--"}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Total Hours
          </p>
          <p className="text-sm font-bold text-[#2B3674]">
            {calculateTotal(day.loginTime, day.logoutTime)}
          </p>
        </div>
      </div>

      {isEditable && (!day.isSavedLogout || day.isEditing) && (
        <button
          onClick={() => {
            if (!day.loginTime || day.loginTime === "--:--" || day.loginTime.includes("--")) {
              alert("Please fill Login time.");
              return;
            }
            if (day.isSaved && (!day.logoutTime || day.logoutTime === "--:--" || day.logoutTime.includes("--"))) {
              alert("Please fill Logout time to update.");
              return;
            }
            handleSave && handleSave(index);
          }}
          className="w-full py-3 bg-[#00A3C4] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-100"
        >
          <Save size={18} />
          {day.isEditing ? "Complete" : day.isSaved ? "Update" : "Save Record"}
        </button>
      )}
    </div>
  );
};
