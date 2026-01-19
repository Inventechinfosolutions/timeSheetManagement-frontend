import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import { fetchMonthlyAttendance, AttendanceStatus } from "../reducers/employeeAttendance.reducer";
import Calendar from "../EmployeeDashboard/CalendarView";
import { ArrowLeft, ClipboardList, Clock, CalendarCheck } from "lucide-react";

const AdminEmployeeCalendarView = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { records, loading } = useAppSelector(
    (state: RootState) => state.attendance
  );
  const { entities } = useAppSelector(
    (state: RootState) => state.employeeDetails
  );
  const [displayDate, setDisplayDate] = useState(new Date());

  const employee = entities.find(
    (e: any) => (e.employeeId || e.id) === employeeId
  );

  // Calculate metrics
  const presentDays = records.filter(
    (r) =>
      r.status === AttendanceStatus.FULL_DAY ||
      r.status === AttendanceStatus.HALF_DAY
  ).length;

  const totalHours = records.reduce(
    (acc, curr) => acc + (curr.totalHours || 0),
    0
  );
  const avgHours =
    presentDays > 0 ? (totalHours / presentDays).toFixed(1) : "0";

  useEffect(() => {
    if (employeeId) {
      dispatch(
        fetchMonthlyAttendance({
          employeeId,
          month: (displayDate.getMonth() + 1).toString(),
          year: displayDate.getFullYear().toString(),
        })
      );
    }
  }, [dispatch, employeeId, displayDate]);

  const handleMonthChange = (newDate: Date) => {
    setDisplayDate(newDate);
  };

  const handleBack = () => {
    navigate("/admin-dashboard/working-details");
  };

  if (!employee) {
    return (
      <div className="p-8 text-center pt-[100px]">
        <p className="text-gray-500 mb-4">Employee not found</p>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-400 hover:text-[#4318FF] transition-colors group mx-auto"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold tracking-wide">Back to employee list</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FE] pt-6">
      <div className="mb-4 flex items-center justify-between px-4 md:px-8">
        <div className="flex flex-col gap-1">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-[#4318FF] transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold tracking-wide">Back to employee list</span>
          </button>
          <h2 className="text-xl font-bold text-[#2B3674] mt-1">
            Working Details: {employee.fullName || employee.name}
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="space-y-3 pb-10">
          {/* Summary Cards */}
          <div className="px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-[#E6FFFA] flex items-center justify-center text-[#01B574] group-hover:scale-110 transition-transform">
                  <CalendarCheck size={28} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Total Present Days
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-[#2B3674]">
                      {presentDays}
                    </h3>
                    <span className="text-xs font-bold text-[#01B574] bg-[#E6FFFA] px-2 py-0.5 rounded-full">
                      Days
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] group-hover:scale-110 transition-transform">
                  <Clock size={28} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Total Working Hours
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-[#2B3674]">
                      {avgHours}
                    </h3>
                    <span className="text-xs font-bold text-[#4318FF] bg-[#F4F7FE] px-2 py-0.5 rounded-full">
                      Hours
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-0 md:px-2">
            <Calendar
              currentDate={displayDate}
              onMonthChange={handleMonthChange}
              employeeId={employeeId}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4318FF]"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 flex flex-col items-center justify-center transition-all animate-in fade-in duration-500">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <ClipboardList className="text-gray-300 w-6 h-6" />
              </div>
              <p className="text-gray-400 font-medium">
                No data available for this month
              </p>
              <p className="text-gray-300 text-sm mt-1">
                Try selecting a different month using the calendar above
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AdminEmployeeCalendarView;
