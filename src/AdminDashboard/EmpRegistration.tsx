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
} from "lucide-react";
import { createEntity, reset } from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";

const Registration = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, updateSuccess, errorMessage, entity } = useAppSelector(
    (state: RootState) => state.employeeDetails
  );

  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "",
    department: "",
    designation: "",
    email: "",
    // password: "",
    // confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (updateSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        const navigationState = {
          email: formData.email,
          loginId: entity?.employeeId || formData.employeeId,
          employeeId: entity?.id, // Pass internal ID for credential generation
          // Password and link will be generated on the next screen
          password: "",
          activationLink: "",
        };
        dispatch(reset());
        setShowSuccess(false);
        // Reset form data to allow creating another employee
        setFormData({
          fullName: "",
          employeeId: "",
          department: "",
          designation: "",
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic Validation
    if (Object.values(formData).some((val) => !val)) {
      setError("Please fill in all fields");
      return;
    }

    // if (formData.password !== formData.confirmPassword) {
    //   setError("Passwords do not match");
    //   return;
    // }

    const submissionData = {
      ...formData,
    };
    console.log("Submitting Registration Data:", submissionData);
    dispatch(createEntity(submissionData));
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 font-sans text-gray-800 lg:p-4 lg:pt-0 relative">
      {/* Back Button */}
      <div className="w-full max-w-4xl mb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium group"
        >
          <span>Back</span>
        </button>
      </div>
      {/* Main Card - Full Width Registration */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Form Container */}
        <div className="w-full bg-white px-8 py-4 lg:px-12 lg:py-6 flex flex-col justify-center h-full overflow-hidden">
          <div className="mb-3">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Create an Employee Account
            </h2>
            <p className="text-gray-400 text-xs">
              Create an employee account and manage their workforce efficiently.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          {showSuccess && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-500 shadow-sm">
              <div className="bg-emerald-100 p-1.5 rounded-full">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  Account Created Successfully!
                </p>
                <p className="text-[10px] opacity-80">
                  The employee can now login with their credentials. Form reset
                  for next entry.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Inner Card wrapping inputs */}
            <div className="border border-gray-100 rounded-2xl p-4 shadow-sm bg-white/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">
                    Full Name
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="John Doe"
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Employee ID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">
                    Employee ID
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      name="employeeId"
                      placeholder="EMP-1234"
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                      value={formData.employeeId}
                      onChange={handleChange}
                      required
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">
                    Department
                  </label>
                  <div className="relative group">
                    <select
                      name="department"
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#00A3C4] focus:border-[#00A3C4] outline-none transition-all text-gray-700 text-xs appearance-none bg-white"
                      value={formData.department}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Select Department
                      </option>
                      <option value="HR">HR</option>
                      <option value="IT">IT</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                    </select>
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* Designation */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">
                    Designation
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      name="designation"
                      placeholder="Senior Developer"
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#00A3C4] focus:border-[#00A3C4] outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                    />
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1 mb-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    placeholder="john.doe@inventech.com"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-1">
                  {/* <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">
                    Password
                  </label> */}
                  <div className="relative group">
                    {/* <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#00A3C4] focus:border-[#00A3C4] outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    /> */}
                    {/* <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" /> */}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  {/* <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">
                    Confirm Password
                  </label> */}
                  <div className="relative group">
                    {/* <input
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#00A3C4] focus:border-[#00A3C4] outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    /> */}
                    {/* <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" /> */}
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex gap-4 mt-6 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden bg-linear-to-r from-[#4318FF] to-[#868CFF] text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 text-[10px] transform hover:-translate-y-0.5 group disabled:opacity-70 disabled:cursor-not-allowed tracking-widest uppercase"
              >
                {/* Shimmer Effect */}
                {!loading && (
                  <div className="absolute inset-0 w-[200%] h-full bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
                )}

                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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
