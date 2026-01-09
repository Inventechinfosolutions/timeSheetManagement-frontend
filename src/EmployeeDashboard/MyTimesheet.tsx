import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { TimesheetEntry } from "../types";
import { MobileTimesheetCard } from "./mobileView";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  fetchMonthlyAttendance,
  submitLogin,
  submitLogout,
  updateAttendanceRecord,
  AttendanceStatus,
} from "../reducers/employeeAttendance.reducer";
import {
  generateMonthlyEntries,
  mapStatus,
  calculateTotal,
  formatTo12H,
} from "../utils/attendanceUtils";

interface Props {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  mapValToLabel?: (val: string) => string;
  triggerClassName?: string;
}

export const CustomDropdown = ({
  value,
  options,
  onChange,
  mapValToLabel,
  triggerClassName,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const displayValue = mapValToLabel ? mapValToLabel(value) : value;

  const defaultThemeClasses =
    "bg-white border-gray-200 text-[#2B3674] hover:border-[#00A3C4]";
  const finalTriggerClasses = triggerClassName || defaultThemeClasses;

  // Determine chevron color: if custom trigger has white text, use white chevron, else gray
  const chevronClass = finalTriggerClasses.includes("text-white")
    ? "text-white/80"
    : "text-gray-400";

  return (
    <div
      className="relative w-full min-w-[100px]"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div
        className={`border rounded-lg px-3 py-1.5 text-[13px] font-bold shadow-sm flex items-center justify-between cursor-pointer transition-colors ${finalTriggerClasses}`}
      >
        <span className="capitalize">{displayValue}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${chevronClass}`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className="px-3 py-2 text-[13px] font-medium text-gray-600 hover:bg-[#F4F7FE] hover:text-[#00A3C4] cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg capitalize"
            >
              {mapValToLabel ? mapValToLabel(option) : option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface TimeProps {
  value: string;
  onChange: (value: string) => void;
  dashed?: boolean;
  disabled?: boolean;
}

export const CustomTimePicker = ({
  value,
  onChange,
  dashed,
  disabled,
}: TimeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse hours and minutes from value or default
  const [currentHours, setCurrentHours] = useState(
    value ? value.split(":")[0] : "--"
  );
  const [currentMinutes, setCurrentMinutes] = useState(
    value ? value.split(":")[1] : "--"
  );

  // Update internal state when the prop 'value' changes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setCurrentHours(h);
      setCurrentMinutes(m);
    } else {
      setCurrentHours("--");
      setCurrentMinutes("--");
    }
  }, [value]);

  // Generate arrays for HH and MM
  const hourOptions = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minuteOptions = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const handleTimeChange = (type: "hour" | "minute", val: string) => {
    let newH = currentHours;
    let newM = currentMinutes;

    if (type === "hour") {
      newH = val;
      setCurrentHours(val);
      if (newM === "--") {
        newM = "00";
        setCurrentMinutes("00");
      } // Default minute if not set
    }
    if (type === "minute") {
      newM = val;
      setCurrentMinutes(val);
      if (newH === "--") {
        newH = "09";
        setCurrentHours("09");
      } // Default hour if not set
    }

    if (newH !== "--" && newM !== "--") {
      onChange(`${newH}:${newM}`);
    } else {
      onChange("");
    }
  };

  if (disabled) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2 text-xs font-bold text-gray-400 flex items-center justify-between cursor-not-allowed opacity-70">
        <span>{value || "--:--"}</span>
        <Clock size={14} className="text-gray-300" />
      </div>
    );
  }

  return (
    <div
      className="relative w-[100px]"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

      <div
        className={`bg-white border ${
          dashed ? "border-dashed border-gray-300" : "border-gray-200"
        } rounded-2xl px-3 py-2 text-xs font-bold text-[#2B3674] shadow-sm flex items-center justify-between cursor-pointer hover:border-[#00A3C4] transition-colors`}
      >
        <span>{value || "--:--"}</span>
        <Clock size={14} className="text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 flex gap-1 h-48 w-32 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="text-[10px] text-center font-bold text-gray-400 mb-1 sticky top-0 bg-white">
              HH
            </div>
            {hourOptions.map((h) => (
              <div
                key={h}
                onClick={() => handleTimeChange("hour", h)}
                className={`text-center py-1 text-xs rounded cursor-pointer hover:bg-gray-100 ${
                  currentHours === h
                    ? "bg-[#00A3C4] text-white hover:bg-[#00A3C4]"
                    : "text-gray-600"
                }`}
              >
                {h}
              </div>
            ))}
          </div>
          <div className="w-px bg-gray-100 h-full"></div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="text-[10px] text-center font-bold text-gray-400 mb-1 sticky top-0 bg-white">
              MM
            </div>
            {minuteOptions.map((m) => (
              <div
                key={m}
                onClick={() => handleTimeChange("minute", m)}
                className={`text-center py-1 text-xs rounded cursor-pointer hover:bg-gray-100 ${
                  currentMinutes === m
                    ? "bg-[#00A3C4] text-white hover:bg-[#00A3C4]"
                    : "text-gray-600"
                }`}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MyTimesheet = () => {
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [now] = useState(new Date());
  const [scrollToDate, setScrollToDate] = useState<number | null>(null);

  // Redux
  const dispatch = useAppDispatch();
  const { records } = useAppSelector((state) => state.attendance);
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const currentEmployeeId = entity?.employeeId || "EMP001";

  const [entries, setEntries] = useState<TimesheetEntry[]>([]);

  // Base records mapping for current month
  const baseEntries = useMemo(() => {
    const generatedEntries = generateMonthlyEntries(now, now, records);
    return generatedEntries.map((e) => {
      const loginClean =
        e.loginTime?.includes("NaN") || e.loginTime === "00:00:00"
          ? ""
          : e.loginTime || "";
      const logoutClean =
        e.logoutTime?.includes("NaN") || e.logoutTime === "00:00:00"
          ? ""
          : e.logoutTime || "";
      return {
        ...e,
        loginTime: loginClean,
        logoutTime: logoutClean,
        isSaved: e.isSaved && !!loginClean,
        isSavedLogout: e.isSavedLogout && !!logoutClean,
      };
    });
  }, [now, records]);

  useEffect(() => {
    setEntries(baseEntries);
  }, [baseEntries]);

  // Data Fetching
  const fetchAttendance = useCallback(
    (date: Date) => {
      dispatch(
        fetchMonthlyAttendance({
          employeeId: currentEmployeeId,
          month: (date.getMonth() + 1).toString(),
          year: date.getFullYear().toString(),
        })
      );
    },
    [dispatch, currentEmployeeId]
  );

  useEffect(() => {
    fetchAttendance(now);
  }, [fetchAttendance, now]);

  // Handlers
  const handleUpdateEntry = (
    index: number,
    field: keyof TimesheetEntry,
    value: any
  ) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const handleSave = async (index: number) => {
    const entry = entries[index];
    const { loginTime, logoutTime, location } = entry;
    const d = entry.fullDate;
    const workingDate = `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;

    const formattedLogin = formatTo12H(loginTime);
    const formattedLogout = formatTo12H(logoutTime);

    const locationMap: Record<string, string> = {
      Office: "Office",
      WFH: "Work from Home",
      "Client Visit": "Client Place",
    };
    const backendLocation = locationMap[location || "Office"] || "Office";

    try {
      const existingRecord = records.find((r) => {
        const rDate =
          typeof r.workingDate === "string"
            ? r.workingDate.split("T")[0]
            : (r.workingDate as Date).toISOString().split("T")[0];
        return rDate === workingDate;
      });

      let recordId = existingRecord?.id;

      if (formattedLogout && logoutTime && logoutTime !== "--:--") {
        const result = await dispatch(
          submitLogout({
            employeeId: currentEmployeeId,
            workingDate,
            logoutTime: formattedLogout,
          })
        ).unwrap();
        if (result?.id) recordId = result.id;
      } else if (formattedLogin && !existingRecord) {
        const result = await dispatch(
          submitLogin({
            employeeId: currentEmployeeId,
            workingDate,
            loginTime: formattedLogin,
          })
        ).unwrap();
        if (result?.id) recordId = result.id;
      }

      if (recordId) {
        const calculatedStatus = mapStatus(
          existingRecord?.status as AttendanceStatus | undefined,
          formattedLogin,
          formattedLogout,
          entry.isFuture,
          entry.isToday,
          entry.isWeekend
        );

        await dispatch(
          updateAttendanceRecord({
            id: recordId,
            data: {
              location: backendLocation as any,
              status: calculatedStatus as any,
              ...(formattedLogin && { loginTime: formattedLogin }),
              ...(formattedLogout &&
                logoutTime &&
                logoutTime !== "--:--" && { logoutTime: formattedLogout }),
            },
          })
        ).unwrap();
      }

      fetchAttendance(now);
    } catch (error: any) {
      console.error("Failed to save attendance:", error);
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolled = useRef(false);

  useEffect(() => {
    if (entries.length > 0 && scrollContainerRef.current) {
      // Priority 1: Scroll to specific date from Calendar (External Navigation) - Placeholder for now
      if (scrollToDate !== null) {
        const targetIndex = entries.findIndex((e) => e.date === scrollToDate);
        if (targetIndex !== -1) {
          const targetElement = document.getElementById(`row-${targetIndex}`);
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            setHighlightedRow(targetIndex);
            setTimeout(() => setHighlightedRow(null), 2000);
            setScrollToDate(null);
          }
        }
      }
      // Priority 2: Default scroll to Today on initial load ONLY
      else if (!hasInitialScrolled.current) {
        const todayIndex = entries.findIndex((e) => e.isToday);
        if (todayIndex !== -1) {
          const targetIndex = Math.max(0, todayIndex - 1);
          const targetElement = document.getElementById(`row-${targetIndex}`);
          if (targetElement) {
            const container = scrollContainerRef.current;
            container.scrollTop = targetElement.offsetTop - container.offsetTop;
            hasInitialScrolled.current = true;
          }
        } else {
          hasInitialScrolled.current = true;
        }
      }
    }
  }, [entries, scrollToDate]);

  return (
    <div className="flex flex-col h-full bg-[#F4F7FE] overflow-hidden">
      <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
      {/* Header */}
      <header className="bg-white/50 backdrop-blur-sm sticky top-0 z-20 px-8 py-3 flex items-center justify-between border-b border-gray-100">
        <h2 className="text-xl font-bold text-[#2B3674]">My Timesheet</h2>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-500 bg-white px-6 py-1.5 rounded-full shadow-sm border border-gray-100">
          <span className="min-w-[120px] text-center">
            {now.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </header>

      <div className="p-8">
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 overflow-x-hidden">
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 h-[500px] overflow-y-auto no-scrollbar pb-10">
            {entries.map((day, index) => (
              <MobileTimesheetCard
                key={day.date}
                day={day}
                index={index}
                isEditable={
                  (day.isToday && !day.isSavedLogout) || day.isEditing
                }
                handleUpdateEntry={handleUpdateEntry}
                handleSave={handleSave}
                calculateTotal={calculateTotal}
                CustomDropdown={CustomDropdown}
                CustomTimePicker={CustomTimePicker}
                highlightedRow={highlightedRow}
              />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-hidden">
            {/* Table Header - Adjusted Gaps & Columns */}
            <div className="grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_1.8fr] gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-4 text-center items-center">
              <div className="text-left pl-4">Date</div>
              <div className="text-left">Day</div>
              <div className="">Location</div>
              <div className="">Login</div>
              <div className="">Logout</div>
              <div className="">Total Hours</div>
              <div className="">Status</div>
            </div>

            {/* Table Rows - Scrollable Container showing ~5 rows */}
            <div
              ref={scrollContainerRef}
              className="space-y-4 h-[380px] overflow-y-auto no-scrollbar pb-2"
            >
              {entries.map((day, index) => {
                // Weekend Row (Only show placeholder if no data)
                if (day.isWeekend && !day.loginTime) {
                  return (
                    <div
                      id={`row-${index}`}
                      key={day.date}
                      className={`grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_1.8fr] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl transition-all duration-500
                                                ${
                                                  highlightedRow === index
                                                    ? "bg-blue-100 ring-2 ring-blue-400 scale-[1.02] z-20 shadow-lg"
                                                    : "bg-red-50/50 text-gray-400 opacity-60"
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
                      id={`row-${index}`}
                      key={day.date}
                      className={`grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_1.8fr] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl transition-all duration-500
                                                ${
                                                  highlightedRow === index
                                                    ? "bg-blue-100 ring-2 ring-blue-400 scale-[1.02] z-20 shadow-lg"
                                                    : "text-gray-300 opacity-60 border border-gray-100"
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

                // Today Or Editing Row
                const isEditable =
                  (day.isToday && !day.isSavedLogout) || day.isEditing;
                const isCompleted = day.isSavedLogout;
                const rowBg = day.isToday
                  ? "bg-[#F4F7FE] border border-dashed border-[#00A3C4]"
                  : "border border-gray-100 hover:bg-gray-50";
                const dateColor = day.isToday
                  ? "text-[#00A3C4]"
                  : "text-[#2B3674]";

                return (
                  <div
                    id={`row-${index}`}
                    key={day.date}
                    className={`grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_1.8fr] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl transition-all duration-500
                                            ${
                                              highlightedRow === index
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

                    {/* Location Dropdown */}
                    <div className="flex justify-center">
                      {isEditable && !isCompleted ? (
                        <CustomDropdown
                          value={day.location || "Office"}
                          options={["Office", "WFH", "Client Visit"]}
                          onChange={(val) =>
                            handleUpdateEntry(index, "location", val)
                          }
                          triggerClassName="bg-white border-gray-200 text-[#2B3674] hover:border-[#00A3C4] min-w-[120px]"
                        />
                      ) : (
                        <div className="text-[#2B3674] font-medium text-[13px]">
                          {day.location || "--"}
                        </div>
                      )}
                    </div>

                    {/* Login Time */}
                    <div className="flex justify-center">
                      {isEditable && !day.isSaved ? (
                        <CustomTimePicker
                          value={day.loginTime}
                          onChange={(val) =>
                            handleUpdateEntry(index, "loginTime", val)
                          }
                          dashed={true}
                        />
                      ) : (
                        <div
                          className={`font-medium text-[#2B3674] flex items-center gap-2 ${
                            !day.loginTime && "opacity-30"
                          }`}
                        >
                          {day.loginTime || "--:--"}{" "}
                          <Clock size={12} className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Logout Time */}
                    <div className="flex justify-center">
                      {isEditable ? (
                        <CustomTimePicker
                          value={day.logoutTime}
                          onChange={(val) =>
                            handleUpdateEntry(index, "logoutTime", val)
                          }
                          dashed={true}
                          disabled={day.isToday && now.getHours() < 11}
                        />
                      ) : (
                        <div
                          className={`font-medium text-[#2B3674] flex items-center gap-2 ${
                            !day.logoutTime && "opacity-30"
                          }`}
                        >
                          {day.logoutTime || "--:--"}{" "}
                          <Clock size={12} className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Total Hours */}
                    <div className="flex justify-center font-bold text-[#2B3674]">
                      {calculateTotal(day.loginTime, day.logoutTime)}
                    </div>

                    {/* Status Column with Integrated Save for Today */}
                    <div className="flex items-center justify-center gap-4 w-full px-2 min-h-[40px]">
                      <div className="flex justify-center">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider min-w-[100px] text-center
                                                        ${
                                                          day.status ===
                                                          "Full Day"
                                                            ? "bg-[#01B574] text-white shadow-[0_2px_10px_-2px_rgba(1,181,116,0.4)]"
                                                            : day.status ===
                                                              "WFH"
                                                            ? "bg-[#A3AED0] text-white shadow-[0_2px_8px_-1px_rgba(163,174,208,0.3)]"
                                                            : day.status ===
                                                              "Leave"
                                                            ? "bg-[#EE5D50] text-white shadow-[0_2px_10px_-2px_rgba(238,93,80,0.4)]"
                                                            : day.status ===
                                                              "Half Day"
                                                            ? "bg-[#FFB547] text-white shadow-[0_2px_10px_-2px_rgba(255,181,71,0.4)]"
                                                            : day.status ===
                                                              "Client Visit"
                                                            ? "bg-[#6366F1] text-white shadow-[0_2px_8px_-1px_rgba(99,102,241,0.25)]"
                                                            : day.status ===
                                                              "Not Updated"
                                                            ? "bg-[#FFF9E5] text-[#FFB020] border border-amber-200"
                                                            : day.status ===
                                                                "Pending" ||
                                                              (!day.isFuture &&
                                                                day.loginTime &&
                                                                !day.logoutTime)
                                                            ? "bg-[#F6AD55] text-white shadow-[0_2px_10px_-2px_rgba(246,173,85,0.4)]"
                                                            : "text-gray-400"
                                                        }
                                                    `}
                        >
                          {day.status}
                        </span>
                      </div>

                      {day.isToday && (!day.isSavedLogout || day.isEditing) && (
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (
                                !day.loginTime ||
                                day.loginTime === "--:--" ||
                                day.loginTime.includes("--")
                              ) {
                                alert("Please fill Login time.");
                                return;
                              }
                              if (
                                day.isSaved &&
                                (!day.logoutTime ||
                                  day.logoutTime === "--:--" ||
                                  day.logoutTime.includes("--"))
                              ) {
                                alert("Please fill Logout time to update.");
                                return;
                              }
                              handleSave(index);
                            }}
                            className="px-4 py-1.5 rounded-lg text-[11px] font-bold shadow-md transition-all transform active:scale-95 bg-[#00A3C4] text-white hover:bg-[#0093b1] shadow-teal-100"
                          >
                            {day.isEditing
                              ? "Done"
                              : day.isSaved
                              ? "Update"
                              : "Save"}
                          </button>
                        </div>
                      )}
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

export default MyTimesheet;
