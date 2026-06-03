import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Eye, EyeOff, Lock, ShieldCheck, ArrowRight } from "lucide-react";
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
  const skipSplashFromQuery =
    new URLSearchParams(location.search).get("skipSplash") === "true";
  const shouldSkipSplash = skipSplashFromState || skipSplashFromQuery;

  const [showSplash, setShowSplash] = useState(!shouldSkipSplash);
  const [splashExiting, setSplashExiting] = useState(false);

  // Single State for Login (Functional)
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redux state
  const { loading, isAuthenticated, currentUser, error } = useAppSelector(
    (state) => state.user,
  );

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Effect for Redirect
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (Number(currentUser.resetRequired) === 1) {
        navigate("/timesheet/reset-password");
      } else if (
        currentUser.userType?.toUpperCase() === UserType.MANAGER ||
        (currentUser.role &&
          currentUser.role.toUpperCase().includes(UserType.MANAGER))
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F4F6] relative overflow-hidden font-sans p-2 sm:p-4 select-none">
      {/* Self-contained Font Styling */}
      <style>{`
        .font-serif {
          font-family: 'Playfair Display', Georgia, serif;
        }
        .font-sans {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        }
      `}</style>

      {/* Decorative background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-200/40 filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-200/40 filter blur-[120px] pointer-events-none"></div>

      {/* Loader Splash Screen */}
      {showSplash && (
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-500 ease-out"
          style={{ opacity: splashExiting ? 0 : 1 }}
        >
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 filter blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 filter blur-[120px] animate-pulse" />
          <SplashVideo onComplete={handleSplashComplete} />
        </div>
      )}

      {!showSplash && (
        <div className="w-full max-w-[420px] md:max-w-[960px] h-auto md:h-[580px] bg-[#FCFCFE] md:bg-gradient-to-br md:from-[#006CF1] md:to-[#0051B8] rounded-[24px] sm:rounded-[32px] flex flex-col md:flex-row overflow-hidden relative z-10 md:items-stretch shadow-[0_15px_50px_rgba(0,0,0,0.05)] md:shadow-none">
          
          <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute left-[188px] -top-24 w-[340px] h-[340px] rounded-full bg-gradient-to-br from-[#005ECF] to-[#003B8C] shadow-2xl opacity-80"></div>
            <div className="absolute left-[184px] -bottom-24 w-[240px] h-[240px] rounded-full bg-gradient-to-br from-[#0058C4] to-[#00357F] shadow-2xl opacity-90"></div>
            <div className="absolute -left-20 -bottom-20 w-[200px] h-[200px] rounded-full bg-gradient-to-br from-[#0052B8] to-[#002F73] shadow-2xl opacity-90"></div>
          </div>

          {/* LEFT SIDE: New Abstract Blue Layered Spheres Design */}
          <div className="hidden md:flex md:w-[45%] flex-col justify-between p-6 sm:p-8 md:p-10 text-white relative min-h-[340px] md:h-full md:self-stretch bg-transparent z-10">
            <div className="relative z-10"></div>
            <div className="my-auto py-4 sm:py-6 relative z-10 flex flex-col items-start justify-center text-left w-full">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide text-white uppercase mb-4 font-sans">
                WorkSphere
              </h1>
              <p className="text-white/80 font-sans text-xs sm:text-sm max-w-[280px] sm:max-w-xs leading-relaxed">
                Streamline your time management, log daily tasks, and track
                attendance seamlessly with our modern enterprise platform.
              </p>
            </div>

            <div className="relative z-10 text-[8px] font-black tracking-[0.2em] uppercase text-white/70 flex justify-center md:justify-start gap-4">
              <span>POWERED BY INVENTECH INFO SOLUTIONS</span>
            </div>
          </div>

          <div className="w-full md:w-[55%] bg-[#FCFCFE] md:rounded-l-[60px] lg:rounded-l-[80px] flex flex-col justify-center p-6 sm:p-10 md:p-12 relative z-20 min-h-[340px] md:h-[calc(100%+2px)] md:self-stretch md:-mt-[1px] md:-mb-[1px]">
            <div className="mb-8 relative flex flex-col items-center text-center">
              <div className="mb-6  backdrop-blur-md px-5 py-2 inline-flex items-center gap-3 hover:scale-[1.02] transition-all duration-300">
                <img
                  src={workspherelogo}
                  alt="WorkSphere"
                  className="h-20 w-auto"
                />
              </div>
              <p className="text-gray-400 text-xs sm:text-sm font-medium">
                Enter your credentials to access your dashboard.
              </p>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-semibold w-full text-center animate-in fade-in duration-200">
                {error}
              </div>
            )}

            <div className="w-full max-w-[420px] mx-auto relative">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5 group">
                  <label className="text-xs font-bold text-gray-500 tracking-wide ml-0.5">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter corporate ID"
                      className="w-full pl-11 pr-4 py-3.5 bg-[#F9F9FB] border border-gray-200/80 rounded-xl focus:bg-white focus:border-[#006CF1] focus:ring-4 focus:ring-[#006CF1]/10 transition-all text-gray-800 placeholder-gray-400/80 text-xs font-semibold focus:outline-none"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      required
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#006CF1] transition-colors">
                      <User size={16} />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-0.5">
                    <label className="text-xs font-bold text-gray-500 tracking-wide">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="cursor-pointer text-xs font-bold text-[#006CF1] hover:text-[#0051B8] transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter security password"
                      className="w-full pl-11 pr-10 py-3.5 bg-[#F9F9FB] border border-gray-200/80 rounded-xl focus:bg-white focus:border-[#006CF1] focus:ring-4 focus:ring-[#006CF1]/10 transition-all text-gray-800 placeholder-gray-400/80 text-xs font-semibold focus:outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#006CF1] transition-colors">
                      <Lock size={16} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || loading || !loginId || !password}
                  className="w-full max-w-[410px] mx-auto bg-[#006CF1] hover:bg-[#0051B8] text-white font-bold py-3.5 rounded-xl shadow-[0_8px_20px_-4px_rgba(0,108,241,0.4)] transition-all duration-200 active:scale-[0.98] mt-6 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none text-xs tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmitting || loading ? "Authorizing..." : "Login"}
                  {!isSubmitting && !loading && <ArrowRight size={13} />}
                </button>
              </form>
            </div>

            {/* Portal security footer */}
            <div className="pt-8 border-t border-gray-100 flex items-center justify-center lg:justify-start gap-2 text-[9px] text-gray-400 font-extrabold uppercase tracking-widest mt-8">
              <ShieldCheck size={14} className="text-gray-300" />
              <span>Authorized personnel only</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
