import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle, Shield, Search, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { Modal, Input, message } from 'antd';
import inventechLogo from '../assets/inventech-logo.jpg';
import { useAppSelector, useAppDispatch } from '../hooks';
import { getEntities, setCurrentUser } from '../reducers/employeeDetails.reducer';
import { forgotPasswordOtp, verifyOtp, resetPasswordOtp, clearAllPublicState, clearOtpState } from '../reducers/public.reducer';

type ResetStep = 'ID' | 'EMAIL' | 'OTP' | 'RESET' | 'SUCCESS';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Cleanup on mount and unmount
  useEffect(() => {
    dispatch(clearOtpState());
    return () => {
      dispatch(clearOtpState());
    };
  }, [dispatch]);
  
  // Redux State
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const { otpLoading, otpError, otpSent, otpVerified, resetSuccess } = useAppSelector((state) => state.public);
  
  // Local State
  const [step, setStep] = useState<ResetStep>('ID');
  const [email, setEmail] = useState('');
  const [loginId, setLoginId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State for ID Lookup
  const [isIdModalOpen, setIsIdModalOpen] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Sync Redux step changes with Local step
  useEffect(() => {
    if (otpSent && step === 'EMAIL') {
      setStep('OTP');
      message.success('OTP sent to your email');
    }
    if (otpVerified && step === 'OTP') {
      setStep('RESET');
      message.success('OTP verified successfully');
    }
    if (resetSuccess && step === 'RESET') {
      setStep('SUCCESS');
    }
    if (otpError) {
      setError(otpError);
    }
  }, [otpSent, otpVerified, resetSuccess, otpError, step]);

  // Handle ID Identification
  const handleIdSubmit = async () => {
    if (!searchId.trim()) {
      message.error('Please enter your Employee ID');
      return;
    }

    setIsIdentifying(true);
    try {
      const response: any = await dispatch(getEntities({ search: searchId.trim() })).unwrap();
      const list = Array.isArray(response) ? response : response.data || [];
      const foundUser = list.length > 0 ? list[0] : null;

      if (foundUser) {
        dispatch(setCurrentUser(foundUser));
        setEmail(foundUser.email || '');
        setLoginId(foundUser.employeeId || searchId.trim()); // Use internal ID if available, else what was typed
        setIsIdModalOpen(false);
        setStep('EMAIL');
      } else {
        message.error('No employee found with this ID');
      }
    } catch (err) {
      message.error('Error searching for employee');
    } finally {
      setIsIdentifying(false);
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    dispatch(forgotPasswordOtp({ loginId, email }));
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setError(null);
    dispatch(verifyOtp({ loginId, otp }));
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError(null);
    dispatch(resetPasswordOtp({ loginId, newPassword }));
  };

  const resetAll = () => {
    dispatch(clearAllPublicState());
    navigate('/landing');
  };

  if (step === 'SUCCESS') {
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
            You can now log in with your new credentials.
          </p>
          <button
            onClick={resetAll}
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
      {/* Step 0: ID Lookup Modal */}
      <Modal
        title={null}
        open={isIdModalOpen}
        onCancel={() => navigate('/landing')}
        footer={null}
        centered
        closable={false}
        styles={{
            mask: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(28, 156, 192, 0.4)' },
            content: { borderRadius: '24px', padding: 0, overflow: 'hidden' }
        }}
      >
        <div className="p-8 sm:p-10 bg-white text-center">
          <Search className="w-12 h-12 text-[#1c9cc0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Identify Yourself</h2>
          <p className="text-gray-500 text-sm mb-8">Please enter your Employee ID to proceed.</p>
          <div className="space-y-6">
            <Input
              placeholder="Employee ID"
              size="large"
              className="rounded-xl h-12"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onPressEnter={handleIdSubmit}
            />
            <button
              onClick={handleIdSubmit}
              disabled={isIdentifying}
              className="w-full bg-[#1c9cc0] text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isIdentifying ? <Loader2 className="animate-spin" /> : 'IDENTIFY EMPLOYEE'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Main Container */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 relative z-10">
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
          <h1 className="text-2xl font-bold text-white mb-2">
            {step === 'EMAIL' && 'Confirm Email'}
            {step === 'OTP' && 'Verify OTP'}
            {step === 'RESET' && 'New Password'}
          </h1>
          <p className="text-blue-100 text-sm opacity-90">
            {step === 'EMAIL' && 'We will send a 6-digit OTP to your registered email.'}
            {step === 'OTP' && `Entering the code sent to ${email.replace(/(.{3})(.*)(@.*)/, "$1***$3")}`}
            {step === 'RESET' && 'Set a strong password for your account.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-white text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* STEP 1: SEND OTP FORM */}
        {step === 'EMAIL' && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-blue-100 uppercase tracking-widest ml-1">Registered Email</label>
              <div className="relative">
                <Input value={email} readOnly className="pl-10 h-12 bg-white/20 border-white/30 text-white rounded-xl" />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-100 w-5 h-5" />
              </div>
            </div>
            <button
              type="submit"
              disabled={otpLoading}
              className="w-full bg-white text-[#1c9cc0] font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {otpLoading ? <Loader2 className="animate-spin" /> : 'SEND OTP'}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY OTP FORM */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 text-center">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Enter 6-Digit OTP</label>
              <Input
                placeholder="000000"
                maxLength={6}
                size="large"
                className="text-center text-2xl h-16 rounded-xl font-mono tracking-[0.5em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <button
              type="submit"
              disabled={otpLoading}
              className="w-full bg-white text-[#1c9cc0] font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {otpLoading ? <Loader2 className="animate-spin" /> : 'VERIFY OTP'}
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              className="text-white text-xs hover:underline opacity-80"
            >
              Didn't receive code? Resend
            </button>
          </form>
        )}

        {/* STEP 3: RESET PASSWORD FORM */}
        {step === 'RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-blue-100 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-3.5 bg-white/90 border border-transparent focus:border-white/50 rounded-xl text-gray-900 text-sm"
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
                  className="w-full pl-10 pr-10 py-3.5 bg-white/90 border border-transparent focus:border-white/50 rounded-xl text-gray-900 text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={otpLoading}
              className="w-full bg-white text-[#1c9cc0] font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4"
            >
              {otpLoading ? <Loader2 className="animate-spin" /> : 'UPDATE PASSWORD'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
