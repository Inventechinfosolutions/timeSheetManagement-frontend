import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Users, User } from 'lucide-react'
import { useAppDispatch } from '../hooks'
import { setCurrentUser } from '../reducers/employeeDetails.reducer'

import inventechLogo from '../assets/inventech-logo.jpg'

const Landing = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleRoleSelect = (role: string, name: string) => {
    console.log(`Selected role: ${role}, Name: ${name}`)
    // In a real app, you'd store the selected user context here
    if (role === 'employee') {
      dispatch(setCurrentUser({ employeeId: email }));
      navigate('/employee-dashboard')
    } else {
      alert(`Logged in as ${name} (${role})`)
    }
  }

  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault()
    handleRoleSelect('employee', email)
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 lg:p-6 relative bg-[#1c9cc0] overflow-x-hidden"
    >
      <style>{`
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* Minimal Overlay for text readability only, preserving original image color */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-0"></div>

      {/* Company Branding - Top Left (Adjusted for mobile) */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-3 sm:gap-4 transition-all">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-md rounded-xl p-1.5 border border-white/20 shadow-sm flex items-center justify-center overflow-hidden">
          <img src={inventechLogo} alt="InvenTech Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg sm:text-2xl leading-none tracking-tight">InvenTech</h2>
          <p className="text-blue-100 text-[10px] sm:text-xs uppercase tracking-wider opacity-80 mt-0.5">Info Solutions Pvt. Ltd.</p>
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10 pt-20 lg:pt-0">
        {/* Left Section - Product Info */}
        <div className="space-y-6 sm:space-y-10 lg:order-1 order-2">
          <div className="space-y-3 sm:space-y-4 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-blue-100 to-white tracking-tight drop-shadow-sm">
              Timesheet Pro.
            </h1>
            <p className="text-base sm:text-lg text-blue-100 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium font-outfit">
              A secure platform to track work hours, manage attendance, and improve workforce productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 group cursor-default">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-500/30 transition-colors">
                <Shield className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-100" />
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">Admin Control</h3>
              <p className="text-blue-100 text-[11px] sm:text-xs leading-relaxed">
                Comprehensive overview of all employee activities.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 group cursor-default">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-500/30 transition-colors">
                <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-100" />
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">Employee Self-Service</h3>
              <p className="text-blue-100 text-[11px] sm:text-xs leading-relaxed">
                Easy daily logging and history tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Role Selection */}
        <div className="w-full flex justify-center lg:justify-end lg:order-2 order-1">
          <div className="w-full max-w-[400px] bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">Welcome</h2>
              <p className="text-blue-100 text-[11px] sm:text-xs">Select a role to continue to the prototype</p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-3 text-center">Login as Employee</h3>

                <form onSubmit={handleEmployeeLogin} className="space-y-4 sm:space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-blue-100 uppercase tracking-wider ml-1">Login ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter your Login ID"
                        className="w-full px-4 py-2.5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all placeholder-gray-500 text-gray-900 bg-white/90 pl-10 text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-blue-100 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all placeholder-gray-500 text-gray-900 bg-white/90 pl-10 text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    </div>
                    <div className="flex justify-start mt-2 px-0.5">
                      <button
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="text-[10px] font-medium text-blue-100 hover:text-white transition-colors underline underline-offset-2"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6">
                    <button
                      type="submit"
                      className="w-full bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 text-sm border border-transparent transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Login
                    </button>
                  </div>
                </form>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-white/20"></div>
                <span className="shrink-0 mx-3 text-blue-200 text-[10px] font-medium uppercase">Or</span>
                <div className="grow border-t border-white/20"></div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-3 text-center">Login as Admin</h3>
                <button
                  onClick={() => navigate('/admin-login')}
                  className="w-full bg-white/10 border border-white/10 rounded-lg p-2 sm:p-2.5 flex items-center gap-3 hover:bg-white/25 hover:border-white/40 hover:shadow-xl transition-all text-left group backdrop-blur-sm transform hover:-translate-y-1 hover:brightness-125 duration-300"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 group-hover:bg-blue-500/30 transition-colors">
                    <Shield className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-100" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-xs sm:text-sm">Admin</div>
                    <div className="text-[10px] text-blue-200">HR Management</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing
