import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Eye, EyeOff, Lock } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { setCurrentUser } from "../reducers/employeeDetails.reducer";
import { loginUser, clearError } from "../reducers/user.reducer";
import inventechLogo from "../assets/inventech-logo.jpg";

const Landing = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Single State for Login
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redux state for Admin
  const { loading: adminLoading, isAuthenticated: adminIsAuthenticated } = useAppSelector(
    (state) => state.user
  );

  // Effect for Admin Redirect
  useEffect(() => {
    if (adminIsAuthenticated) {
      navigate("/admin-dashboard");
    }
  }, [adminIsAuthenticated, navigate]);

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
      // 1. Attempt Admin Login via API
      const resultAction = await dispatch(loginUser({ loginId, password }));

      if (loginUser.fulfilled.match(resultAction)) {
        // Success! Effect will handle redirect to /admin-dashboard
      } else {
        // 2. Fallback to Employee Login (Mock Mode) if Admin fails
        // In a real app, we'd check error codes (e.g., 404 User Not Found vs 401 Bad Password).
        // Here, we assume if it's not a valid Admin, it might be an Employee.
        // We preserve the existing "Employee Login doesn't check password" prototype behavior.
        
        console.log("Admin login failed or user is not admin. Proceeding as Employee.");
        dispatch(setCurrentUser({ employeeId: loginId }));
        navigate("/employee-dashboard");
      }
    } catch (err) {
      // Fallback constraint
      dispatch(setCurrentUser({ employeeId: loginId }));
      navigate("/employee-dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#1c9cc0] relative overflow-hidden">
       {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2"></div>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo & Header */}
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-white/20 rounded-2xl p-2 mx-auto mb-4 border border-white/30 shadow-inner flex items-center justify-center">
             <img
              src={inventechLogo}
              alt="Logo"
              className="w-full h-full object-contain mix-blend-multiply opacity-90 rounded-xl"
             />
           </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-blue-100 text-sm font-medium opacity-90">
             Enter your credentials to access the dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
           <div className="space-y-1.5">
            <label className="text-xs font-bold text-blue-100 uppercase tracking-wider ml-1">
              Login ID
            </label>
            <div className="relative group">
              <input
                type="text"
                placeholder="User ID"
                 className="w-full pl-10 pr-4 py-3 bg-white/90 border border-transparent focus:border-white/50 rounded-xl focus:ring-0 text-gray-900 placeholder-gray-500 text-sm transition-all shadow-inner focus:bg-white"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4.5 h-4.5 group-focus-within:text-[#1c9cc0] transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-blue-100 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative group">
               <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                 className="w-full pl-10 pr-10 py-3 bg-white/90 border border-transparent focus:border-white/50 rounded-xl focus:ring-0 text-gray-900 placeholder-gray-500 text-sm transition-all shadow-inner focus:bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4.5 h-4.5 group-focus-within:text-[#1c9cc0] transition-colors" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
             <div className="flex justify-end">
                <button type="button" onClick={() => navigate("/forgot-password")} className="text-[11px] text-blue-100 hover:text-white transition-colors hover:underline">
                  Forgot Password?
                </button>
             </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || adminLoading}
            className="w-full bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all duration-200 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting || adminLoading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Landing;
