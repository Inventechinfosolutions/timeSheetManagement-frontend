import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Briefcase, Building, Shield, CreditCard } from 'lucide-react'

const AdminRegistration = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        fullName: '',
        employeeId: '',
        department: '',
        designation: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [error, setError] = useState('')


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Basic Validation
        if (Object.values(formData).some(val => !val)) {
            setError('Please fill in all fields')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        console.log('Admin Registration Data:', formData)
        // Add API call here
        navigate('/landing')
    }

    return (
        <div className="h-screen w-full flex items-center justify-center bg-[#E5E9F2] p-4 font-sans text-gray-800 overflow-hidden">

            {/* Main Card - Reduced Height & Width */}
            <div className="w-full max-w-5xl bg-white rounded-xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row h-[600px] max-h-[90vh]">

                {/* Left Side - Blue Branding Panel */}
                <div className="md:w-4/12 bg-[#1A73E8] relative flex items-center justify-center p-8 overflow-hidden">
                    {/* Abstract Shapes/Background to match Dribbble shot closely */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                    {/* The distinctive wave shape */}
                    <svg className="absolute inset-0 w-full h-full text-white/5 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 0 C 40 10 60 50 20 100 L 0 100 Z" fill="currentColor" />
                        <path d="M100 100 C 60 90 40 50 80 0 L 100 0 Z" fill="currentColor" opacity="0.5" />
                    </svg>

                    {/* Branding Text */}
                    <div className="relative z-10 text-center">
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Timesheet Pro</h1>
                        <p className="text-white/80 text-base">Seamless Management</p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="md:w-8/12 bg-white px-8 py-8 lg:px-12 lg:py-10 flex flex-col justify-center h-full overflow-hidden">

                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Admin Account</h2>
                        <p className="text-gray-400 text-xs">Create an account and manage your workforce efficiently.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Inner Card wrapping inputs */}
                        <div className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {/* Full Name */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">Full Name</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="fullName"
                                            placeholder="John Doe"
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                        />
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                    </div>
                                </div>

                                {/* Employee ID */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">Employee ID</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="employeeId"
                                            placeholder="EMP-1234"
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                                            value={formData.employeeId}
                                            onChange={handleChange}
                                            required
                                        />
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                    </div>
                                </div>

                                {/* Department */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">Department</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="department"
                                            placeholder="HR"
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                                            value={formData.department}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                    </div>
                                </div>

                                {/* Designation */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">Designation</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="designation"
                                            placeholder="HR Manager"
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                                            value={formData.designation}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1 mb-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">Email Address</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="john.doe@inventech.com"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Password */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">Password</label>
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            name="password"
                                            placeholder="••••••••"
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">Confirm Password</label>
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            placeholder="••••••••"
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-700 text-xs"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Buttons Row */}
                        <div className="flex gap-4 mt-8 pt-2">
                            <button
                                type="submit"
                                className="flex-1 bg-[#1A73E8] hover:bg-[#3D5AFE] text-white font-semibold py-2.5 px-6 rounded-lg transition-all shadow-md hover:shadow-xl hover:shadow-[#3D5AFE]/40 text-xs transform hover:-translate-y-0.5"
                            >
                                Sign Up
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin-login')}
                                className="flex-1 bg-white hover:bg-gray-50 text-[#1A73E8] font-semibold py-2.5 px-6 rounded-lg transition-all border border-[#1A73E8]/30 hover:border-[#1A73E8] shadow-sm hover:shadow-md text-xs transform hover:-translate-y-0.5 hover:ring-2 hover:ring-[#1A73E8]/10"
                            >
                                Login
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}

export default AdminRegistration
