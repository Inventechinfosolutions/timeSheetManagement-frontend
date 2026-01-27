import { User, Eye, EyeOff, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import inventLogo from "../assets/invent-logo.svg";

interface LandingMobileProps {
  loginId: string;
  setLoginId: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  handleLogin: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  loading: boolean;
  error: string | null | undefined;
}

const LandingMobile = ({
  loginId,
  setLoginId,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  handleLogin,
  isSubmitting,
  loading,
  error,
}: LandingMobileProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex w-full flex-col justify-center bg-white p-8 md:hidden mb-20 rounded-[15px] ">
      <div className="mb-10 text-center">
            <img
              src={inventLogo}
              alt="Invent Logo"
              className="h-16 mx-auto mb-5"
            />
        <h1 className="mb-2 text-3xl font-black tracking-tight text-[#2D3748]">
          LOGIN
        </h1>
        <p className="text-[13px] font-medium tracking-wide text-gray-400">
          Enter your credentials to access the dashboard
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 slide-in-from-top-2 animate-in rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-5">
          {/* Username Input */}
          <div className="group relative">
            <input
              type="text"
              placeholder="Username"
              className="w-full rounded-2xl border-none bg-[#F0F2F5] py-4 pl-12 pr-4 text-sm font-semibold text-[#4A5568] placeholder-gray-400 transition-all duration-200 focus:bg-[#E8EAED] focus:ring-2 focus:ring-[#6C63FF]/20"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <User className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Password Input */}
          <div className="group relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full rounded-2xl border-none bg-[#F0F2F5] py-4 pl-12 pr-12 text-sm font-semibold text-[#4A5568] placeholder-gray-400 transition-all duration-200 focus:bg-[#E8EAED] focus:ring-2 focus:ring-[#6C63FF]/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="cursor-pointer text-xs font-bold text-[#A0AEC0] transition-colors hover:text-[#6C63FF] mt-1"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="mt-4 w-full rounded-xl bg-[#6C63FF] py-4 text-sm font-bold tracking-wide text-white shadow-[0_10px_20px_-10px_rgba(108,99,255,0.5)] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
        >
          {isSubmitting || loading ? "Authenticating..." : "Login Now"}
        </button>
      </form>
    </div>
  );
};

export default LandingMobile;
