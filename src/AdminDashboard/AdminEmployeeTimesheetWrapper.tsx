import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import EmployeeTimesheetView from "../Admin/Admin_Dashboard/EmpTimesheet/EmployeeTimesheetView";
import { ChevronLeft } from "lucide-react";

const AdminEmployeeTimesheetWrapper = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { entities } = useSelector((state: RootState) => state.employeeDetails);
  const [displayDate, setDisplayDate] = useState(new Date(2026, 0, 5));

  const employee = entities.find(
    (e: any) => (e.employeeId || e.id) === employeeId
  );

  const calculateTotal = (login: string | null, logout: string | null) => {
    if (
      !login ||
      !logout ||
      logout === "Not logged out" ||
      login === "--" ||
      logout === "--"
    )
      return "--";
    const parseTime = (timeStr: string) => {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    const diff = parseTime(logout) - parseTime(login);
    if (diff < 0) return "--";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  if (!employee) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">Employee not found</p>
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="px-4 py-2 bg-[#4318FF] text-white rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F7FE]">
      <div className="p-4 pb-0">
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#2B3674] rounded-xl text-sm font-bold shadow-sm border border-gray-100 hover:bg-gray-50 transition-all font-sans"
        >
          <ChevronLeft size={18} />
          Back to Dashboard
        </button>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <EmployeeTimesheetView
          entries={[]} // You might want to fetch actual entries here if available in state
          calculateTotal={calculateTotal}
          displayDate={displayDate}
          onPrevMonth={() => {
            const newDate = new Date(displayDate);
            newDate.setMonth(newDate.getMonth() - 1);
            setDisplayDate(newDate);
          }}
          onNextMonth={() => {
            const newDate = new Date(displayDate);
            newDate.setMonth(newDate.getMonth() + 1);
            setDisplayDate(newDate);
          }}
          employeeName={employee.fullName || employee.name || "Employee"}
        />
      </div>
    </div>
  );
};

export default AdminEmployeeTimesheetWrapper;
