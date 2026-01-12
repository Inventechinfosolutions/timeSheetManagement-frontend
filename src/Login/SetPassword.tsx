import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { resetPasswordEmployee, clearResetPasswordState } from '../reducers/public.reducer';
import { AppDispatch, RootState } from '../store';
import inventechLogo from '../assets/inventech-logo.jpg';

interface LocationState {
  employeeId?: string;
  loginId?: string;
  isFirstLogin?: boolean;
  token?: string;
}

const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const state = location.state as LocationState | undefined;
  
  const { 
    resetPasswordLoading, 
    resetPasswordError, 
    resetPasswordResponse 
  } = useSelector((state: RootState) => state.public);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  // Cleanup reset password state on unmount
  useEffect(() => {
    return () => {
      dispatch(clearResetPasswordState());
    };
  }, [dispatch]);

  // Handle successful password reset
  useEffect(() => {
    if (resetPasswordResponse?.success) {
      setSuccess(true);
      const timer = setTimeout(() => {
        navigate('/landing');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [resetPasswordResponse, navigate]);

  // Password requirements
  const requirements = [
    { label: 'At least 8 characters or more', met: password.length >= 8 },
    { label: 'Include uppercase and lowercase letters, numbers, and symbols', met: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(password) },
    { label: 'Avoid using familiar names, common words, or predictable phrases', met: password.length >= 8 && !/^(password|123456|qwerty)/i.test(password) },
    { label: 'Max 20 character can be used', met: password.length <= 20 },
  ];

  const isValidPassword = requirements.every(r => r.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!isValidPassword) {
      setLocalError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setLocalError('Passwords do not match');
      return;
    }

    if (!state?.token) {
      setLocalError('Active token is missing. Please use a valid activation link.');
      return;
    }

    dispatch(resetPasswordEmployee({
      token: state.token,
      newPassword: password,
    }));
  };

  // Success State
  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Set Successfully!</h2>
          <p className="text-gray-500 text-sm mb-4">Redirecting to login page...</p>
          <Loader2 className="w-6 h-6 text-[#1c9cc0] animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Logo */}
        <div className="w-16 h-16 bg-gray-50 rounded-xl p-2 mx-auto mb-6 border border-gray-100 shadow-sm flex items-center justify-center">
          <img
            src={inventechLogo}
            alt="Logo"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Your Password</h2>
          <p className="text-gray-500 text-sm">Create a secure password to complete your account setup.</p>
        </div>

        {/* Error Message */}
        {(localError || resetPasswordError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-in fade-in duration-300">
            {localError || resetPasswordError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <span className="text-red-500">*</span> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c9cc0]/20 focus:border-[#1c9cc0] outline-none transition-all text-gray-900 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <span className="text-red-500">*</span> Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c9cc0]/20 focus:border-[#1c9cc0] outline-none transition-all text-gray-900 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={resetPasswordLoading || !isValidPassword || !passwordsMatch}
            className="w-full bg-[#1c9cc0] hover:bg-[#178ba8] text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {resetPasswordLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting Password...
              </>
            ) : (
              'SET PASSWORD'
            )}
          </button>
        </form>

        {/* Password Requirements Note */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2">Note:</p>
          <ul className="space-y-1">
            {requirements.map((req, index) => (
              <li
                key={index}
                className={`text-xs flex items-start gap-2 ${
                  password ? (req.met ? 'text-green-600' : 'text-red-500') : 'text-gray-500'
                }`}
              >
                <span className="mt-0.5">{index + 1}.</span>
                <span>{req.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
