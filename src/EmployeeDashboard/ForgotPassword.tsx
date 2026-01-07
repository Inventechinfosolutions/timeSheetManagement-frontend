import { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Shield, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
    const [email, setEmail] = useState('arunkumar@inventechinfo.com');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [showPasswords, setShowPasswords] = useState(false);
    const [timer, setTimer] = useState(600); // 10 minutes in seconds
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [generatedOtp, setGeneratedOtp] = useState('');

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        let intervalId: any;
        if (step === 2 && timer > 0) {
            intervalId = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [step, timer]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            const newCode = '123456';
            setGeneratedOtp(newCode);
            setIsLoading(false);
            setStep(2);
            setMessage({ 
                type: 'success', 
                text: `[TEST MODE] OTP sent! Your secure code is: ${newCode}` 
            });
        }, 1500);
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const enteredOtp = otp.join('');
        
        if (enteredOtp !== generatedOtp) {
            setMessage({ type: 'error', text: 'Invalid verification code. Please try again.' });
            return;
        }

        setIsLoading(true);
        // Simulate API verification
        setTimeout(() => {
            setIsLoading(false);
            setStep(3);
            setMessage({ type: 'success', text: 'Identity verified. Please set your new password.' });
        }, 1500);
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }
        setIsLoading(true);
        // Simulate API reset
        setTimeout(() => {
            setIsLoading(false);
            setStep(4);
        }, 1500);
    };

    const getPasswordStrength = () => {
        if (passwords.new.length === 0) return 0;
        if (passwords.new.length < 6) return 25;
        if (passwords.new.length < 10) return 60;
        return 100;
    };

    const renderStep1 = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#2B3674] mb-2 text-center">Forgot password</h2>
                <p className="text-gray-400 text-sm text-center">Select which methods you'd like to reset.</p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1">Email address</label>
                    <div className="relative group">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mail@inventech.com"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A3C4]/20 focus:border-[#00A3C4] outline-none transition-all placeholder-gray-300 text-gray-700"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00A3C4] transition-colors w-5 h-5" />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-linear-to-r from-[#1c9cc0] to-[#0ea5e9] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#1c9cc0]/30 hover:shadow-[#0ea5e9]/50 text-sm transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <span>Continue</span>
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );

    const renderStep2 = () => (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#2B3674] mb-2 text-center">Enter otp</h2>
                <p className="text-gray-400 text-sm text-center">
                    A magic code to sign in was sent to <br />
                    <span className="text-[#00A3C4] font-medium">{email || 'your email'}</span>
                </p>
            </div>

            <form onSubmit={handleOtpVerify} className="space-y-8">
                <div className="flex justify-between gap-2 max-w-xs mx-auto">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => otpRefs.current[index] = el}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-11 h-11 text-center font-bold text-xl text-[#2B3674] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A3C4]/20 focus:border-[#00A3C4] outline-none transition-all bg-gray-50/50"
                        />
                    ))}
                </div>

                <div className="text-center space-y-4">
                    <p className="text-sm font-medium text-gray-400">
                        Expires in: <span className="text-[#00A3C4]">{formatTime(timer)}</span>
                    </p>

                    <button
                        type="submit"
                        disabled={isLoading || otp.some(d => !d)}
                        className="w-full bg-linear-to-r from-[#1c9cc0] to-[#0ea5e9] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#1c9cc0]/30 hover:shadow-[#0ea5e9]/50 text-sm transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                        ) : 'Continue'}
                    </button>

                    <button
                        type="button"
                        onClick={() => { setTimer(600); setOtp(['', '', '', '', '', '']); }}
                        className="text-xs font-bold text-gray-400 hover:text-[#00A3C4] transition-colors"
                    >
                        Didn't get OTP? <span className="text-[#00A3C4] underline">Resend OTP</span>
                    </button>
                </div>
            </form>
        </div>
    );

    const renderStep3 = () => (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#2B3674] mb-2 text-center">Reset password</h2>
                <p className="text-gray-400 text-sm text-center">Select which methods you'd like to reset.</p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1">New password</label>
                        <div className="relative group">
                            <input
                                type={showPasswords ? "text" : "password"}
                                required
                                value={passwords.new}
                                onChange={(e) => {
                                    setPasswords({ ...passwords, new: e.target.value });
                                    if (message.type === 'error') setMessage({ type: '', text: '' });
                                }}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A3C4]/20 focus:border-[#00A3C4] outline-none transition-all placeholder-gray-300 text-gray-700"
                            />
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00A3C4] transition-colors w-5 h-5" />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(!showPasswords)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00A3C4] transition-colors p-1"
                            >
                                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1">Confirm password</label>
                        <div className="relative group">
                            <input
                                type={showPasswords ? "text" : "password"}
                                required
                                value={passwords.confirm}
                                onChange={(e) => {
                                    setPasswords({ ...passwords, confirm: e.target.value });
                                    if (message.type === 'error') setMessage({ type: '', text: '' });
                                }}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A3C4]/20 focus:border-[#00A3C4] outline-none transition-all placeholder-gray-300 text-gray-700"
                            />
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00A3C4] transition-colors w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Password Strength Indicator */}
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <span>Strength</span>
                        <span className={getPasswordStrength() === 100 ? 'text-green-500' : 'text-[#00A3C4]'}>
                            {getPasswordStrength() <= 25 ? 'Weak' : getPasswordStrength() <= 60 ? 'Medium' : 'Strong'}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${getPasswordStrength() <= 25 ? 'bg-red-400' :
                                getPasswordStrength() <= 60 ? 'bg-yellow-400' : 'bg-green-500'
                                }`}
                            style={{ width: `${getPasswordStrength()}%` }}
                        ></div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-linear-to-r from-[#1c9cc0] to-[#0ea5e9] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#1c9cc0]/30 hover:shadow-[#0ea5e9]/50 text-sm transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Submitting...</span>
                        </div>
                    ) : 'Continue'}
                </button>
            </form>
        </div>
    );

    const renderSuccess = () => (
        <div className="animate-in zoom-in-95 duration-500 text-center py-4">
            <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 scale-animation">
                <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#2B3674] mb-2">Password changed successfully</h2>
            <p className="text-gray-400 text-sm mb-8">
                Your password has been reset. <br />
                Please log in with your new credentials.
            </p>
            <button
                onClick={() => navigate('/landing')}
                className="w-full bg-linear-to-r from-[#1c9cc0] to-[#0ea5e9] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#1c9cc0]/30 hover:shadow-[#0ea5e9]/50 text-sm transform hover:-translate-y-0.5 active:translate-y-0"
            >
                Back to Home
            </button>
        </div>
    );

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F7FE] p-4 font-sans relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -mr-48 -mt-48 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E6FFFA] rounded-full blur-3xl -ml-48 -mb-48 opacity-50"></div>

            <div className="w-full max-w-md relative z-10">
                {/* Back Button */}
                {step < 4 && (
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
                        className="mb-4 flex items-center gap-1 text-gray-400 hover:text-[#00A3C4] transition-colors text-sm font-medium"
                    >
                        <ChevronLeft size={18} />
                        Back
                    </button>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
                    {/* Status Message */}
                    {message.text && step < 4 && (
                        <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                            <span>{message.text}</span>
                        </div>
                    )}

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderSuccess()}

                    {/* Footer Links */}
                    {step === 1 && (
                        <div className="mt-8 text-center">
                            <p className="text-xs text-gray-400">
                                Remembered your password? {' '}
                                <button onClick={() => navigate('/admin-login')} className="text-[#00A3C4] font-bold hover:underline">Log in</button>
                            </p>
                        </div>
                    )}
                </div>

                {/* Progress Indicators */}
                {step < 4 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {[1, 2, 3].map(s => (
                            <div
                                key={s}
                                className={`h-1 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-[#00A3C4]' : s < step ? 'w-4 bg-[#00A3C4]/50' : 'w-4 bg-gray-200'
                                    }`}
                            ></div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes scale-in {
                    0% { transform: scale(0.8); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .scale-animation {
                    animation: scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};

export default ForgotPassword;
