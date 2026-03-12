import React, { useEffect, useState, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../hooks";
import { Button, Modal, DatePicker, Select, message, ConfigProvider } from "antd";
import dayjs, { Dayjs } from "dayjs";
import axios from "axios";
import {
  submitLeaveRequest,
  getLeaveRequestEmailConfig,
  uploadLeaveRequestFile,
  downloadLeaveRequestFile,
  previewLeaveRequestFile,
  deleteLeaveRequestFile,
  getLeaveRequestFiles,
} from "../reducers/leaveRequest.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import CommonMultipleUploader from "./CommonMultipleUploader";
import { Loader2 } from "lucide-react";
import { InfoCircleOutlined, CheckCircleFilled, ExclamationCircleFilled } from "@ant-design/icons";
import { LeaveRequestType, HalfDayType, AttendanceStatus, WorkLocation, CompOffStatus, Department, EmploymentType } from "../enums";
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRightLeft, 
  X, 
  Inbox, 
  Plus 
} from "lucide-react";

const datePickerTheme = {
  token: {
    borderRadius: 16,
    controlHeight: 48,
    colorBgContainer: "#F4F7FE",
    colorBorder: "transparent",
    colorPrimary: "#4318FF",
  },
  components: { DatePicker: { cellHeight: 28, cellWidth: 28 } },
};

const months = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];
const currentYear = new Date().getFullYear();
const years = ["All", (currentYear - 1).toString(), currentYear.toString(), (currentYear + 1).toString()];

