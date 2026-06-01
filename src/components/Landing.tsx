import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { setCurrentUser } from "../reducers/employeeDetails.reducer";
import { loginUser, clearError } from "../reducers/user.reducer";
import { UserType } from "../enums";
import workspherelogo from "../assets/worksphere_white.svg";
import SplashVideo from "./SplashVideo";

const SPLASH_HOLD_AFTER_WELCOME_MS = 0;
const SPLASH_FADEOUT_MS = 400;

const Landing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Check if splash should be skipped
  const skipSplashFromState = location.state?.skipSplash;
  const skipSplashFromQuery = new URLSearchParams(location.search).get("skipSplash") === "true";
  const shouldSkipSplash = skipSplashFromState || skipSplashFromQuery;

  const [showSplash, setShowSplash] = useState(!shouldSkipSplash);
  const [splashExiting, setSplashExiting] = useState(false);

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
        (currentUser.role && currentUser.role.toUpperCase().includes(UserType.MANAGER))
      ) {
        navigate("/manager-dashboard");
      } else if (
        currentUser.userType?.toUpperCase() === UserType.ADMIN ||
        currentUser.userType?.toUpperCase() === UserType.RECEPTIONIST
      ) {
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
        localStorage.setItem("userLoginId", loginId);
        dispatch(setCurrentUser({ employeeId: loginId }));
      } else {
        console.log(
          "Admin login failed or user is not admin. Proceeding as Employee.",
        );
        localStorage.setItem("userLoginId", loginId);
        dispatch(setCurrentUser({ employeeId: loginId }));
      }
    } catch (err) {
      console.error("Login attempt failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSplashComplete = () => {
    setTimeout(() => {
      setSplashExiting(true);
      setTimeout(() => setShowSplash(false), SPLASH_FADEOUT_MS);
    }, SPLASH_HOLD_AFTER_WELCOME_MS);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-[#EFF6FF] via-[#F5F3FF] to-[#FFF1F2] relative overflow-hidden font-sans p-4 select-none">

      {/* Self-contained Floating Keyframe Animations */}
      <style>{`
        @keyframes float-orb-1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(35px, -60px) scale(1.1); }
          66% { transform: translate(-25px, 25px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float-orb-2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, 50px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float-orb-3 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(50px, 35px) scale(0.95); }
          66% { transform: translate(-35px, -50px) scale(1.05); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .premium-gradient-border-card {
          border: 2px solid transparent !important;
          background-image: linear-gradient(to bottom, #ffffff, #ffffff), 
                            linear-gradient(to top right, #22d3ee, #3b82f6, #6366f1, #a855f7) !important;
          background-origin: border-box !important;
          -webkit-background-clip: padding-box, border-box !important;
          background-clip: padding-box, border-box !important;
        }
      `}</style>

      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      {/* Large Drifting Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-sky-400/25 to-blue-500/25 filter blur-[110px] pointer-events-none animate-[float-orb-1_22s_infinite_alternate_ease-in-out]"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-purple-400/20 to-pink-500/20 filter blur-[120px] pointer-events-none animate-[float-orb-2_26s_infinite_alternate_ease-in-out]"></div>
      <div className="absolute top-[30%] right-[20%] w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-cyan-300/18 to-teal-400/18 filter blur-[100px] pointer-events-none animate-[float-orb-3_19s_infinite_alternate_ease-in-out]"></div>

      {/* Loader Splash Screen */}
      {showSplash && (
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-500 ease-out"
          style={{ opacity: splashExiting ? 0 : 1 }}
        >
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 filter blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 filter blur-[120px] animate-pulse" />
          <SplashVideo onComplete={handleSplashComplete} />
        </div>
      )}

      {/* Elegant Frosted Light Glass Login Card with Glowing Inset Borders */}
      {!showSplash && (
        <div className="w-full max-w-[540px] premium-gradient-border-card backdrop-blur-3xl rounded-[40px] shadow-[0_30px_70px_-15px_rgba(59,130,246,0.18),0_50px_100px_-20px_rgba(15,23,42,0.12)] p-8 md:p-10 relative z-10 transition-all duration-300 animate-in fade-in zoom-in-95 duration-500">

          {/* Top Brand Header */}
          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            <div className="p-[1px] bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-2xl shadow-[0_8px_30px_rgba(59,130,246,0.15)] inline-flex">
              <div className="p-3.5 bg-white rounded-[15px]">
                <img
                  src={workspherelogo}
                  alt="WorkSphere Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600">
                POWERED BY INVENTECH
              </p>
            </div>
            <div className="w-full h-px bg-slate-200/40"></div>
          </div>

          {/* Secure Error Notification */}
          {error && (
            <div className="mt-6 p-3.5 bg-red-50/50 backdrop-blur-md border border-red-100/50 text-red-600 rounded-2xl text-[11px] font-bold animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLogin} className="space-y-5 mt-6">
            <div className="space-y-4">
              {/* Username Input Container */}
              <div className="space-y-1.5 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter corporate ID"
                    className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200/50 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200">
                    <User size={16} />
                  </div>
                </div>
              </div>

              {/* Password Input Container */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="cursor-pointer text-[10px] font-black text-indigo-600 hover:text-indigo-500 uppercase tracking-wider transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter security password"
                    className="w-full pl-11 pr-10 py-3.5 bg-white/50 border border-slate-200/50 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200">
                    <Lock size={16} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Session Row */}
            {/* <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span>Remember session</span>
              </label>

            </div> */}

            <button
              type="submit"
              disabled={isSubmitting || loading || !loginId || !password}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-800 text-white font-bold py-3.5 rounded-2xl shadow-[0_12px_24px_-10px_rgba(37,99,235,0.4)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] mt-6 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none text-[10px] tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting || loading ? "Authorizing..." : "Sign In"}
            </button>
          </form>

          {/* Secure Enterprise Portal Footer */}
          <div className="pt-6 border-t border-slate-200/40 flex items-center justify-center gap-2 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-8">
            <ShieldCheck size={13} className="text-slate-300" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-500">Authorized Personnel Only</span>
          </div>

        </div>
      )}
    </div>
  );
};

export default Landing;
