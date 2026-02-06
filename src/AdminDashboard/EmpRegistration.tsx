import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Briefcase,
  Building,
  CreditCard,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import {
  createEntity,
  reset,
  fetchDepartments,
  fetchRoles,
} from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";

const Registration = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, updateSuccess, errorMessage, entity, departments, roles } =
    useAppSelector((state: RootState) => state.employeeDetails);

  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "",
    department: "",
    role: "",
    designation: "",
    employmentType: "" as "" | "FULL_TIMER" | "INTERN",
    email: "",
  });
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchRoles());
  }, [dispatch]);

  useEffect(() => {
    if (updateSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        const navigationState = {
          email: formData.email,
          loginId: entity?.employeeId || formData.employeeId,
          employeeId: entity?.id,
          password: "",
          activationLink: "",
        };
        dispatch(reset());
        setShowSuccess(false);
        setFormData({
          fullName: "",
          employeeId: "",
          department: "",
          role: "",
          designation: "",
          employmentType: "",
          email: "",
        });
        navigate("/admin-dashboard/activation-success", {
          state: navigationState,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (errorMessage) {
      setError(errorMessage);
    }
  }, [updateSuccess, errorMessage, dispatch, navigate, formData, entity]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "employeeId"
          ? value.toUpperCase()
          : name === "employmentType"
            ? (value as "" | "FULL_TIMER" | "INTERN")
            : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const requiredKeys = ["fullName", "employeeId", "department", "role", "designation", "email"];
    if (requiredKeys.some((k) => !(formData as Record<string, unknown>)[k])) {
      setError("Please fill in all required fields");
      return;
    }

    const submissionData: Record<string, unknown> = {
      ...formData,
    };
    if (!formData.employmentType) delete submissionData.employmentType;
    console.log("Submitting Registration Data:", submissionData);
    dispatch(createEntity(submissionData));
  };

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 font-sans text-gray-800 relative pb-20">
      <div className="w-full max-w-4xl mb-6">
        <button
          onClick={() => navigate("/admin-dashboard/timesheet-list")}
          className="flex items-center gap-2 text-gray-400 hover:text-[#4318FF] transition-colors group"
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

      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-visible mb-8">
        <div className="w-full bg-white px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Create an Employee Account
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm">
              Create an employee account and manage their workforce efficiently.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          {showSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-500 shadow-sm">
              <div className="bg-emerald-100 p-2 rounded-full shadow-sm">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  Account Created Successfully!
                </p>
                <p className="text-[11px] opacity-80 leading-tight mt-0.5">
                  The employee can now login with their credentials. Form reset
                  for next entry.
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            autoComplete="off"
          >
            <div className="border border-gray-100 rounded-2xl p-5 sm:p-8 shadow-sm bg-gray-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">
                    Full Name
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] outline-none transition-all placeholder-gray-300 text-gray-700 text-sm font-medium"
                      value={formData.fullName}
                      onChange={handleChange}
                      autoComplete="nope"
                      required
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">
                    Employee ID
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      name="employeeId"
                      placeholder="EMP-1234"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] outline-none transition-all placeholder-gray-300 text-gray-700 text-sm font-medium"
                      value={formData.employeeId}
                      onChange={handleChange}
                      onInput={(e) =>
                        (e.currentTarget.value =
                          e.currentTarget.value.toUpperCase())
                      }
                      pattern="[A-Z0-9-]*"
                      title="Employee ID should contain only uppercase letters, numbers, and hyphens"
                      autoComplete="nope"
                      required
                    />
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">
                    Department
                  </label>
                  <div className="relative group">
                    <select
                      name="department"
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] outline-none transition-all text-gray-700 text-sm font-medium appearance-none bg-white"
                      value={formData.department}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">
                    Role
                  </label>
                  <div className="relative group">
                    <select
                      name="role"
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] outline-none transition-all text-gray-700 text-sm font-medium appearance-none bg-white"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">
                    Designation
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      name="designation"
                      placeholder="Senior Developer"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] outline-none transition-all placeholder-gray-300 text-gray-700 text-sm font-medium"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                    />
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">
                    Employment type (leave balance)
                  </label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] outline-none transition-all text-gray-700 text-sm font-medium bg-white"
                  >
                    <option value="">Not set (infer from designation)</option>
                    <option value="FULL_TIMER">Full timer (18 leaves/year)</option>
                    <option value="INTERN">Intern (12 leaves/year)</option>
                  </select>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    placeholder="john.doe@inventech.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] outline-none transition-all placeholder-gray-300 text-gray-700 text-sm font-medium"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden bg-linear-to-r from-[#4318FF] to-[#868CFF] text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 text-sm sm:text-base transform hover:-translate-y-1 group disabled:opacity-70 disabled:cursor-not-allowed tracking-widest uppercase active:scale-95"
              >
                {/* Shimmer Effect */}
                {!loading && (
                  <div className="absolute inset-0 w-[200%] h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
                )}

                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      CREATING...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </span>
              </button>
            </div>

            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}</style>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;
