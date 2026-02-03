import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Eye, EyeOff, Lock, Zap } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { setCurrentUser } from "../reducers/employeeDetails.reducer";
import { loginUser, clearError, UserType } from "../reducers/user.reducer";
import loginVisual from "../assets/login_visual.png";
import inventLogo from "../assets/invent-logo.svg";
import LandingMobile from "./LandingMobile";

const Landing = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Single State for Login
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redux state
  const { loading, isAuthenticated, currentUser, error } = useAppSelector(
    (state) => state.user,
  );

  // Effect for Redirect
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (Number(currentUser.resetRequired) === 1) {
        navigate("/timesheet/reset-password");
      } else if (
        currentUser.userType?.toUpperCase() === UserType.MANAGER ||
        (currentUser.role && currentUser.role.toUpperCase().includes("MANAGER"))
      ) {
        navigate("/manager-dashboard");
      } else if (currentUser.userType?.toUpperCase() === UserType.ADMIN) {
        navigate("/admin-dashboard");
      } else if (currentUser.userType?.toUpperCase() === UserType.EMPLOYEE) {
        navigate("/employee-dashboard");
      }
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Clear admin errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    dispatch(clearError());

    try {
      const resultAction = await dispatch(loginUser({ loginId, password }));
      if (loginUser.fulfilled.match(resultAction)) {
        // Success!
        localStorage.setItem("userLoginId", loginId);
        dispatch(setCurrentUser({ employeeId: loginId }));
        // Effect will handle redirect
      } else {
        console.log(
          "Admin login failed or user is not admin. Proceeding as Employee.",
        );
        // Set employee context for dashboard components
        localStorage.setItem("userLoginId", loginId);
        dispatch(setCurrentUser({ employeeId: loginId }));
      }
    } catch (err) {
      console.error("Login attempt failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#EFEBF5] relative overflow-hidden font-sans">
      {/* Page Background Shapes from Design */}
      <div className="absolute top-[-5%] left-[5%] w-48 h-48 bg-[#585CE5] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-40"></div>

      {/* Main Container */}
      <LandingMobile
        loginId={loginId}
        setLoginId={setLoginId}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        handleLogin={handleLogin}
        isSubmitting={isSubmitting}
        loading={loading}
        error={error}
      />
      <div className="hidden md:flex w-full max-w-[1100px] h-auto min-h-[600px] bg-white rounded-[18px] shadow-2xl overflow-hidden flex-col md:flex-row animate-in fade-in zoom-in-95 duration-500 relative z-10">
        {/* LEFT SIDE - LOGIN FORM */}
        <div className="w-full md:w-[45%] p-10 md:p-14 flex flex-col justify-center relative bg-white z-10">
          <div className="mb-10 text-center">
            <img
              src={inventLogo}
              alt="Invent Logo"
              className="h-16 mx-auto mb-5 animate-fade-in-up"
            />
            <h1 className="text-3xl font-black text-[#2D3748] mb-2 tracking-tight animate-fade-in-up animation-delay-100">
              LOGIN
            </h1>
            <p className="text-gray-400 text-[13px] font-medium tracking-wide animate-fade-in-up animation-delay-200">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 animate-fade-in-up animation-delay-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              {/* Username Input */}
              <div className="relative group animate-fade-in-up animation-delay-300">
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full pl-12 pr-4 py-4 bg-[#F0F2F5] border-none rounded-2xl text-[#4A5568] placeholder-gray-400 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:bg-[#E8EAED] transition-all duration-200 font-semibold"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User className="text-gray-400 h-5 w-5" />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative group animate-fade-in-up animation-delay-400">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-4 bg-[#F0F2F5] border-none rounded-2xl text-[#4A5568] placeholder-gray-400 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:bg-[#E8EAED] transition-all duration-200 font-semibold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className="text-gray-400 h-5 w-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex justify-end animate-fade-in-up animation-delay-500">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="cursor-pointer text-xs font-bold text-[#A0AEC0] hover:text-[#6C63FF] transition-colors mt-1"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading || !loginId || !password}
              className="w-full bg-[#6C63FF] hover:bg-[#5a52d5] text-white font-bold py-4 rounded-xl shadow-[0_10px_20px_-10px_rgba(108,99,255,0.5)] active:scale-[0.98] transition-all duration-200 mt-4 disabled:opacity-45 disabled:cursor-not-allowed text-sm tracking-wide cursor-pointer animate-fade-in-up animation-delay-600"
            >
              {isSubmitting || loading ? "Authenticating..." : "Login Now"}
            </button>
          </form>
        </div>

        {/* RIGHT SIDE - VISUAL */}
        <div className="hidden md:flex md:w-[55%] bg-[#6C63FF] relative items-center justify-center p-12 overflow-hidden animate-fade-in-up animation-delay-200">
          {/* Background Patterns for Right Panel */}
          <div className="absolute inset-0">
            <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[100%] border-[60px] border-white/5 rounded-full animate-[spin_120s_linear_infinite]"></div>
            <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] border-[40px] border-white/5 rounded-full animate-[spin_80s_linear_infinite_reverse]"></div>
          </div>

          {/* Glass Card Container for Image */}
          <div className="relative z-10 w-[320px] h-[440px] rounded-[32px] border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center overflow-hidden transform hover:scale-105 transition-transform duration-700">
            {/* Actual Image */}
            <div className="absolute inset-3 rounded-[24px] overflow-hidden shadow-inner">
              <img
                src={loginVisual}
                alt="Login Visual"
                className="w-full h-full object-cover transform scale-110"
              />
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#6C63FF]/50 via-transparent to-transparent pointer-events-none"></div>
          </div>

          {/* Floating 'Zap' Icon */}
          <div className="absolute bottom-[20%] right-[20%] w-16 h-16 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center animate-bounce duration-[3000ms] z-20">
            <Zap className="text-[#F6AD55] h-7 w-7 fill-current drop-shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
