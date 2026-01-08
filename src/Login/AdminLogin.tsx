import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock } from 'lucide-react'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (loginId === 'admin' && password === 'admin123') {
      console.log('Admin login successful');
      navigate('/admin-dashboard');
    } else {
      setError('Invalid Login ID or Password. (Hint: admin / admin123)');
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-150px)] flex items-center justify-center bg-[#E5E9F2] p-4 font-sans text-gray-800 overflow-hidden">
      {/* Main Card */}
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row h-[600px] max-h-[90vh]">

        {/* Left Side - Blue Branding Panel */}
        <div className="md:w-4/12 bg-[#1A73E8] relative flex items-center justify-center p-8 overflow-hidden">
          {/* Abstract Shapes */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

          {/* Wave Shape */}
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-400 text-sm">Please login to your admin account.</p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Inner Card wrapping inputs */}
            <div className="border border-gray-100 rounded-2xl p-6 shadow-sm bg-white/50 space-y-5">
              {/* Login ID */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">Login ID</label>
                <div className="relative group">
                  <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-700 text-sm"
                    placeholder="e.g. ADM001"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">Password</label>
                <div className="relative group">
                  <input
                    type="password"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-700 text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-2">
              <button
                type="submit"
                className="flex-1 bg-[#1A73E8] hover:bg-[#3D5AFE] text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-xl hover:shadow-[#3D5AFE]/40 text-sm transform hover:-translate-y-0.5"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin-register')}
                className="flex-1 bg-white hover:bg-gray-50 text-[#1A73E8] font-semibold py-3 px-6 rounded-lg transition-all border border-[#1A73E8]/30 hover:border-[#1A73E8] shadow-sm hover:shadow-md text-sm transform hover:-translate-y-0.5 hover:ring-2 hover:ring-[#1A73E8]/10"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
