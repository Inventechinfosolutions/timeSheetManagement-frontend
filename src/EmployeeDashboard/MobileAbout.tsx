// import React from "react";
// import { ArrowLeft, Info, Clock, Users, Shield, Laptop, BarChart3, Download, UserCircle, Key, Calendar, Building2, MapPin, CheckCircle2 } from "lucide-react";
// import { useNavigate, useLocation } from "react-router-dom";

// const MobileAbout = () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   return (
//     <div className="overflow-y-auto no-scrollbar px-5 md:px-8 pt-4 pb-0 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500 space-y-3 md:space-y-4">
      
//       {/* Back Button matching your layout standard */}
//       <button 
//         onClick={() => {
//           const path = location.pathname;
//           if (path.includes('/manager-dashboard')) {
//             navigate('/manager-dashboard/my-dashboard');
//           } else if (path.includes('/admin-dashboard')) {
//             navigate('/admin-dashboard');
//           } else {
//             navigate('/employee-dashboard');
//           }
//         }}
//         className="group flex items-center gap-2 text-[#A3AED0] hover:text-[#4318FF] transition-all mb-2 w-fit"
//       >
//         <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
//         <span className="text-[11px] font-black uppercase tracking-widest pl-1">Back</span>
//       </button>

//       {/* Top Card - Header with Brand Identity Gradient */}
//       <div className="relative overflow-hidden rounded-[16px] md:rounded-[24px] shadow-[0px_10px_30px_0px_rgba(17,28,68,0.04)] border border-gray-100">
//         <div
//           className="absolute inset-0 opacity-100"
//           style={{
//             background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//           }}
//         ></div>

//         <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center text-center md:text-left min-h-[140px]">
//           <h1 className="text-xl md:text-3xl font-black text-white leading-tight flex items-center justify-center md:justify-start gap-3">
//             <Info size={28} className="text-white/90 shrink-0" />
//             About the Worksphere Application
//           </h1>
//           <p className="text-white/80 font-medium text-xs md:text-sm max-w-2xl mt-2">
//             A comprehensive attendance and workforce time-tracking solution designed to simplify daily attendance management for modern hybrid teams.
//           </p>
//         </div>
//       </div>

//       {/* Main Narrative Card */}
//       <div className="bg-white rounded-[20px] md:rounded-[32px] p-6 md:p-8 border border-gray-100">
//         <p className="text-[#1B2559] text-sm md:text-base leading-relaxed font-semibold">
//           The platform ensures accurate tracking, transparency, and actionable insights for both employees and administrators.
//           Built to support modern work models such as office work, work from home, and client-site engagements,
//           we simplify workforce productivity with precision.
//         </p>
//       </div>

//       {/* Grid Features Layout */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
//         {/* Employee Experience Capabilities */}
//         <div className="bg-white rounded-[20px] md:rounded-[32px] p-6 md:p-8 border border-gray-100 space-y-5">
//           <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
//             <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#667eea]">
//               <Users size={20} />
//             </div>
//             <h2 className="text-lg font-bold text-[#1B2559]">Employee Experience</h2>
//           </div>

//           <div className="grid gap-3.5">
//             {[
//               { icon: <Clock size={16} />, title: "Log in & Log out", desc: "Accurately record daily working hours." },
//               { icon: <Laptop size={16} />, title: "Work Mode Selection", desc: "Choose Office, WFH, or Client Visit." },
//               { icon: <BarChart3 size={16} />, title: "Personalized Dashboards", desc: "Summaries of present days & avg hours." },
//               { icon: <Download size={16} />, title: "Custom Reports", desc: "Download historical data by date range." },
//               { icon: <UserCircle size={16} />, title: "Profile Management", desc: "Update profile photos securely." },
//               { icon: <Key size={16} />, title: "Secure Access", desc: "Change passwords at any time." },
//               { icon: <Calendar size={16} />, title: "Calendar Snapshots", desc: "Visual representation of attendance status." }
//             ].map((item, i) => (
//               <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50/50 transition-colors border border-transparent">
//                 <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-[#667eea] shrink-0">
//                   {item.icon}
//                 </div>
//                 <div>
//                   <h4 className="font-bold text-[#1B2559] text-xs md:text-sm">{item.title}</h4>
//                   <p className="text-[11px] text-[#A3AED0] font-bold mt-0.5">{item.desc}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Administrative Capabilities */}
//         <div className="bg-white rounded-[20px] md:rounded-[32px] p-6 md:p-8 border border-gray-100 space-y-5 flex flex-col justify-between">
//           <div className="space-y-5 w-full">
//             <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
//               <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#764ba2]">
//                 <Shield size={20} />
//               </div>
//               <h2 className="text-lg font-bold text-[#1B2559]">Administrative Power</h2>
//             </div>

//             <div className="space-y-4">
//               <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
//                 <h4 className="font-bold text-[#1B2559] text-sm flex items-center gap-2 mb-3">
//                   <BarChart3 size={16} className="text-[#667eea]" /> Dashboard Insights
//                 </h4>
//                 <ul className="text-[11px] text-[#A3AED0] space-y-2 font-black tracking-wide uppercase">
//                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> Total Headcount & Status</li>
//                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> Work Mode Distribution</li>
//                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> Real-time Absence Tracking</li>
//                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> Organizational Avg Hours</li>
//                 </ul>
//               </div>

//               <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
//                 <h4 className="font-bold text-[#1B2559] text-sm flex items-center gap-2 mb-3">
//                   <Download size={16} className="text-[#764ba2]" /> Multi-Level Reporting
//                 </h4>
//                 <ul className="text-[11px] text-[#A3AED0] space-y-2 font-black tracking-wide uppercase">
//                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-purple-500" /> Individual Employee Data</li>
//                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-purple-500" /> Department-Level Audits</li>
//                   <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-purple-500" /> Org-Wide Historical Exports</li>
//                 </ul>
//               </div>
//             </div>
//           </div>

//           <div className="pt-6 text-center border-t border-gray-50 w-full mt-4 md:mt-0">
//             <div className="flex justify-center gap-4 mb-2 opacity-30">
//               <Building2 className="text-[#1B2559]" size={24} />
//               <MapPin className="text-[#1B2559]" size={24} />
//             </div>
//             <p className="text-[10px] text-[#A3AED0] font-black uppercase tracking-widest">Centralized Monitoring for Distributed Teams</p>
//           </div>
//         </div>

//       </div>

//       {/* Purpose Footer Banner */}
//       <div className="bg-white rounded-[20px] md:rounded-[32px] p-6 md:p-8 border border-gray-100 !mt-6 mb-6">
//         <h3 className="text-base font-bold text-[#1B2559] mb-2">Purpose & Business Value</h3>
//         <p className="text-[#A3AED0] text-xs md:text-sm font-semibold leading-relaxed">
//           The Timesheet Application is built to support hybrid and distributed work environments while maintaining accountability and operational efficiency. By combining intuitive employee workflows with powerful administrative dashboards, the system helps organizations reduce manual tracking, improve attendance accuracy, and gain clear visibility into workforce availability and work patterns.
//         </p>
//       </div>

//     </div>
//   );
// };

// export default MobileAbout;