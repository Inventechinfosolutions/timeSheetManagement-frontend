import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { resetPasswordEmployee, clearResetPasswordState } from '../reducers/public.reducer';
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { message } from 'antd';
import inventechLogo from '../assets/inventech-logo.jpg';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const token = searchParams.get('token');
  const loginId = searchParams.get('loginId');
  
  const { 
    resetPasswordLoading, 
    resetPasswordError,
    resetPasswordResponse
  } = useSelector((state: RootState) => state.public);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearResetPasswordState());
    };
  }, [dispatch]);

  // Handle success
  // useEffect(() => {
  //   if (resetPasswordResponse?.success) {
  //     setTimeout(() => {
  //       navigate('/landing');
  //     }, 3000);
  //   }
  // }, [resetPasswordResponse, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!token) {
      setLocalError('Invalid or missing reset token.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    console.log("Submitting reset password", { token, password: newPassword });
    try {
      await dispatch(resetPasswordEmployee({ token, password: newPassword })).unwrap();
    } catch (err) {
      console.error("Failed to reset password", err);
      setLocalError("Failed to reset password. Please try again or request a new link.");
    }
  };

  if (resetPasswordResponse?.success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#1c9cc0] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2"></div>
        </div>

        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Password Reset!</h2>
          <p className="text-blue-100 mb-8 opacity-90 leading-relaxed">
            Your password has been successfully updated. <br />
            Redirecting you to login page...
          </p>
          <button
            onClick={() => navigate('/landing')}
            className="w-full bg-white text-[#1c9cc0] font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-50 transition-all duration-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#1c9cc0] relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2"></div>
        </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <button
          onClick={() => navigate('/landing')}
          className="absolute left-6 top-6 text-blue-100 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft size={16} /> BACK
        </button>

        <div className="text-center mb-8 mt-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl p-2 mx-auto mb-4 flex items-center justify-center">
             <img src={inventechLogo} alt="Logo" className="w-full h-full object-contain mix-blend-multiply opacity-90 rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-blue-100 text-sm opacity-90">
            {loginId ? `Set a new password for ${loginId}` : 'Create a new secure password'}
          </p>
        </div>

        {(localError || resetPasswordError) && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-white text-xs font-semibold text-center flex items-center justify-center gap-2">
            <AlertCircle size={16} />
            <span>{localError || resetPasswordError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-blue-100 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-3.5 bg-white/90 border border-transparent focus:border-white/50 rounded-xl text-gray-900 text-sm placeholder:text-gray-400"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1c9cc0]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-blue-100 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-10 py-3.5 bg-white/90 border border-transparent focus:border-white/50 rounded-xl text-gray-900 text-sm placeholder:text-gray-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={resetPasswordLoading}
              className="w-full bg-white text-[#1c9cc0] font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-6 hover:bg-blue-50 transition-colors"
            >
              {resetPasswordLoading ? <Loader2 className="animate-spin" /> : 'RESET PASSWORD'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
