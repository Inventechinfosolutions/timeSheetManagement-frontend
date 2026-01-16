import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import {
  User,
  Mail,
  Briefcase,
  Building,
  CreditCard,
  Calendar,
  ArrowLeft,
} from "lucide-react";

const EmployeeDetailsView = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { entities } = useSelector((state: RootState) => state.employeeDetails);

  const employee = entities.find(
    (e: any) => (e.employeeId || e.id) === employeeId
  );

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="mb-4">Employee not found</p>
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="text-blue-500 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans text-[#2B3674]">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-[#4318FF] mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to employee list</span>
        </button>
        <h1 className="text-3xl font-bold mb-2">Employee Details</h1>
        <p className="text-gray-500">View Employee Information</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-linear-to-br from-[#4318FF] to-[#00A3C4] flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-blue-500/30">
            {(employee.fullName || employee.name || "?")
              .charAt(0)
              .toUpperCase()}
          </div>
          <h2 className="text-xl font-bold mb-1">
            {employee.fullName || employee.name}
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            {employee.designation || "No Designation"}
          </p>

          <div className="w-full pt-4 border-t border-gray-50 mt-auto">
            {/* <button
              onClick={() =>
                navigate(`/admin-dashboard/timesheet/${employeeId}`)
              }
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#F4F7FE] text-[#4318FF] rounded-xl hover:bg-[#E6FFFA] hover:text-[#00A3C4] transition-all font-semibold text-sm"
            >
              <Calendar size={16} />
              View Timesheet
            </button> */}
          </div>
        </div>

        {/* Details Card */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <User size={20} className="text-[#4318FF]" />
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Full Name
              </span>
              <div className="flex items-center gap-3 text-gray-700 font-medium">
                <User size={16} className="text-gray-400" />
                {employee.fullName || employee.name || "--"}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Employee ID
              </span>
              <div className="flex items-center gap-3 text-gray-700 font-medium">
                <CreditCard size={16} className="text-gray-400" />
                {employee.employeeId || employee.id || "--"}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Department
              </span>
              <div className="flex items-center gap-3 text-gray-700 font-medium">
                <Building size={16} className="text-gray-400" />
                {employee.department || "--"}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Designation
              </span>
              <div className="flex items-center gap-3 text-gray-700 font-medium">
                <Briefcase size={16} className="text-gray-400" />
                {employee.designation || "--"}
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Email Address
              </span>
              <div className="flex items-center gap-3 text-gray-700 font-medium">
                <Mail size={16} className="text-gray-400" />
                {employee.email || "--"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsView;
