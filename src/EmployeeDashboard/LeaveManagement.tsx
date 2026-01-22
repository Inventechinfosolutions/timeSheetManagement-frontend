import { useState } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  Plus,
  ChevronDown,
  Briefcase,
  Home,
  MapPin,
} from "lucide-react";

const LeaveManagement = () => {
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const applyOptions = [
    { label: "Apply Leave", icon: Calendar, color: "text-[#4318FF]" },
    { label: "Work From Home", icon: Home, color: "text-[#38A169]" },
    { label: "Client Visit", icon: MapPin, color: "text-[#FFB547]" },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#F4F7FE] min-h-screen font-sans text-[#2B3674]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674]">
            Leave Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View your leave balance and request new leaves
          </p>
        </div>

        {/* Apply Button with Dropdown */}
        <div className="relative z-50">
          <button
            onClick={() => setIsApplyOpen(!isApplyOpen)}
            className="flex items-center gap-2 px-6 py-3 bg-[#4318FF] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:-translate-y-0.5 active:scale-95 group"
          >
            <Plus size={18} />
            <span>Apply</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${
                isApplyOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isApplyOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.1)] border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-1">
                {applyOptions.map((option, idx) => (
                  <button
                    key={idx}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all text-left group/item"
                    onClick={() => setIsApplyOpen(false)}
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

      {/* Hero Apply Card */}
      <div className="mb-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#4318FF] to-[#868CFF] rounded-[24px] p-8 md:p-12 text-white shadow-xl shadow-blue-500/20 group cursor-pointer hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-1">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col gap-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full w-fit mx-auto md:mx-0 border border-white/10">
                <Briefcase size={14} className="text-blue-100" />
                <span className="text-xs font-bold tracking-wider uppercase text-blue-50">
                  Quick Action
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Need time off?
                <br />
                <span className="text-blue-200">Apply in seconds.</span>
              </h2>
              <p className="text-blue-100 font-medium max-w-md">
                Select your leave type, dates, and reason. Your manager will be
                notified instantly.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl md:rotate-3 transition-transform group-hover:rotate-0 duration-500">
              <div
                className="bg-white text-[#4318FF] px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-lg hover:bg-blue-50 transition-colors"
                onClick={() => setIsApplyOpen(!isApplyOpen)}
              >
                <span>Start Application</span>
                <div className="bg-[#4318FF] text-white p-1 rounded-full">
                  <Plus size={14} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            label: "Casual Leave",
            used: 2,
            total: 12,
            color: "from-[#4318FF] to-[#868CFF]",
            icon: Calendar,
          },
          {
            label: "Sick Leave",
            used: 1,
            total: 10,
            color: "from-[#38A169] to-[#68D391]",
            icon: AlertCircle,
          },
          {
            label: "Privilege Leave",
            used: 5,
            total: 15,
            color: "from-[#FFB547] to-[#FCCD75]",
            icon: Clock,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-[20px] p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] relative overflow-hidden group hover:shadow-lg transition-all"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-r ${item.color} text-white shadow-md`}
                >
                  <item.icon size={24} />
                </div>
                <span className="text-3xl font-black text-[#2B3674]">
                  {item.total - item.used}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#2B3674]">{item.label}</h3>
              <div className="mt-2 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span>Used: {item.used}</span>
                <span>Total: {item.total}</span>
              </div>
              {/* Progress Bar */}
              <div className="mt-3 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${item.color}`}
                  style={{ width: `${(item.used / item.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Leave History Placeholder */}
      <div className="bg-white rounded-[20px] p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)]">
        <h3 className="text-xl font-bold text-[#2B3674] mb-6">
          Recent Leave History
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center text-[#A3AED0]">
          <div className="p-4 bg-gray-50 rounded-full mb-3">
            <Calendar size={40} className="opacity-20" />
          </div>
          <p className="font-bold">No leave history found</p>
          <p className="text-sm mt-1">Apply for leave to see history here</p>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