const CompOffDashboard: React.FC = () => {
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const dispatch = useAppDispatch();

  // Authorization Check: Only IT & FULL_TIMER get Comp Off
  const department = entity?.department || (currentUser as any)?.department;
  const employmentType = entity?.employmentType || (currentUser as any)?.employmentType;

  if (department !== Department.IT || employmentType !== EmploymentType.FULL_TIMER) {
    return (
      <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 max-w-md text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <X className="text-red-500 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-[#1B2559] mb-3">Access Restricted</h2>
          <p className="text-[#A3AED0] font-bold text-sm leading-relaxed">
            Comp Off benefits are only available for employees in the <span className="text-blue-600">Information Technology</span> department with <span className="text-blue-600">Full Time</span> status.
          </p>
        </div>
      </div>
    );
  }
  
  const [compOffs, setCompOffs] = useState<any[]>([]);
  const [availableCompOffs, setAvailableCompOffs] = useState<any[]>([]);
  const { holidays = [] } = useAppSelector(
    (state: any) => state.masterHolidays || {},
  );
  
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Pagination
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const itemsPerPage = 10;

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState<string>(HalfDayType.FIRST_HALF);
  const [selectedCompOffDates, setSelectedCompOffDates] = useState<string[]>([]);
  const [emailConfig, setEmailConfig] = useState<{ assignedManagerEmail: string | null; hrEmail: string | null }>({ assignedManagerEmail: null, hrEmail: null });
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccEmailInput, setCcEmailInput] = useState("");
  const [ccEmailError, setCcEmailError] = useState("");
  const [uploadedDocumentKeys, setUploadedDocumentKeys] = useState<string[]>([]);
  const [totalCompOffDays, setTotalCompOffDays] = useState(0);
  const [selectedCompOffBalance, setSelectedCompOffBalance] = useState(0);
  const [otherHalfType, setOtherHalfType] = useState<string>(WorkLocation.OFFICE);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  // Validation Refs
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const compOffDatesRef = useRef<HTMLDivElement>(null);
  const dateRangeRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const [validationErrors, setValidationErrors] = useState<{
    title?: boolean;
    compOffDates?: boolean;
    dates?: boolean;
    description?: boolean;
  }>({});

  const addCcEmail = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setCcEmailError("Please enter a valid email address");
      return;
    }
    if (ccEmails.includes(trimmed)) {
      setCcEmailError("Email already added");
      return;
    }
    setCcEmails([...ccEmails, trimmed]);
    setCcEmailInput("");
    setCcEmailError("");
  };

  const removeCcEmail = (emailToRemove: string) => {
    setCcEmails(ccEmails.filter((email) => email !== emailToRemove));
  };
  
  const isWeekend = (date: dayjs.Dayjs): boolean => {
    const day = date.day(); 
    return day === 0 || day === 6;
  };

  const isHoliday = (date: dayjs.Dayjs): boolean => {
    const dateStr = date.format("YYYY-MM-DD");
    return holidays.some((h: any) => {
      const hDate = h.date || h.holidayDate || h.workingDate || h.working_date;
      if (!hDate) return false;
      const normalizedHDate = dayjs(hDate).format("YYYY-MM-DD");
      return normalizedHDate === dateStr;
    });
  };

  const calculateDurationExcludingWeekends = (
    startDate: string,
    endDate: string
  ): number => {
    if (!startDate || !endDate) return 0;
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    let count = 0;
    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      if (!isWeekend(current) && !isHoliday(current)) {
        count++;
      }
      current = current.add(1, "day");
    }
    return count;
  };
  
  const employeeId = entity?.employeeId || currentUser?.loginId || currentUser?.employeeId;

  const fetchAvailableCompOffs = async () => {
    if (!employeeId) return;
    try {
      const { data } = await axios.get(`/api/comp-off/available/${employeeId}`);
      setAvailableCompOffs(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchCompOffHistory = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/comp-off/history/${employeeId}`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          month: selectedMonth === "All" ? undefined : selectedMonth,
          year: selectedYear === "All" ? undefined : selectedYear,
          status: filterStatus === "All" ? undefined : filterStatus,
        }
      });
      setCompOffs(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (e) {
      message.error("Failed to load Comp Off history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableCompOffs();
    dispatch(fetchHolidays());
  }, [employeeId, dispatch]);

  useEffect(() => {
    fetchCompOffHistory();
    if (isModalVisible) {
      fetchAvailableCompOffs();
    }
  }, [employeeId, currentPage, selectedMonth, selectedYear, filterStatus, isModalVisible]);

  // Effect for Calculating Available Balance from Dropdown
  useEffect(() => {
    const fetchSelectedBalance = async () => {
      if (selectedCompOffDates.length === 0) {
        setSelectedCompOffBalance(0);
        return;
      }
      try {
        const { data } = await axios.post("/api/comp-off/calculate-total-days", {
          employeeId,
          dates: selectedCompOffDates
        });
        setSelectedCompOffBalance(data);
      } catch (e) {
        const sum = availableCompOffs
          .filter(c => selectedCompOffDates.includes(c.attendanceDate))
          .reduce((acc, curr) => acc + (curr.remainingDays || 0), 0);
        setSelectedCompOffBalance(sum);
      }
    };
    fetchSelectedBalance();
  }, [selectedCompOffDates, employeeId, availableCompOffs]);

  useEffect(() => {
    if (dates && dates[0] && dates[1]) {
      const from = dates[0].format("YYYY-MM-DD");
      const to = dates[1].format("YYYY-MM-DD");
      const baseDur = calculateDurationExcludingWeekends(from, to);
      const dur = isHalfDay ? baseDur * 0.5 : baseDur;
      setTotalCompOffDays(dur);
    } else {
      setTotalCompOffDays(0);
    }
  }, [dates, isHalfDay, selectedCompOffBalance]);

  const handleSubmit = async () => {
    const errors: any = {};
    if (!title.trim()) errors.title = true;
    if (selectedCompOffDates.length === 0) errors.compOffDates = true;
    if (!dates || !dates[0] || !dates[1]) errors.dates = true;
    if (!description.trim()) errors.description = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      message.error("Please fill all mandatory fields.");
      
      // Scroll to the first error item within the scrollable modal body
      let firstErrorRef = null;
      if (errors.title) firstErrorRef = subjectRef;
      else if (errors.compOffDates) firstErrorRef = compOffDatesRef;
      else if (errors.dates) firstErrorRef = dateRangeRef;
      else if (errors.description) firstErrorRef = descriptionRef;

      if (firstErrorRef && firstErrorRef.current && modalBodyRef.current) {
        const container = modalBodyRef.current;
        const element = firstErrorRef.current;
        container.scrollTo({
          top: element.offsetTop - 20,
          behavior: 'smooth'
        });
      }
      return;
    }

    const fromDate = dates![0]!.format("YYYY-MM-DD");
    const toDate = dates![1]!.format("YYYY-MM-DD");

    const baseDur = calculateDurationExcludingWeekends(fromDate, toDate);
    let dur = isHalfDay ? baseDur * 0.5 : baseDur;

    if (dur > selectedCompOffBalance) {
      return message.error(
        `Note: You have selected ${selectedCompOffBalance} days of Comp Off credits, but your leave request is for ${dur} days. ` +
        `Please reduce your date range or select more credits before submitting.`
      );
    }

    setSubmitting(true);
    try {
      await dispatch(submitLeaveRequest({
        employeeId,
        requestType: LeaveRequestType.COMP_OFF,
        title,
        description,
        fromDate,
        toDate,
        duration: dur,
        isHalfDay: isHalfDay,
        halfDayType: isHalfDay ? halfDayType : undefined,
        otherHalfType: isHalfDay ? otherHalfType : undefined,
        compOffDates: JSON.stringify(selectedCompOffDates),
        ccEmails: ccEmails,
        documentKeys: uploadedDocumentKeys,
      } as any)).unwrap();

      message.success("Comp Off Leave Applied successfully!");
      setIsModalVisible(false);
      resetForm();
      fetchAvailableCompOffs();
      fetchCompOffHistory();
    } catch (e: any) {
      message.error(e || "Failed to submit Comp Off leave.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDates(null);
    setIsHalfDay(false);
    setSelectedCompOffDates([]);
    setCcEmails([]);
    setCcEmailInput("");
    setCcEmailError("");
    setUploadedDocumentKeys([]);
    setValidationErrors({});
  };

  useEffect(() => {
    if (isModalVisible && employeeId) {
      dispatch(getLeaveRequestEmailConfig(String(employeeId)))
        .unwrap()
        .then((data: any) => setEmailConfig({ assignedManagerEmail: data?.assignedManagerEmail ?? null, hrEmail: data?.hrEmail ?? null }))
        .catch(() => setEmailConfig({ assignedManagerEmail: null, hrEmail: null }));
      // Fetch blocked dates to disable them in the calendar picker
      axios.get(`/api/leave-requests/employee/${employeeId}/blocked-dates`)
        .then((res) => setBlockedDates(res.data || []))
        .catch(() => setBlockedDates([]));
    }
  }, [isModalVisible, employeeId, dispatch]);

  const disabledDate = (current: Dayjs): boolean => {
    if (!current) return false;
    const str = current.format('YYYY-MM-DD');
    return isWeekend(current) || isHoliday(current) || blockedDates.includes(str);
  };

  const availableOptions = availableCompOffs
    .filter(c => c.remainingDays > 0)
    .map(c => {
      const statusLabel = (c.status === CompOffStatus.HALF_TAKEN || c.status === "Half Taken") ? "Half Taken" : "Not Taken";
      return {
        menuLabel: `${dayjs(c.attendanceDate).format("MMM DD, YYYY")} (${statusLabel} - ${c.remainingDays} left)`,
        tagLabel: dayjs(c.attendanceDate).format("MMM DD, YYYY"),
        value: c.attendanceDate
      };
    });

  return (
    <div className="p-6 h-full flex flex-col bg-[#F4F7FE] overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674] tracking-tight">Comp Off Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your compensatory time off.</p>
        </div>
        <Button 
          type="primary" 
          size="large"
          className="relative group overflow-hidden bg-[#4318FF] rounded-xl shadow-[0_4px_12px_rgba(67,24,255,0.2)] hover:shadow-[0_8px_24px_rgba(139,92,246,0.5)] hover:-translate-y-1 transition-all duration-300 font-bold border-none p-0"
          onClick={() => setIsModalVisible(true)}
          style={{ height: '40px' }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-[#4318FF] to-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 flex items-center justify-center gap-2 px-6 w-full h-full">
            <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
            <span className="tracking-wide text-[14px]">Apply Comp Off</span>
          </div>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4 mb-4 gap-4">
        <h3 className="text-xl font-bold text-[#2B3674]">
          Earned Comp Offs History
        </h3>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all flex items-center px-4 overflow-hidden">
            <Select
              value={selectedMonth}
              onChange={(val) => { setSelectedMonth(val); setCurrentPage(1); }}
              className={`w-36 h-10 font-bold text-sm ${selectedMonth !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
              variant="borderless"
              dropdownStyle={{ borderRadius: "16px" }}
              suffixIcon={
                <ChevronDown
                  size={18}
                  className={selectedMonth !== "All" ? "text-[#4318FF]" : "text-gray-400"}
                />
              }
            >
              <Select.Option value="All">All Months</Select.Option>
              {months.map((m) => (
                <Select.Option key={m.value} value={m.value}>
                  {m.label}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all flex items-center px-4 overflow-hidden">
            <Select
              value={selectedYear}
              onChange={(val) => { setSelectedYear(val); setCurrentPage(1); }}
              className={`w-28 h-10 font-bold text-sm ${selectedYear !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
              variant="borderless"
              dropdownStyle={{ borderRadius: "16px" }}
              suffixIcon={
                <ChevronDown
                  size={18}
                  className={selectedYear !== "All" ? "text-[#4318FF]" : "text-gray-400"}
                />
              }
            >
              {years.map((y) => (
                <Select.Option key={y} value={y}>
                  {y === "All" ? "All Years" : y}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all flex items-center px-4 overflow-hidden">
            <Select
              value={filterStatus}
              onChange={(val) => { setFilterStatus(val); setCurrentPage(1); }}
              className={`w-40 h-10 font-bold text-sm ${filterStatus !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
              variant="borderless"
              dropdownStyle={{ borderRadius: "16px" }}
              suffixIcon={
                <ChevronDown
                  size={18}
                  className={filterStatus !== "All" ? "text-[#4318FF]" : "text-gray-400"}
                />
              }
            >
              <Select.Option value="All">All Status</Select.Option>
              <Select.Option value={CompOffStatus.NOT_TAKEN}>Not Taken</Select.Option>
              <Select.Option value={CompOffStatus.HALF_TAKEN}>Half Taken</Select.Option>
              <Select.Option value={CompOffStatus.FULL_TAKEN}>Full Taken</Select.Option>
            </Select>
          </div>

          {(selectedMonth !== "All" || selectedYear !== "All" || filterStatus !== "All") && (
            <button
              onClick={() => {
                setSelectedMonth("All");
                setSelectedYear("All");
                setFilterStatus("All");
                setCurrentPage(1);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B4FFF] text-white rounded-full hover:bg-[#4318FF] active:scale-95 transition-all text-sm font-bold border border-[#4318FF]/50 whitespace-nowrap"
              title="Clear all filters"
            >
              <X size={16} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] overflow-hidden border border-gray-100 mb-4">
        <div className="overflow-x-auto overflow-y-visible custom-scrollbar">
          <table className={`w-full ${compOffs.length === 0 ? '' : 'min-w-[1000px]'} border-separate border-spacing-0`}>
            <thead>
              <tr className="bg-[#4318FF] text-white">
                <th className="py-4 pl-10 pr-4 text-[13px] font-bold uppercase tracking-wider text-left whitespace-nowrap w-[25%]">
                  Employee
                </th>
                <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap w-[15%]">
                  Department
                </th>
                <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap w-[15%]">
                  Earned On
                </th>
                <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap w-[15%]">
                  Remaining Days
                </th>
                <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap w-[15%]">
                  Taken Date(s)
                </th>
                <th className="px-4 py-4 pr-10 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap sticky right-0 w-[160px] min-w-[160px] bg-[#4318FF] z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.15)] rounded-r-2xl">
                  Status
                </th>

              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Loading Data...
                  </td>
                </tr>
              ) : compOffs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Inbox size={32} className="text-gray-300" />
                      </div>
                      <p className="font-medium text-sm">No data found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                compOffs.map((item, index) => {
                  let parsedTakenDates = {};
                  if (item.takenDates) {
                    try { parsedTakenDates = JSON.parse(item.takenDates); } catch(e) {}
                  }

                  return (
                    <tr
                      key={item.id || index}
                      className={`group transition-all duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                      } hover:bg-gray-100`}
                    >
                      <td className="py-4 pl-10 pr-4 text-[#2B3674] text-sm font-bold whitespace-nowrap text-left">
                        {item.employee?.fullName || entity?.fullName || currentUser?.aliasLoginName || "Employee"} ({item.employeeId})
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap text-[#2B3674] font-medium text-sm">
                        {item.employee?.department || "-"}
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap text-[#2B3674] font-medium text-sm">
                        {dayjs(item.attendanceDate).format("DD MMM - YYYY")}
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap flex-col flex items-center justify-center font-bold text-gray-600">
                        {item.remainingDays}
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap w-48">
                        {Object.keys(parsedTakenDates).length > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {Object.entries(parsedTakenDates).map(([date, type]) => (
                              <span key={date} className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                {dayjs(date).format("DD MMM YYYY")} ({String(type)})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td
                        className={`py-4 px-4 pr-10 text-center sticky right-0 w-[160px] min-w-[160px] z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} group-hover:bg-gray-100`}
                      >
                        <span
                          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all whitespace-nowrap
                        ${
                          item.status === CompOffStatus.NOT_TAKEN
                            ? "bg-green-50 text-green-600 border-green-200"
                            : item.status === CompOffStatus.FULL_TAKEN
                              ? "bg-red-50 text-red-600 border-red-200"
                              : item.status === CompOffStatus.PENDING
                                ? "bg-orange-50 text-orange-600 border-orange-200"
                                : "bg-yellow-50 text-yellow-600 border-yellow-200"
                        }
                      `}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Horizontal Scroll Indicator */}
        {compOffs.length > 0 && (
          <div className="flex justify-center items-center py-2 bg-gray-50/30 border-t border-gray-100">
            <div className="flex items-center gap-2 text-[#A3AED0] opacity-80">
              <ArrowRightLeft size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Scroll table horizontally to view all columns</span>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 lg:px-10 lg:pb-6 gap-4">
          <div className="text-sm font-bold text-[#A3AED0] text-center sm:text-left">
            Showing{" "}
            <span className="text-[#2B3674]">
              {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="text-[#2B3674]">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="text-[#2B3674]">{totalItems}</span> entries
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border border-[#E9EDF7] transition-all flex items-center justify-center
              ${
                currentPage === 1
                  ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                  : "bg-white text-[#4318FF] hover:bg-[#4318FF]/5 active:scale-90 shadow-sm"
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="bg-[#F4F7FE] px-4 py-1.5 rounded-xl border border-transparent">
              <span className="text-xs font-black text-[#2B3674] tracking-widest">
                {currentPage} / {totalPages > 0 ? totalPages : 1}
              </span>
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className={`p-2 rounded-xl border border-[#E9EDF7] transition-all flex items-center justify-center
              ${
                currentPage === totalPages || totalPages === 0
                  ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                  : "bg-white text-[#4318FF] hover:bg-[#4318FF]/5 active:scale-90 shadow-sm"
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <Modal
        open={isModalVisible}
        onCancel={() => { setIsModalVisible(false); resetForm(); }}
        footer={null}
        closable={true}
        centered
        width={980}
        className="application-modal"
      >
        <div className="relative overflow-hidden bg-white rounded-[16px]">
          {/* Modal Header */}
          <div className="pt-2 px-6">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl md:text-3xl font-black text-[#2B3674]">
                Apply Comp Off
              </h2>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar max-h-[90vh]" ref={modalBodyRef}>
            {/* Email recipients - in card */}
            <div className="rounded-2xl border border-[#E0E7FF] bg-[#F8FAFC] p-4 shadow-sm">
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#2B3674] ml-1 block">
                  Email recipients
                </label>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 items-start">
                    {emailConfig.assignedManagerEmail && (
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-gray-600 ml-1 block mb-1">Assigned Manager</span>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={emailConfig.assignedManagerEmail}
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-gray-600 ml-1 block mb-1">HR</span>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={emailConfig.hrEmail || ""}
                        placeholder="Not configured"
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-600 ml-1 block mb-1">CC</span>
                    <div className="flex flex-wrap gap-2 items-center">
                      <>
                        {ccEmails.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 text-sm font-medium"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removeCcEmail(email)}
                              className="text-gray-500 hover:text-red-600 focus:outline-none"
                              aria-label={`Remove ${email}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={ccEmailInput}
                          onChange={(e) => {
                            setCcEmailInput(e.target.value);
                            if (ccEmailError) setCcEmailError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              addCcEmail(ccEmailInput);
                            }
                          }}
                          onBlur={() => addCcEmail(ccEmailInput)}
                          placeholder="Add email and press Enter"
                          className="min-w-[200px] flex-1 px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 text-sm placeholder-gray-400 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none"
                        />
                        {ccEmailError && (
                          <p className="text-red-500 text-xs mt-1 ml-1 w-full">{ccEmailError}</p>
                        )}
                      </>
                    </div>
                  </div>
                </div>
                {/* Subject - inside card */}
                <div className="space-y-2 pt-2" ref={subjectRef}>
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Comp Off Leave"
                      className={`w-full px-5 py-3 rounded-xl bg-white border ${validationErrors.title ? 'border-red-500' : 'border-gray-200'} text-gray-700 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none transition-all font-bold text-[#2B3674] placeholder:font-medium placeholder:text-gray-400`}
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (validationErrors.title) setValidationErrors(prev => ({ ...prev, title: false }));
                      }}
                    />
                    {validationErrors.title && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider">Subject is required</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* 1. SELECT COMP OFF DATES SECTION */}
            <div className={`rounded-2xl border ${validationErrors.compOffDates ? 'border-red-500 bg-red-50/10' : 'border-[#E0E7FF] bg-[#F8FAFC]'} p-4 shadow-sm border-l-4 border-l-[#4318FF]`} ref={compOffDatesRef}>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1 uppercase tracking-wider">
                        Step 1: Select Available Balance to Use
                    </label>
                    <div className="px-3 py-1 bg-white rounded-lg border border-blue-100 shadow-sm flex items-center gap-2">
                         <span className="text-[10px] uppercase font-black text-gray-400">Projected Balance:</span>
                         <span className="text-sm font-black text-[#4318FF]">
                           {parseFloat((availableCompOffs.reduce((sum, c) => sum + (c.remainingDays || 0), 0) - totalCompOffDays).toFixed(1))}
                         </span>
                    </div>
                </div>
                <div className={`rounded-xl border ${validationErrors.compOffDates ? 'border-red-500' : 'border-transparent'} z-100 relative bg-white shadow-sm ring-1 ring-gray-100 focus-within:ring-[#4318FF]`}>
                  <Select
                    mode="multiple"
                    className="w-full"
                    placeholder="Choose your accrued comp off dates..."
                    value={selectedCompOffDates}
                    onChange={(val) => {
                      setSelectedCompOffDates(val);
                      if (validationErrors.compOffDates) setValidationErrors(prev => ({ ...prev, compOffDates: false }));
                    }}
                    size="large"
                    bordered={false}
                    maxTagCount="responsive"
                    optionLabelProp="tagLabel"
                    dropdownRender={(menu) => (
                      <div className="flex flex-col">
                        <div className="p-2 border-b border-gray-100 mb-1 flex justify-between items-center bg-gray-50/50">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">
                            Available Comp Offs
                          </span>
                          <button
                            type="button"
                            className="text-[#4318FF] hover:text-[#4318FF]/80 text-[11px] font-black uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-[#4318FF]/5"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedCompOffDates.length === availableOptions.length) {
                                setSelectedCompOffDates([]);
                              } else {
                                setSelectedCompOffDates(availableOptions.map(o => o.value));
                                if (validationErrors.compOffDates) setValidationErrors(prev => ({ ...prev, compOffDates: false }));
                              }
                            }}
                          >
                            {selectedCompOffDates.length === availableOptions.length ? "Deselect All" : "Select All"}
                          </button>
                        </div>
                        {menu}
                      </div>
                    )}
                  >
                    {availableOptions.map(opt => (
                      <Select.Option key={opt.value} value={opt.value} tagLabel={opt.tagLabel}>
                        {opt.menuLabel}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
                {validationErrors.compOffDates && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-wider">Please select at least one Comp Off credit</p>}
            </div>



            {/* Duration Type */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Duration Type
                </label>
                <Select
                  value={isHalfDay ? halfDayType : "FULL_DAY"}
                  onChange={(val) => {
                    const isHalf = val === "FIRST_HALF" || val === "SECOND_HALF" || val === "HALF_DAY";
                    setIsHalfDay(isHalf);
                    if (val === "FIRST_HALF" || val === "SECOND_HALF") {
                        setHalfDayType(val);
                    } else {
                        setHalfDayType("FIRST_HALF"); // fallback
                    }
                  }}
                  className="w-full h-[48px] font-bold text-[#2B3674]"
                  variant="borderless"
                  dropdownStyle={{ borderRadius: "16px", padding: "8px" }}
                  style={{
                    backgroundColor: "#F4F7FE",
                    borderRadius: "16px",
                    border: "1px solid transparent",
                  }}
                  suffixIcon={<ChevronDown className="text-[#4318FF]" />}
                  getPopupContainer={(trigger: any) => trigger.parentNode}
                >
                  <Select.Option value="FULL_DAY">
                    Full Day
                  </Select.Option>
                  <Select.Option value="FIRST_HALF">
                    First Half
                  </Select.Option>
                  <Select.Option value="SECOND_HALF">
                    Second Half
                  </Select.Option>
                </Select>
              </div>

              {/* Other Half Activity (Shown if not Full Day) */}
              {isHalfDay && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    Other Half Activity
                  </label>
                  <Select
                    value={otherHalfType}
                    onChange={(val) => setOtherHalfType(val)}
                    className="w-full h-[48px] font-bold text-[#2B3674]"
                    variant="borderless"
                    dropdownStyle={{ borderRadius: "16px", padding: "8px" }}
                    style={{
                      backgroundColor: "#F4F7FE",
                      borderRadius: "16px",
                      border: "1px solid transparent",
                    }}
                    suffixIcon={<ChevronDown className="text-[#4318FF]" />}
                    getPopupContainer={(trigger: any) => trigger.parentNode}
                  >
                    <Select.Option value={WorkLocation.OFFICE}>
                      Office
                    </Select.Option>
                    <Select.Option value={WorkLocation.WORK_FROM_HOME}>
                      Work From Home
                    </Select.Option>
                    <Select.Option value={WorkLocation.CLIENT_VISIT}>
                      Client Visit
                    </Select.Option>
                  </Select>
                </div>
              )}
            </div>

            {/* Dates Row + Total Days */}
            <div className={`grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end p-4 rounded-2xl border transition-all ${validationErrors.dates ? 'border-red-500 bg-red-50/10' : 'border-transparent'}`} ref={dateRangeRef}>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <ConfigProvider theme={datePickerTheme}>
                    <DatePicker
                    inputReadOnly
                    className={`w-full px-5! py-3! rounded-[20px]! ${validationErrors.dates ? 'bg-white border border-red-500!' : 'bg-[#F4F7FE]! border-none!'} focus:bg-white! focus:border-[#4318FF]! transition-all font-bold! text-[#2B3674]! shadow-none`}
                    value={dates?.[0] || null}
                    onChange={(date) => {
                        const newDates = dates ? [...dates] : [null, null];
                        newDates[0] = date;
                        setDates(newDates as [any, any]);
                        if (date && dates?.[1] && validationErrors.dates) setValidationErrors(prev => ({ ...prev, dates: false }));
                    }}
                    disabledDate={disabledDate}
                    format="DD-MM-YYYY"
                    placeholder="dd-mm-yyyy"
                    suffixIcon={null}
                    getPopupContainer={(trigger: any) => trigger.parentNode}
                    />
                </ConfigProvider>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <ConfigProvider theme={datePickerTheme}>
                    <DatePicker
                    inputReadOnly
                    className={`w-full px-5! py-3! rounded-[20px]! ${validationErrors.dates ? 'bg-white border border-red-500!' : 'bg-[#F4F7FE]! border-none!'} focus:bg-white! focus:border-[#4318FF]! transition-all font-bold! text-[#2B3674]! shadow-none`}
                    value={dates?.[1] || null}
                    onChange={(date) => {
                        const newDates = dates ? [...dates] : [null, null];
                        newDates[1] = date;
                        setDates(newDates as [any, any]);
                        if (date && dates?.[0] && validationErrors.dates) setValidationErrors(prev => ({ ...prev, dates: false }));
                    }}
                    disabledDate={disabledDate}
                    format="DD-MM-YYYY"
                    placeholder="dd-mm-yyyy"
                    suffixIcon={null}
                    getPopupContainer={(trigger: any) => trigger.parentNode}
                    />
                </ConfigProvider>
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Total Days:
                </label>
                <div className="px-4 py-3 rounded-2xl bg-[#F4F7FE] font-bold text-[#4318FF] inline-flex items-center gap-2 min-h-[48px]">
                  <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-100">
                    {totalCompOffDays}
                  </span>
                </div>
              </div>
              {validationErrors.dates && <p className="col-span-full text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider">Please select a valid date range</p>}
            </div>
            {/* Dynamic Summary Note */}
            {(selectedCompOffDates.length > 0 || (dates && dates[0] && dates[1])) && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-xl h-fit flex items-center justify-center">
                    <InfoCircleOutlined className="text-[#4318FF] text-xl" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#2B3674] text-sm leading-relaxed">
                      You are using <strong>{totalCompOffDays} day(s)</strong> of Comp Off earned on{" "}
                      <span className="text-[#4318FF] font-bold">
                        {selectedCompOffDates.map(d => dayjs(d).format("MMM DD")).join(", ")}
                      </span>.
                    </p>
                    <p className="text-[#2B3674]/80 text-xs font-medium italic">
                      Remaining balance after this will be <strong>{parseFloat((availableCompOffs.reduce((sum, c) => sum + (c.remainingDays || 0), 0) - totalCompOffDays).toFixed(1))}</strong>.
                    </p>
                    {dates && dates[0] && dates[1] && totalCompOffDays > 0 && (
                      <div className="mt-2 pt-2 border-t border-blue-100/50">
                        {totalCompOffDays <= selectedCompOffBalance ? (
                          <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-wide">
                            <CheckCircleFilled className="text-sm" />
                            Security Check: This leave is fully covered by your selected credits.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 p-3 bg-red-50 rounded-xl border border-red-100 mt-2">
                            <div className="flex items-center gap-2 text-red-600 font-black text-[11px] uppercase tracking-wider">
                              <ExclamationCircleFilled className="text-sm" />
                              Insufficient Credits - Action Required
                            </div>
                            <p className="text-[#2B3674] text-xs font-bold leading-relaxed">
                              Note: You have selected <span className="text-red-600 underline">{selectedCompOffBalance} days</span> of Comp Off credits, but your leave request is for <span className="text-red-600 underline">{totalCompOffDays} days</span>. You can only apply for a Comp Off leave that matches your selected credits.
                            </p>
                            <p className="text-[#2B3674] text-xs font-medium border-t border-red-100 pt-2">
                              Action: Please reduce your date range to <span className="font-black text-[#4318FF]">{selectedCompOffBalance} days</span>. For the additional <span className="font-black text-red-600">{Number((totalCompOffDays - selectedCompOffBalance).toFixed(1))} day(s)</span>, please submit a separate 'Apply Leave' or 'Work Management' request.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Description Field */}
            <div className="space-y-2" ref={descriptionRef}>
              <label className="text-sm font-bold text-[#2B3674] ml-1">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="Please provide details about your request..."
                  className={`w-full px-5 py-3 rounded-2xl bg-[#F4F7FE] border ${validationErrors.description ? 'border-red-500' : 'border-transparent'} focus:bg-white focus:border-[#4318FF] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-[#2B3674] placeholder:font-medium placeholder:text-gray-400 resize-none`}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (validationErrors.description) setValidationErrors(prev => ({ ...prev, description: false }));
                  }}
                />
                {validationErrors.description && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider">Description is required</p>}
              </div>
            </div>

            {/* Document Upload Section */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#2B3674] ml-1">
                Supporting Documents (Optional)
              </label>
              <p className="text-xs text-gray-500 ml-1 mb-1">
                Accepted formats: PDF, JPG, PNG, JPEG (Max 5 files, 5MB per
                file)
              </p>
              <div className="bg-[#F4F7FE] rounded-2xl p-2 border border-blue-50">
                <CommonMultipleUploader
                  entityType="LEAVE_REQUEST"
                  entityId={Number(entity?.id || currentUser?.id || 0)}
                  refId={0}
                  refType="DOCUMENT"
                  uploadFile={uploadLeaveRequestFile}
                  downloadFile={downloadLeaveRequestFile}
                  previewFile={previewLeaveRequestFile}
                  deleteFile={deleteLeaveRequestFile}
                  getFiles={getLeaveRequestFiles}
                  maxFiles={5}
                  maxFileSize={5 * 1024 * 1024}
                  allowedTypes={["images", "pdf"]}
                  successMessage="Document uploaded successfully"
                  deleteMessage="Document deleted successfully"
                  onFileUpload={(file: any) => setUploadedDocumentKeys((prev) => [...prev, file.key])}
                  onFileDelete={(fileKey: string) => setUploadedDocumentKeys((prev) => prev.filter((k) => k !== fileKey))}
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-2 flex gap-4">
              <button
                onClick={() => { setIsModalVisible(false); resetForm(); }}
                className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || (totalCompOffDays > selectedCompOffBalance && totalCompOffDays > 0) || !dates}
                className={`flex-1 py-4 rounded-2xl font-bold text-white transition-all active:scale-95 transform 
                  ${(totalCompOffDays > selectedCompOffBalance && totalCompOffDays > 0) || !dates
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-linear-to-r from-[#4318FF] to-[#868CFF] hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
                  } disabled:opacity-80`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompOffDashboard;
