import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { getEntities } from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { UserOutlined } from "@ant-design/icons";
import MobileView from "./mobileView";
// import jsPDF from "jsPDF";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import Calendar from "../EmployeeDashboard/CalendarView";
 
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
 
  // PDF Download State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
 
  const dispatch = useAppDispatch();
  const { entities, totalItems } = useAppSelector(
    (state: RootState) => state.employeeDetails
  );
 
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce delay
 
    return () => clearTimeout(timer);
  }, [searchTerm]);
 
  useEffect(() => {
    dispatch(
      getEntities({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
      })
    );
  }, [dispatch, currentPage, debouncedSearchTerm]);
 
  // Map backend entities to the format expected by the UI
  const employees = entities.map((emp: any) => ({
    id: emp.employeeId || emp.id,
    name: emp.fullName || emp.name,
    dept: emp.department || emp.dept,
    login: emp.loginTime || emp.login || "--",
    logout: emp.logoutTime || emp.logout || "--",
    hours: emp.totalHours || emp.hours || "--",
    status: emp.status || "Leave",
    avatar:
      emp.avatar || `https://i.pravatar.cc/150?u=${emp.employeeId || emp.id}`,
  }));
 
  // UI Logic
 
  const calculateTotal = (login: string | null, logout: string | null) => {
    if (
      !login ||
      !logout ||
      logout === "Not logged out" ||
      login === "--" ||
      logout === "--"
    )
      return "--";
    const parseTime = (timeStr: string) => {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    const diff = parseTime(logout) - parseTime(login);
    if (diff < 0) return "--";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };
 
  const renderSummaryCards = () => {
    const totalEmployeesCount = totalItems || employees.length;
    const presentCount = employees.filter(
      (e) => e.status === "Full Day"
    ).length;
    const absentCount = employees.filter((e) => e.status === "Leave").length;
    const presentPercentage =
      totalEmployeesCount > 0
        ? ((presentCount / employees.length) * 100).toFixed(1)
        : "0.0";
    const absentPercentage =
      totalEmployeesCount > 0
        ? ((absentCount / employees.length) * 100).toFixed(1)
        : "0.0";
 
    // Calculate average hours
    const workingHours = employees
      .filter((e) => e.status === "Full Day" && e.hours !== "--")
      .map((e) => {
        const parts = e.hours.split(" ");
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]) || 0;
        return h + m / 60;
      });
    const avgHours =
      workingHours.length > 0
        ? (
            workingHours.reduce((a, b) => a + b, 0) / workingHours.length
          ).toFixed(1)
        : "0.0";
 
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Total Employees */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all flex flex-col">
          <div className="w-12 h-12 rounded-2xl bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] mb-4 group-hover:scale-110 transition-transform">
            <Users size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[32px] font-bold text-[#1B254B] leading-tight">
              {totalItems || employees.length}
            </h3>
            <p className="text-sm font-medium text-[#A3AED0]">
              Total Employees
            </p>
          </div>
        </div>
 
        {/* Present Today */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all flex flex-col">
          <div className="w-12 h-12 rounded-2xl bg-[#E6FFFA] flex items-center justify-center text-[#01B574] mb-4 group-hover:scale-110 transition-transform">
            <UserCheck size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[32px] font-bold text-[#1B254B] leading-tight">
              {presentCount}
            </h3>
            <p className="text-sm font-medium text-[#A3AED0] mb-1">
              Present Today
            </p>
            <span className="text-xs font-bold text-[#01B574]">
              {presentPercentage}%
            </span>
          </div>
        </div>
 
        {/* Absent Today */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all flex flex-col">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF5F5] flex items-center justify-center text-[#EE5D50] mb-4 group-hover:scale-110 transition-transform">
            <UserX size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[32px] font-bold text-[#1B254B] leading-tight">
              {/* {absentCount} */}
            </h3>
            <p className="text-sm font-medium text-[#A3AED0] mb-1">
              Absent Today
            </p>
            <span className="text-xs font-bold text-[#EE5D50]">
              {absentPercentage}%
            </span>
          </div>
        </div>
 
        {/* Avg Working Hours */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all flex flex-col">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F7FA] flex items-center justify-center text-[#00A3C4] mb-4 group-hover:scale-110 transition-transform">
            <Clock size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[32px] font-bold text-[#1B254B] leading-tight">
              {avgHours}
            </h3>
            <p className="text-sm font-medium text-[#A3AED0] mb-1">
              Avg Working Hours
            </p>
            <span className="text-xs font-bold text-[#00A3C4]">Today</span>
          </div>
        </div>
      </div>
    );
  };      
 
  const handleDownloadReport = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }
 
    const doc = new jsPDF();
 
    employees.forEach((emp, index) => {
      // Add Page Break for subsequent employees
      if (index > 0) {
        doc.addPage();
      }
 
      // --- Header Background ---
      doc.setFillColor(43, 54, 116); // #2B3674 (Brand Blue)
      doc.rect(0, 0, 210, 40, "F");
 
      // --- Company Details (Top Left) ---
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text("INVENTECH", 14, 18);
 
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Info Solutions Pvt. Ltd.", 14, 24);
 
      // --- Report Title (Top Right) ---
      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.text("TIMESHEET REPORT", 196, 22, { align: "right" });
 
      // --- Employee Details Section ---
      const detailsStartY = 55;
 
      doc.setTextColor(43, 54, 116); // #2B3674
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("EMPLOYEE DETAILS", 14, detailsStartY);
 
      // Horizontal Line
      doc.setDrawColor(220, 220, 220); // Light Gray
      doc.line(14, detailsStartY + 3, 196, detailsStartY + 3);
 
      // Details Grid
      const gridStartY = detailsStartY + 12;
      const col2X = 120; // X position for 2nd column
      const rowGap = 8; // Gap between rows
 
      doc.setFontSize(10);
 
      // Row 1: Name & Department
      // Name
      doc.setTextColor(113, 128, 150); // Gray Label
      doc.setFont("helvetica", "bold");
      doc.text("Name:", 14, gridStartY);
 
      doc.setTextColor(43, 54, 116); // Blue Value
      doc.setFont("helvetica", "normal");
      doc.text(emp.name, 45, gridStartY);
 
      // Department
      doc.setTextColor(113, 128, 150); // Gray Label
      doc.setFont("helvetica", "bold");
      doc.text("Department:", col2X, gridStartY);
 
      doc.setTextColor(43, 54, 116); // Blue Value
      doc.setFont("helvetica", "normal");
      doc.text(emp.dept, col2X + 25, gridStartY);
 
      // ID
      doc.setTextColor(113, 128, 150); // Gray Label
      doc.setFont("helvetica", "bold");
      doc.text("Employee ID:", 14, gridStartY + rowGap);
 
      doc.setTextColor(43, 54, 116); // Blue Value
      doc.setFont("helvetica", "normal");
      doc.text(emp.id, 45, gridStartY + rowGap);
 
      // Designation
      doc.setTextColor(113, 128, 150); // Gray Label
      doc.setFont("helvetica", "bold");
      doc.text("Designation:", col2X, gridStartY + rowGap);
 
      doc.setTextColor(43, 54, 116); // Blue Value
      doc.setFont("helvetica", "normal");
      doc.text("", col2X + 25, gridStartY + rowGap);
 
      // --- Period Section ---
      doc.setTextColor(43, 54, 116);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Period: ${startDate} to ${endDate}`,
        14,
        gridStartY + rowGap * 2 + 5
      );
 
      // timesheet entries
      const empEntries: any[] = [];
 
      // Filter entries by date range
      const filteredEntries = empEntries.filter((entry) => {
        const d = new Date(entry.fullDate);
        const entryDateStr = d.toLocaleDateString("en-CA");
        return entryDateStr >= startDate && entryDateStr <= endDate;
      });
 
      const tableBody = filteredEntries.map((entry) => [
        entry.formattedDate,
        entry.dayName,
        "Office", // Location mock
        entry.loginTime || "-",
        entry.logoutTime || "-",
        calculateTotal(entry.loginTime || "", entry.logoutTime || ""),
        entry.status.toUpperCase(),
      ]);
 
      // --- Table Generation ---
      autoTable(doc, {
        startY: gridStartY + rowGap * 2 + 12,
        head: [
          ["Date", "Day", "Location", "Login", "Logout", "Total", "Status"],
        ],
        body: tableBody,
        theme: "plain", // We'll add custom styles
        styles: {
          fontSize: 9,
          font: "helvetica",
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [43, 54, 116], // #2B3674
          textColor: 255,
          fontStyle: "bold",
          halign: "left",
        },
        bodyStyles: {
          textColor: [80, 80, 80],
        },
        alternateRowStyles: {
          fillColor: [247, 250, 252], // Very light blue/gray
        },
        columnStyles: {
          6: { fontStyle: "bold" }, // Status column bold
        },
      });
    });
 
    doc.save(`Complete_Timesheet_Report_${startDate}_${endDate}.pdf`);
    setShowDownloadModal(false);
  };
 
  const renderAttendanceOverview = () => (
    <div
      className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <h2 className="text-xl font-bold text-[#1B254B]">
          Attendance Overview
        </h2>
 
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3AED0] w-4 h-4" />
            <input
              placeholder="Search by ID or Name..."
              className="pl-10 pr-4 py-2 bg-[#F4F7FE] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#4318FF] transition-all w-full sm:w-56"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
            />
          </div>
 
          {/* Filter UI - Static for design as requested */}
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-2 px-4 py-2 bg-[#F4F7FE] border border-transparent rounded-xl text-sm font-medium text-[#1B254B] hover:border-[#4318FF] transition-all whitespace-nowrap ${
                showFilter ? "border-[#4318FF] ring-2 ring-[#4318FF]/10" : ""
              }`}
            >
              <Filter size={16} className="text-[#A3AED0]" />
              <span>Filter</span>
            </button>
 
            {showFilter && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider mb-2">
                      Department
                    </h4>
                    <div className="grid grid-cols-1 gap-1">
                      {["All Departments", "IT Department", "HR"].map(
                        (item) => (
                          <button
                            key={item}
                            className="text-left px-3 py-1.5 rounded-lg text-sm text-[#2B3674] hover:bg-[#F4F7FE] transition-all"
                          >
                            {item}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <div className="h-px bg-gray-50" />
                  <div>
                    <h4 className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider mb-2">
                      Status
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {["Full Day", "Leave", "Incomplete"].map((item) => (
                        <button
                          key={item}
                          className="px-3 py-1 bg-[#F4F7FE] text-[#2B3674] rounded-full text-[11px] font-bold hover:bg-[#E0E5F2] transition-all"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
 
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button className="flex items-center gap-2 px-6 py-2.5 bg-[#00A3C4] text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-100/50 hover:bg-[#0093b1] transition-all">
          <Eye size={16} />
          View All Attendance
        </button>
        <button
          onClick={() => navigate("/admin-dashboard/registration")}
          className="flex items-center gap-2 px-6 py-2.5 border border-[#00A3C4] text-[#00A3C4] rounded-xl text-sm font-bold hover:bg-[#E6FFFA] transition-all"
        >
          <Users size={16} />
          View Employee List
        </button>
        <button
          onClick={() => setShowDownloadModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 text-[#1B254B] rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
        >
          <Download size={16} />
          Download Report
        </button>
      </div>
 
      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden">
        <MobileView
          employees={employees}
          onViewTimesheet={(id) => {
            navigate(`/admin-dashboard/timesheet/${id}`);
          }}
          onSelectEmployee={setSelectedEmpId}
        />
      </div>
 
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs font-bold text-[#A3AED0] uppercase tracking-wider text-center border-b border-gray-50">
              <th className="pb-4 text-left">Employee ID</th>
              <th className="pb-4 text-left">Employee Name</th>
              <th className="pb-4">Department</th>
              <th className="pb-4">Login Time</th>
              <th className="pb-4">Logout Time</th>
              <th className="pb-4">Total Hours</th>
              <th className="pb-4">Status</th>
              <th className="pb-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {employees.map((emp) => (
              <tr
                key={emp.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEmpId(emp.id);
                }}
                className={`group transition-all cursor-pointer ${
                  selectedEmpId === emp.id
                    ? "bg-[#F4F7FE]"
                    : "hover:bg-[#F4F7FE]/30"
                }`}
              >
                <td className="py-4 text-sm font-bold text-[#1B254B] border-l-4 border-transparent group-hover:border-[#4318FF] transition-all">
                  <div className="pl-4">{emp.id}</div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] border-2 border-white shadow-sm">
                      <UserOutlined style={{ fontSize: "20px" }} />
                    </div>
                    <span className="text-sm font-bold text-[#2B3674]">
                      {emp.name}
                    </span>
                  </div>
                </td>
                <td className="py-4 text-sm text-[#A3AED0] text-center">
                  {emp.dept}
                </td>
                <td className="py-4 text-sm font-medium text-[#2B3674] text-center font-mono">
                  {emp.login}
                </td>
                <td className="py-4 text-center">
                  {emp.logout === "Not logged out" ? (
                    <span className="text-xs font-bold text-[#FFB547] leading-tight flex flex-col items-center">
                      Not logged <span>out</span>
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-[#2B3674] font-mono">
                      {emp.logout}
                    </span>
                  )}
                </td>
                <td className="py-4 text-sm font-bold text-[#1B254B] text-center">
                  {emp.hours}
                </td>
                <td className="py-4 text-center">
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                                        ${
                                          emp.status === "Full Day"
                                            ? "bg-[#E6FFFA] text-[#01B574]"
                                            : emp.status === "Incomplete"
                                            ? "bg-[#FFF9E5] text-[#FFB547]"
                                            : "bg-[#FFF5F5] text-[#EE5D50]"
                                        }
                                    `}
                  >
                    {emp.status}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin-dashboard/timesheet/${emp.id}`);
                    }}
                    className="p-2 rounded-lg text-[#00A3C4] hover:bg-[#E0F7FA] transition-colors"
                  >
                    <Eye size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
 
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
        <div className="text-sm text-[#A3AED0]">
          {" "}
          <span className="font-bold text-[#2B3674]">
            {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
          </span>{" "}
          to{" "}
          <span className="font-bold text-[#2B3674]">
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{" "}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg border transition-all ${
              currentPage === 1
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border-[#E0E5F2] text-[#2B3674] hover:bg-[#F4F7FE] hover:border-[#4318FF]"
            }`}
          >
            <ChevronLeft size={18} />
          </button>
 
          {Array.from(
            { length: Math.ceil(totalItems / itemsPerPage) },
            (_, i) => i + 1
          ).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                currentPage === page
                  ? "bg-[#4318FF] text-white shadow-lg shadow-purple-100"
                  : "text-[#2B3674] hover:bg-[#F4F7FE]"
              }`}
            >
              {page}
            </button>
          ))}
 
          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(Math.ceil(totalItems / itemsPerPage), prev + 1)
              )
            }
            disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
            className={`p-2 rounded-lg border transition-all ${
              currentPage === Math.ceil(totalItems / itemsPerPage)
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border-[#E0E5F2] text-[#2B3674] hover:bg-[#F4F7FE] hover:border-[#4318FF]"
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
 
  const renderContent = () => {
    return (
      <>
        {/* Sticky Header */}
        <header className="bg-[#F4F7FE] md:bg-opacity-50 backdrop-blur-sm sticky top-0 z-20 px-4 py-4 flex items-center justify-between border-b border-gray-100/50">
          <h2 className="text-2xl font-bold text-[#2B3674]">Super Admin</h2>
 
          <div className="bg-white px-5 py-1.5 rounded-full shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-500">
              {new Date()
                .toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
                .replace(/,/g, " /")}
            </span>
          </div>
        </header>
 
        <div
          className="p-4 pb-20 space-y-6"
          onClick={() => setSelectedEmpId(null)}
        >
          {renderSummaryCards()}
 
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {renderAttendanceOverview()}
            <div
              className="w-full lg:w-[300px] lg:sticky top-24"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <Calendar entries={[]} now={new Date()} variant="sidebar" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };
 
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F4F7FE]">
      {renderContent()}
 
      {/* Download Modal - Global */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
 
            <h3 className="text-lg font-bold text-[#2B3674] mb-4">
              Download Organization Report
            </h3>
 
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] outline-none"
                />
              </div>
 
              <button
                onClick={handleDownloadReport}
                className="w-full py-2.5 bg-[#00A3C4] text-white font-bold rounded-lg hover:bg-[#0093b1] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Download size={18} />
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default AdminDashboard;
 
 