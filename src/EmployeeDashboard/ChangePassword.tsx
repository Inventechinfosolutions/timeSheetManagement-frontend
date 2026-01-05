import { useState } from 'react';
import { Lock, Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const toggleVisibility = (field: keyof typeof showPasswords) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({
            ...passwords,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (passwords.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        // Mock API call
        console.log('Password change requested', passwords);
        setSuccess('Password successfully updated!');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    return (
        <div className="p-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto mt-10">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                    <div className="p-3 bg-[#E6FFFA] rounded-full text-[#00A3C4]">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#2B3674]">Change Password</h1>
                        <p className="text-gray-400 text-sm mt-1">Ensure your account is secure by using a strong password.</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                        <Shield size={16} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                        <Shield size={16} />
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1">Current Password</label>
                        <div className="relative group">
                            <input
                                type={showPasswords.current ? "text" : "password"}
                                name="currentPassword"
                                value={passwords.currentPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A3C4]/20 focus:border-[#00A3C4] outline-none transition-all placeholder-gray-300 text-gray-700"
                            />
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00A3C4] transition-colors w-5 h-5" />
                            <button
                                type="button"
                                onClick={() => toggleVisibility('current')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00A3C4] transition-colors p-1"
                            >
                                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1">New Password</label>
                        <div className="relative group">
                            <input
                                type={showPasswords.new ? "text" : "password"}
                                name="newPassword"
                                value={passwords.newPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A3C4]/20 focus:border-[#00A3C4] outline-none transition-all placeholder-gray-300 text-gray-700"
                            />
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00A3C4] transition-colors w-5 h-5" />
                            <button
                                type="button"
                                onClick={() => toggleVisibility('new')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00A3C4] transition-colors p-1"
                            >
                                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 ml-1">Minimum 8 characters</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1">Confirm New Password</label>
                        <div className="relative group">
                            <input
                                type={showPasswords.confirm ? "text" : "password"}
                                name="confirmPassword"
                                value={passwords.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A3C4]/20 focus:border-[#00A3C4] outline-none transition-all placeholder-gray-300 text-gray-700"
                            />
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00A3C4] transition-colors w-5 h-5" />
                            <button
                                type="button"
                                onClick={() => toggleVisibility('confirm')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00A3C4] transition-colors p-1"
                            >
                                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div className="flex justify-end mt-1 px-1">
                            <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="text-xs font-bold text-[#00A3C4] hover:text-[#0ea5e9] underline underline-offset-4 transition-colors cursor-pointer"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-linear-to-r from-[#1c9cc0] to-[#0ea5e9] hover:from-[#0ea5e9] hover:to-[#1c9cc0] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#1c9cc0]/30 hover:shadow-[#0ea5e9]/50 text-sm border border-transparent transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                        >
                            <span className="relative z-10">Update Password</span>
                            <ArrowRight size={18} className="relative z-10" />
                        </button>
                    </div>


                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
