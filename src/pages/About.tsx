import aboutIMG from '../assets/About_IMG.png'
import {
  Clock,
  ShieldCheck,
  Users,
  Calendar,
  BarChart3,
  Download,
  UserCircle,
  Key,
  Laptop,
  Building2,
  MapPin,
  CheckCircle2,
  LogIn,
  Target,
  Shield
} from 'lucide-react'

import MobileAbout from './MobileAbout/MobileAbout'

const About = () => {
  console.log("About component rendered");

  const employeeFeatures = [
    { icon: <LogIn size={18} className="text-[#3B82F6]" />, title: "Log in & Log out", desc: "Accurately record daily working hours." },
    { icon: <Laptop size={18} className="text-[#3B82F6]" />, title: "Work Mode Selection", desc: "Choose Office, WFH, or Client Visit." },
    { icon: <BarChart3 size={18} className="text-[#3B82F6]" />, title: "Personalized Dashboards", desc: "Summaries of present days & avg hours." },
    { icon: <Download size={18} className="text-[#3B82F6]" />, title: "Custom Reports", desc: "Download historical data by date range." },
    { icon: <UserCircle size={18} className="text-[#3B82F6]" />, title: "Profile Management", desc: "Update profile photos securely." },
    { icon: <Key size={18} className="text-[#3B82F6]" />, title: "Secure Access", desc: "Change passwords at any time." },
    { icon: <Calendar size={18} className="text-[#3B82F6]" />, title: "Calendar Snapshots", desc: "Visual representation of attendance status." }
  ];

  return (
    <div className="w-full flex-1 lg:-mt-8">
      {/* Mobile View */}
      <div className="block lg:hidden w-full">
        <MobileAbout />
      </div>

      {/* Desktop View */}
      <div className="hidden lg:flex w-full min-h-screen bg-[#F4F7FE] px-6 flex-col">
        {/* Main Container */}
        <div className="w-full mx-auto flex flex-col flex-1">

          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Text */}
            <div className="lg:col-span-7 space-y-3">
              <h1 className="text-4xl sm:text-4xl font-extrabold text-[#1B2559] tracking-tight leading-tight">
                About the <br />
                <span className="text-[#3311CC] italic font-serif">Worksphere</span> Application
              </h1>
              <p className="text-gray-500 text-sm sm:text-base leading-relaxed font-normal">
                A comprehensive attendance and workforce time-tracking solution designed to simplify daily attendance management for modern hybrid teams.
              </p>
            </div>

            {/* Right Image */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <img
                src={aboutIMG}
                alt="Worksphere Application Illustration"
                className="w-full max-w-xs h-auto object-contain select-none pointer-events-none drop-shadow-sm"
              />
            </div>
          </div>

          {/* Core Description Card */}
          <div className="bg-white rounded-2xl sm:p-2 text-justify shadow-sm border border-gray-100/80 mb-4 -mt-8 border-l-4 border-l-[#3311CC]">
            <div className="flex items-start gap-2">
              <div className="w-12 h-12 shrink-0 bg-[#EEF2FF] rounded-2xl flex items-center justify-center text-[#3311CC]">
                <Users size={22} />
              </div>
              <p className="text-[#2B3674] text-sm sm:text-base leading-relaxed font-medium pt-1">
                The platform ensures accurate tracking, transparency, and actionable insights for both employees and administrators. Built to support modern work models such as office work, work from home, and client-site engagements, we simplify workforce productivity with precision.
              </p>
            </div>
          </div>

          {/* Two-Column Experience Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-10">

            {/* Employee Experience Column */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-[#E0F2FE] rounded-2xl flex items-center justify-center text-[#0284C7]">
                    <Users size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1B2559] tracking-wider uppercase">Employee Experience</h2>
                    <p className="text-xs text-gray-400 font-medium">Everything you need, in one place.</p>
                  </div>
                </div>
                <div className="h-0.5 w-12 bg-[#0284C7] rounded-full mb-6"></div>

                {/* Feature Items List */}
                <div className="space-y-4">
                  {employeeFeatures.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1B2559] text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-400 font-normal mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Administrative Power Column */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-[#CCFBF1] rounded-2xl flex items-center justify-center text-[#0D9488]">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1B2559] tracking-wider uppercase">Administrative Power</h2>
                    <p className="text-xs text-gray-400 font-medium">Powerful tools for smarter management.</p>
                  </div>
                </div>
                <div className="h-0.5 w-12 bg-[#0D9488] rounded-full mb-6"></div>

                {/* Box 1: Dashboard Insights */}
                <div className="p-5 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] mb-5">
                  <h4 className="font-bold text-[#1B2559] text-sm flex items-center gap-2 mb-3">
                    <BarChart3 size={18} className="text-[#059669]" /> Dashboard Insights
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-2.5 font-medium">
                    <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-[#059669] shrink-0" /> Total employee headcount & present status</li>
                    <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-[#059669] shrink-0" /> Daily work mode distribution (Home/Office/Client)</li>
                    <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-[#059669] shrink-0" /> Real-time absentee tracking</li>
                    <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-[#059669] shrink-0" /> Organizational average working hours</li>
                  </ul>
                </div>

                {/* Box 2: Multi-Level Reporting */}
                <div className="p-5 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] mb-6">
                  <h4 className="font-bold text-[#1B2559] text-sm flex items-center gap-2 mb-3">
                    <Download size={18} className="text-[#2563EB]" /> Multi-Level Reporting
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-2.5 font-medium">
                    <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-[#2563EB] shrink-0" /> Individual employee-wise attendance</li>
                    <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-[#2563EB] shrink-0" /> Department-level performance tracking</li>
                    <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-[#2563EB] shrink-0" /> Complete organization-wide data exports</li>
                  </ul>
                </div>

                {/* Bottom Centralized Label */}
                <div className="text-center pt-2">
                  <div className="flex justify-center gap-3 mb-2 text-gray-300">
                    <div className="p-2.5 bg-gray-50 rounded-xl">
                      <Building2 size={20} className="text-gray-400" />
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-xl">
                      <MapPin size={20} className="text-gray-400" />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest italic">
                    Centralized Monitoring for Distributed Teams
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Value Footer Banner */}
          <div className="bg-gradient-to-r from-[#1E2B8F] to-[#0A1340] rounded-2xl p-8 sm:p-12 text-white shadow-lg text-center relative overflow-hidden mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 tracking-tight">Purpose & Business Value</h2>
            <div className="w-12 h-1 bg-[#38BDF8] mx-auto rounded-full mb-6"></div>

            <p className="text-blue-100/80 text-xs sm:text-sm  mx-auto leading-relaxed font-normal mb-10">
              The Timesheet Application is built to support hybrid and distributed work environments while maintaining accountability and operational efficiency. By combining intuitive employee workflows with powerful administrative dashboards, the system helps organizations reduce manual tracking, improve attendance accuracy, and gain clear visibility into workforce availability and work patterns.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto border-t border-white/10 pt-8">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shrink-0">
                  <Target size={18} className="text-[#38BDF8]" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-extrabold">100%</div>
                  <div className="text-[10px] text-gray-300 uppercase tracking-wider font-semibold">Accuracy</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-[#34D399]" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-extrabold">Real-Time</div>
                  <div className="text-[10px] text-gray-300 uppercase tracking-wider font-semibold">Monitoring</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shrink-0">
                  <Shield size={18} className="text-[#818CF8]" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-extrabold">Secure</div>
                  <div className="text-[10px] text-gray-300 uppercase tracking-wider font-semibold">Data</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;