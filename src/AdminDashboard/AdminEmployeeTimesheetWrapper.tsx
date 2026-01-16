import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { ChevronLeft } from "lucide-react";
import MyTimesheet from "../EmployeeDashboard/MyTimesheet";

const AdminEmployeeTimesheetWrapper = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { entities } = useSelector((state: RootState) => state.employeeDetails);

  const employee = entities.find(
    (e: any) => (e.employeeId || e.id) === employeeId
  );

  const handleBack = () => {
    navigate("/admin-dashboard/timesheet-list");
  };

  if (!employee) {
    return (
      <div className="p-8 text-center pt-[100px]">
        <p className="text-gray-500 mb-4">Employee not found</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-[#4318FF] text-white rounded-lg"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F7FE] p-4 md:p-8 pt-[80px]">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-white text-[#2B3674] rounded-xl text-sm font-bold shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
        >
          <ChevronLeft size={18} />
          Back to List
        </button>
        <h2 className="text-xl font-bold text-[#2B3674]">
          Employee Timesheet: {employee.fullName || employee.name}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        <MyTimesheet employeeId={employeeId!} readOnly={true} />
      </div>
    </div>
  );
};

export default AdminEmployeeTimesheetWrapper;
