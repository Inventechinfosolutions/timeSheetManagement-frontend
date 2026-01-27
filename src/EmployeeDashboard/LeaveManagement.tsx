import { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import {
  getLeaveHistory,
  getLeaveStats,
  submitLeaveRequest,
  resetSubmitSuccess,
  updateLeaveRequestStatus,
} from "../reducers/leaveRequest.reducer";
import {
  Home,
  MapPin,
  X,
  XCircle,
  Calendar,
  Plus,
  Briefcase,
  Eye,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { notification } from "antd";

const LeaveManagement = () => {
  const dispatch = useAppDispatch();
  const { entities = [], stats = null, loading, submitSuccess, error } = useAppSelector(
    (state) => state.leaveRequest || {}
  );
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const employeeId = entity?.employeeId || currentUser?.employeeId;

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const disabledDate = (current: any) => {
    if (!current) return false;
    
    // Normalize current date to start of day for comparison
    const currentDate = current.startOf('day');
    const today = dayjs().startOf('day');

    // Disable past dates
    if (currentDate.isBefore(today)) {
      return true;
    }
    
    return (entities || []).some((req: any) => {
      if (!req || req.status === "Rejected" || req.status === "Cancelled") return false;
      
      const startDate = dayjs(req.fromDate).startOf('day');
      const endDate = dayjs(req.toDate).startOf('day');
      
      return (
        (currentDate.isSame(startDate) || currentDate.isAfter(startDate)) &&
        (currentDate.isSame(endDate) || currentDate.isBefore(endDate))
      );
    });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { title: "", description: "", startDate: "", endDate: "" };

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
      isValid = false;
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
      isValid = false;
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };
  const handleSubmit = () => {
    if (validateForm()) {
      const duration = formData.startDate && formData.endDate 
        ? dayjs(formData.endDate).diff(dayjs(formData.startDate), 'day') + 1 
        : 0;

      dispatch(
        submitLeaveRequest({
          employeeId,
          requestType: selectedLeaveType,
          title: formData.title,
          description: formData.description,
          fromDate: formData.startDate,
          toDate: formData.endDate,
          duration,
          submittedDate: new Date().toISOString().split("T")[0],
        })
      );
    }
  };

  useEffect(() => {
    if (submitSuccess) {
      notification.success({
        message: "Application Submitted",
        description: "Notification sent to Admin",
        placement: "topRight",
        duration: 3,
      });
    }
  }, [submitSuccess]);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsApplyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (employeeId) {
      dispatch(getLeaveHistory(employeeId));
      dispatch(getLeaveStats(employeeId));
    }
  }, [dispatch, employeeId]);

  useEffect(() => {
    if (submitSuccess && employeeId) {
      setIsModalOpen(false);
      dispatch(getLeaveStats(employeeId));
      dispatch(resetSubmitSuccess());
      setFormData({ title: "", description: "", startDate: "", endDate: "" });
      setErrors({ title: "", description: "", startDate: "", endDate: "" });
    }
  }, [submitSuccess, dispatch]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const handleOpenModal = (label: string) => {
    setIsApplyOpen(false);
    setIsViewMode(false);
    setSelectedLeaveType(label);
    setIsModalOpen(true);
    setErrors({ title: "", description: "", startDate: "", endDate: "" });
    // Clear any previous global errors from the store
    dispatch(resetSubmitSuccess()); 
  };

  const handleViewApplication = (item: any) => {
    setIsViewMode(true);
    setSelectedLeaveType(item.requestType);
    setFormData({
      title: item.title,
      description: item.description,
      startDate: item.fromDate,
      endDate: item.toDate,
    });
    setIsModalOpen(true);
    setErrors({ title: "", description: "", startDate: "", endDate: "" });
  };

  const handleCancel = (id: number) => {
    if (window.confirm("Are you sure you want to cancel this request?") && employeeId) {
      dispatch(updateLeaveRequestStatus({ id, status: "Cancelled" })).then(() => {
        dispatch(getLeaveStats(employeeId));
        dispatch(getLeaveHistory(employeeId));
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsViewMode(false);
    setFormData({ title: "", description: "", startDate: "", endDate: "" });
    setErrors({ title: "", description: "", startDate: "", endDate: "" });
    dispatch(resetSubmitSuccess());
  };

  const applyOptions = [
    { label: "Leave", icon: Calendar, color: "text-[#4318FF]" },
    { label: "Work From Home", icon: Home, color: "text-[#38A169]" },
    { label: "Client Visit", icon: MapPin, color: "text-[#FFB547]" },
  ];

  /* Button Animation Logic */
  const [animIndex, setAnimIndex] = useState(0);
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  
  const animatedOptions = [
    { label: "Apply", icon: Plus, color: "text-[#4318FF]" }, // Default
    { label: "Leave", icon: Calendar, color: "text-red-500" },
    { label: "Work From Home", icon: Home, color: "text-[#38A169]" },
    { label: "Client Visit", icon: MapPin, color: "text-[#FFB547]" },
  ];
  const currentOption = animatedOptions[animIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isBtnHovered && !isApplyOpen) {
        setAnimIndex((prev) => (prev + 1) % animatedOptions.length);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isBtnHovered, isApplyOpen]);

  const handleSmartClick = () => {
    if (currentOption.label === "Apply") {
      setIsApplyOpen(!isApplyOpen);
    } else {
      handleOpenModal(currentOption.label);
    }
  };

  return (
    <div className="p-4 md:px-8 md:pb-8 md:pt-0 bg-[#F4F7FE] min-h-screen font-sans text-[#2B3674]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#F4F7FE] -mx-4 px-4 py-2 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674]">
            Work Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View your leave balance and request new leaves
          </p>
        </div>

        {/* Apply Button Removed */}
      </div>

      {/* Hero Action Card */}
      <div className="relative bg-gradient-to-r from-[#4318FF] to-[#868CFF] rounded-[20px] p-6 md:p-8 mb-8 shadow-xl shadow-blue-500/20 group animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Decorative Elements Wrapper for Overflow */}
        <div className="absolute inset-0 overflow-hidden rounded-[20px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full w-fit mx-auto md:mx-0 border border-white/10">
              <Briefcase size={12} className="text-blue-100" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-50">
                Quick Action
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-white">
              Need time off?
              <br />
              <span className="text-blue-200">Apply in seconds.</span>
            </h2>
            <p className="text-blue-100 text-sm font-medium max-w-xl">
              Select your leave type, dates, and reason. Your manager will be notified instantly.
            </p>
          </div>

          <div 
            className="relative bg-white/10 backdrop-blur-md border border-white/20 p-1.5 rounded-2xl md:rotate-3 transition-transform group-hover:rotate-0 duration-500"
            ref={dropdownRef}
          >
            <button
              onMouseEnter={() => setIsBtnHovered(true)}
              onMouseLeave={() => setIsBtnHovered(false)}
              onClick={handleSmartClick}
              className="bg-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm min-w-[200px]"
            >
              <div key={animIndex} className={`flex items-center gap-2 animate-flip-up ${currentOption.color}`}>
                <currentOption.icon size={18} />
                <span>{currentOption.label}</span>
              </div>
            </button>

            {/* Dropdown Menu Moved Here */}
             {isApplyOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.1)] border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2 z-50 text-left">
              <div className="flex flex-col gap-1">
                {applyOptions.map((option, idx) => (
                  <button
                    key={idx}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all text-left group/item"
                    onClick={() => handleOpenModal(option.label)}
                  >
                    <div
                      className={`p-2 rounded-lg bg-gray-50 group-hover/item:bg-white group-hover/item:shadow-sm transition-all ${option.color}`}
                    >
                      <option.icon size={18} />
                    </div>
                    <span className="font-bold text-sm text-[#2B3674]">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>


      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
        {[
          {
            label: "Leave",
            applied: stats?.leave?.applied || 0,
            approved: stats?.leave?.approved || 0,
            rejected: stats?.leave?.rejected || 0,
            total: stats?.leave?.total || 0,
            color: "from-[#4318FF] to-[#868CFF]",
            icon: Calendar,
          },
          {
            label: "Work From Home",
            applied: stats?.wfh?.applied || 0,
            approved: stats?.wfh?.approved || 0,
            rejected: stats?.wfh?.rejected || 0,
            total: stats?.wfh?.total || 0,
            color: "from-[#38A169] to-[#68D391]",
            icon: Home,
          },
          {
            label: "Client Visit",
            applied: stats?.clientVisit?.applied || 0,
            approved: stats?.clientVisit?.approved || 0,
            rejected: stats?.clientVisit?.rejected || 0,
            total: stats?.clientVisit?.total || 0,
            color: "from-[#FFB547] to-[#FCCD75]",
            icon: MapPin,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-[20px] p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] relative overflow-hidden group hover:shadow-lg transition-all"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-3 rounded-xl bg-linear-to-r ${item.color} text-white shadow-md`}
                >
                  <item.icon size={24} />
                </div>
                <span className="text-3xl font-black text-[#2B3674]">
                  {item.applied}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#2B3674]">{item.label}</h3>
              <div className="mt-2 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span>Approved: {item.approved}</span>
                <span>Rejected: {item.rejected}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Leave History */}
      <h3 className="text-xl font-bold text-[#2B3674] mb-4 mt-8">
        Recent Leave History
      </h3>
      <div className="bg-white rounded-[20px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] overflow-hidden border border-gray-100 mb-8">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#4318FF] text-white">
                <th className="text-left py-4 pl-10 pr-4 text-[13px] font-bold uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                  Request Type
                </th>
                <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                  Submitted Date
                </th>
                <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Calendar size={32} className="text-gray-300" />
                      </div>
                      <p className="font-medium text-sm">
                        No Request found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                entities.map((item, index) => (
                <tr
                  key={index}
                  className={`group transition-all duration-200 ${
                    index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                  } hover:bg-[#F1F4FF]`}
                >
                  <td className="py-4 pl-10 pr-4 text-[#2B3674] text-sm font-bold">
                    {item.fullName || currentUser?.aliasLoginName || "User"} ({item.employeeId})
                  </td>
                  <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold">
                    {item.requestType === "Apply Leave" ? "Leave" : item.requestType}
                  </td>
                  <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold">
                    {item.submittedDate ? dayjs(item.submittedDate).format("DD MMM - YYYY") : (item.created_at ? dayjs(item.created_at).format("DD MMM - YYYY") : "-")}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="text-sm font-bold text-[#2B3674]">
                      {dayjs(item.fromDate).format("DD MMM")} - {dayjs(item.toDate).format("DD MMM - YYYY")}
                    </div>
                    <p className="text-[10px] text-[#4318FF] font-black mt-1 uppercase tracking-wider">
                      Total: {item.duration || (dayjs(item.toDate).diff(dayjs(item.fromDate), 'day') + 1)} Day(s)
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleViewApplication(item)}
                        className="p-2 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-200 active:scale-90"
                        title="View Application"
                      >
                        <Eye size={18} />
                      </button>
                      {item.status === "Pending" && (
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="p-2 text-red-500 bg-red-50/50 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-200 active:scale-90"
                          title="Cancel Request"
                        >
                          <XCircle size={18} />
                        </button>
                      )}

                      <span
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all
                          ${
                            item.status === "Approved"
                              ? "bg-green-50 text-green-600 border-green-200"
                              : item.status === "Pending"
                              ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                              : item.status === "Cancelled"
                              ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                              : "bg-red-50 text-red-600 border-red-200"
                          }
                        `}
                      >
                        {item.status === "Pending" && (
                          <RotateCcw size={12} className="animate-spin-slow" />
                        )}
                        {item.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#2B3674]/30 backdrop-blur-sm" 
            onClick={handleCloseModal}
          />
          <div className="relative w-full max-w-xl bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="p-8 pb-0">
              <div className="flex justify-between items-start mb-6">
                {isViewMode && (
                  <button 
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors order-first"
                  >
                    <ArrowLeft size={20} className="text-gray-400" />
                  </button>
                )}
                <button 
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors order-last"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block px-1">
                  {isViewMode ? "Viewing Application" : "Applying For"}
                </span>
                <h2 className="text-3xl font-black text-[#2B3674]">
                  {selectedLeaveType}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <XCircle size={20} className="text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-600 leading-tight">
                    {error}
                  </p>
                </div>
              )}
              {/* Title Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">Title</label>
                {isViewMode ? (
                  <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] border-none">
                    {formData.title}
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Annual Vacation"
                      className={`w-full px-5 py-3 rounded-2xl bg-[#F4F7FE] border ${
                        errors.title ? "border-red-500" : "border-transparent"
                      } focus:bg-white focus:border-[#4318FF] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-[#2B3674] placeholder:font-medium placeholder:text-gray-400`}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1 ml-2">{errors.title}</p>}
                  </div>
                )}
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">Start Date</label>
                  {isViewMode ? (
                    <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] text-center">
                      {dayjs(formData.startDate).format("DD-MM-YYYY")}
                    </div>
                  ) : (
                    <>
                      <ConfigProvider
                        theme={{
                          token: {
                            borderRadius: 16,
                            controlHeight: 48,
                            colorBgContainer: '#F4F7FE',
                            colorBorder: 'transparent',
                            colorPrimary: '#4318FF',
                          },
                          components: { DatePicker: { cellHeight: 28, cellWidth: 28 } }
                        }}
                      >
                        <DatePicker
                          popupClassName="hide-other-months"
                          disabledDate={disabledDate}
                          className={`w-full px-5! py-3! rounded-[20px]! bg-[#F4F7FE]! border-none! focus:bg-white! focus:border-[#4318FF]! transition-all font-bold! text-[#2B3674]! shadow-none`}
                          value={formData.startDate ? dayjs(formData.startDate) : null}
                          onChange={(date) => setFormData({ ...formData, startDate: date ? date.format('YYYY-MM-DD') : "" })}
                          format="DD-MM-YYYY"
                          placeholder="dd-mm-yyyy"
                          suffixIcon={null}
                        />
                      </ConfigProvider>
                      {errors.startDate && <p className="text-red-500 text-xs mt-1 ml-2">{errors.startDate}</p>}
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">End Date</label>
                  {isViewMode ? (
                    <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] text-center">
                      {dayjs(formData.endDate).format("DD-MM-YYYY")}
                    </div>
                  ) : (
                    <>
                      <ConfigProvider
                        theme={{
                          token: {
                            borderRadius: 16,
                            controlHeight: 48,
                            colorBgContainer: '#F4F7FE',
                            colorBorder: 'transparent',
                            colorPrimary: '#4318FF',
                          },
                          components: { DatePicker: { cellHeight: 28, cellWidth: 28 } }
                        }}
                      >
                        <DatePicker
                          popupClassName="hide-other-months"
                          disabledDate={disabledDate}
                          className={`w-full px-5! py-3! rounded-[20px]! bg-[#F4F7FE]! border-none! focus:bg-white! focus:border-[#4318FF]! transition-all font-bold! text-[#2B3674]! shadow-none`}
                          value={formData.endDate ? dayjs(formData.endDate) : null}
                          onChange={(date) => setFormData({ ...formData, endDate: date ? date.format('YYYY-MM-DD') : "" })}
                          format="DD-MM-YYYY"
                          placeholder="dd-mm-yyyy"
                          suffixIcon={null}
                        />
                      </ConfigProvider>
                      {errors.endDate && <p className="text-red-500 text-xs mt-1 ml-2">{errors.endDate}</p>}
                    </>
                  )}
                </div>
              </div>

              {/* Duration Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">Duration</label>
                <div className="w-full px-5 py-3 rounded-2xl bg-[#F4F7FE] font-bold text-[#4318FF] flex items-center justify-between">
                  <span>Total Days:</span>
                  <span className="bg-white px-4 py-1 rounded-lg shadow-sm border border-blue-100">
                    {formData.startDate && formData.endDate 
                      ? `${dayjs(formData.endDate).diff(dayjs(formData.startDate), 'day') + 1} Day(s)`
                      : "0 Days"}
                  </span>
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">Description</label>
                {isViewMode ? (
                  <div className="w-full px-5 py-4 rounded-[20px] bg-[#F4F7FE] font-medium text-[#2B3674] min-h-[120px] whitespace-pre-wrap leading-relaxed">
                    {formData.description || "No description provided."}
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      rows={4}
                      placeholder="Please provide details about your request..."
                      className={`w-full px-5 py-3 rounded-2xl bg-[#F4F7FE] border ${
                        errors.description ? "border-red-500" : "border-transparent"
                      } focus:bg-white focus:border-[#4318FF] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-[#2B3674] placeholder:font-medium placeholder:text-gray-400 resize-none`}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1 ml-2">{errors.description}</p>}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 flex gap-4">
                {isViewMode ? (
                  <button
                    onClick={handleCloseModal}
                    className="w-full py-4 bg-white border-2 border-gray-50 text-gray-400 font-black rounded-2xl hover:bg-gray-50 hover:text-[#4318FF] transition-all duration-300"
                  >
                    CLOSE
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 py-4 rounded-2xl font-bold text-white bg-linear-to-r from-[#4318FF] to-[#868CFF] hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 transform disabled:opacity-50"
                    >
                      {loading ? "Submitting..." : "Submit Application"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
