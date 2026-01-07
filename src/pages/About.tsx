import { useNavigate } from 'react-router-dom'
import { Clock, Shield, Users, Calendar, BarChart3, Download, UserCircle, Key, Laptop, Building2, MapPin, CheckCircle2 } from 'lucide-react'

const About = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F4F7FE] pb-20">
      <style>{`
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Hero Section */}
      <div className="bg-linear-to-r from-[#1c9cc0] to-[#00A3C4] text-white py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center lg:text-left">
          <button 
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center text-blue-50 hover:text-white transition-colors text-sm font-medium bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-sm"
          >
            ← Back to Portal
          </button>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight">
            About the <span className="text-blue-200 italic">Timesheet</span> Application
          </h1>
          <p className="text-lg sm:text-xl text-blue-50 max-w-3xl leading-relaxed font-medium opacity-90">
            A comprehensive attendance and workforce time-tracking solution designed to simplify daily attendance 
            management for modern hybrid teams.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 relative z-20">
        {/* Core Description Card */}
        <div className="bg-white rounded-xl p-8 sm:p-12 shadow-xl shadow-blue-900/5 border border-gray-100 mb-12 transform transition-all">
          <p className="text-gray-600 text-lg leading-relaxed text-center sm:text-left font-medium">
            The platform ensures accurate tracking, transparency, and actionable insights for both employees and administrators. 
            Built to support modern work models such as office work, work from home, and client-site engagements, 
            we simplify workforce productivity with precision.
          </p>
        </div>

        {/* Experience Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Employee Experience */}
          <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-[#00A3C4]">
                <Users size={24} />
              </div>
              <h2 className="text-2xl font-black text-[#2B3674] tracking-tight uppercase">Employee Experience</h2>
            </div>
            
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg shadow-gray-200/50 border border-gray-100 space-y-6 grow">
              <p className="text-gray-500 font-medium">Securely access and manage daily attendance efficiently through our intuitive portal.</p>
              
              <div className="grid gap-4">
                {[
                  { icon: <Clock size={18}/>, title: "Log in & Log out", desc: "Accurately record daily working hours." },
                  { icon: <Laptop size={18}/>, title: "Work Mode Selection", desc: "Choose Office, WFH, or Client Visit." },
                  { icon: <BarChart3 size={18}/>, title: "Personalized Dashboards", desc: "Summaries of present days & avg hours." },
                  { icon: <Download size={18}/>, title: "Custom Reports", desc: "Download historical data by date range." },
                  { icon: <UserCircle size={18}/>, title: "Profile Management", desc: "Update profile photos securely." },
                  { icon: <Key size={18}/>, title: "Secure Access", desc: "Change passwords at any time." },
                  { icon: <Calendar size={18}/>, title: "Calendar Snapshots", desc: "Visual representation of attendance status." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#00A3C4] shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2B3674] text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Super Admin Capabilities */}
          <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                <Shield size={24} />
              </div>
              <h2 className="text-2xl font-black text-[#2B3674] tracking-tight uppercase">Administrative Power</h2>
            </div>

            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg shadow-gray-200/50 border border-gray-100 space-y-6 grow">
              <p className="text-gray-500 font-medium">Centralized monitoring and real-time oversight across the entire organization.</p>
              
              <div className="grid gap-4">
                <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100">
                  <h4 className="font-bold text-[#2B3674] flex items-center gap-2 mb-2">
                    <BarChart3 size={16} className="text-teal-600"/> Dashboard Insights
                  </h4>
                  <ul className="text-xs text-gray-500 space-y-2 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-teal-600"/> Total employee headcount & present status</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-teal-600"/> Daily work mode distribution (Home/Office/Client)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-teal-600"/> Real-time absentee tracking</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-teal-600"/> Organizational average working hours</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <h4 className="font-bold text-[#2B3674] flex items-center gap-2 mb-2">
                    <Download size={16} className="text-[#00A3C4]"/> Multi-Level Reporting
                  </h4>
                  <ul className="text-xs text-gray-500 space-y-2 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-[#00A3C4]"/> Individual employee-wise attendance</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-[#00A3C4]"/> Department-level performance tracking</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-[#00A3C4]"/> Complete Organization-wide data exports</li>
                  </ul>
                </div>
                
                <div className="p-6 text-center">
                  <div className="flex justify-center gap-4 mb-4">
                    <Building2 className="text-[#2B3674] opacity-20" size={32} />
                    <MapPin className="text-[#2B3674] opacity-20" size={32} />
                  </div>
                  <p className="text-xs text-gray-400 font-bold italic uppercase tracking-widest">Centralized Monitoring for Distributed Teams</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conclusion / Business Value */}
        <div className="mt-12 bg-linear-to-br from-[#2B3674] to-[#121841] rounded-2xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-black mb-6 tracking-tight">Purpose & Business Value</h2>
            <p className="text-blue-100 text-lg leading-relaxed font-medium">
              The Timesheet Application is built to support hybrid and distributed work environments while 
              maintaining accountability and operational efficiency. By combining intuitive employee workflows 
              with powerful administrative dashboards, the system helps organizations reduce manual tracking, 
              improve attendance accuracy, and gain clear visibility into workforce availability and work patterns.
            </p>
            <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap justify-center gap-8 opacity-60">
              <div className="text-center">
                <div className="text-2xl font-black mb-1">100%</div>
                <div className="text-[10px] font-bold uppercase tracking-widest">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black mb-1">Real-Time</div>
                <div className="text-[10px] font-bold uppercase tracking-widest">Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black mb-1">Secure</div>
                <div className="text-[10px] font-bold uppercase tracking-widest">Data</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
