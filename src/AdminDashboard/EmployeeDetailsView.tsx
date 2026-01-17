import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { useEffect } from "react";
import { getEntity, setCurrentUser } from "../reducers/employeeDetails.reducer";
import {
  User,
  Mail,
  Briefcase,
  Building,
  CreditCard,
  ArrowLeft,
} from "lucide-react";

const EmployeeDetailsView = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { entities, entity, loading } = useSelector((state: RootState) => state.employeeDetails);

  useEffect(() => {
    if (employeeId && (!entity || (entity.employeeId !== employeeId && entity.id !== Number(employeeId)))) {
      dispatch(getEntity(employeeId));
    }
  }, [dispatch, employeeId, entity]); // Added entity to dependency array

  const employeeFromList = entities.find(
    (e: any) => (e.employeeId === employeeId || e.id === Number(employeeId))
  );

  const employee = (entity && (entity.employeeId === employeeId || entity.id === Number(employeeId))) 
    ? entity 
    : employeeFromList;

  if (loading && !employee) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-[#4318FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!employee && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="mb-4 text-xl font-bold">Employee not found</p>
        <button
          onClick={() => navigate("/admin-dashboard/employees")}
          className="px-6 py-2 bg-[#4318FF] text-white rounded-xl shadow-lg hover:bg-[#3311CC] transition-all"
        >
          Back to Employee List
        </button>
      </div>
    );
  }

  const avatarLetter = (employee.fullName || employee.name || "?").charAt(0).toUpperCase();

  return (
    <div className="px-4 md:px-8 pt-6 pb-8 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 space-y-3">
      {/* Navigation Back */}
      <div className="flex items-center mb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-[#4318FF] transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold tracking-wide">Back to employee list</span>
        </button>
      </div>

      {/* Top Card - User Header with Gradient */}
      <div className="relative overflow-hidden rounded-[24px] shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100">
        {/* Gradient Background */}
        <div
          className="absolute inset-0 opacity-100"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10 p-4 flex flex-col md:flex-row items-center md:items-start gap-5">
           {/* Avatar Area */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-1 rounded-full bg-white shadow-xl">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4318FF] to-[#00A3C4] flex items-center justify-center text-white text-3xl font-black shadow-inner">
                {avatarLetter}
              </div>
            </div>
          </div>

          <div className="text-center md:text-left flex-1 mt-1">
            <h1 className="text-2xl font-black text-white mb-0.5">
              {employee.fullName || employee.name || ""}
            </h1>
            <p className="text-white/90 font-semibold text-base mb-3">
              {employee.designation || "Employee"}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-white/80">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                <Building size={14} />
                <span className="font-medium">InvenTech INFO SOLUTIONS</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                <CreditCard size={14} />
                <span className="font-medium">
                  {employee.employeeId || employee.id || ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="bg-white rounded-[24px] p-6 shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-purple-200">
            <User size={20} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#1B2559]">
            Personal Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Full Name
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={employee.fullName || employee.name || ""}
                className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="text-[#667eea] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Employee ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Employee ID
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={employee.employeeId || employee.id || ""}
                className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <CreditCard className="text-[#764ba2] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Department
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={employee.department || "IT"}
                className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <Building className="text-[#05CD99] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Designation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Designation
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={employee.designation || ""}
                className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center" >
                <Briefcase className="text-[#FFB020] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Email Address
            </label>
            <div className="relative group">
              <input
                type="email"
                disabled
                value={employee.email || ""}
                className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                <Mail className="text-[#EE5D50] w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsView;
