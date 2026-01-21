import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import {
  fetchMonthlyAttendance,
  AttendanceStatus,
} from "../reducers/employeeAttendance.reducer";
import Calendar from "../EmployeeDashboard/CalendarView";
import { ArrowLeft, ClipboardList } from "lucide-react";

const AdminEmployeeCalendarView = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { records, loading } = useAppSelector(
    (state: RootState) => state.attendance,
  );
  const { entities } = useAppSelector(
    (state: RootState) => state.employeeDetails,
  );
  const [displayDate, setDisplayDate] = useState(new Date());

  const employee = entities.find(
    (e: any) => (e.employeeId || e.id) === employeeId,
  );

  useEffect(() => {
    if (employeeId) {
      dispatch(
        fetchMonthlyAttendance({
          employeeId,
          month: (displayDate.getMonth() + 1).toString(),
          year: displayDate.getFullYear().toString(),
        }),
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
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-semibold tracking-wide">
            Back to employee list
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FE]">
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
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 flex flex-col items-center justify-center m-4 md:mx-8">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <ClipboardList className="text-gray-300 w-6 h-6" />
          </div>
          <p className="text-gray-400 font-medium text-center">
            No data available for this month
          </p>
          <p className="text-gray-300 text-sm mt-1">
            Try selecting a different month using the calendar above
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default AdminEmployeeCalendarView;
