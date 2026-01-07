import { useState } from "react";
import SidebarLayout from "./SidebarLayout";
import Calendar from "../EmployeeDashboard/Calendar";
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
import EmployeeTimesheetView from "./EmployeeTimesheetView";
import { TimesheetEntry } from "../types";
import MobileView from "./mobileView";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("System Dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [showTimesheet, setShowTimesheet] = useState(false);
  const [viewingEmpId, setViewingEmpId] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState(new Date(2026, 0, 5));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // PDF Download State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");

  // Mock employee data
  const employees = [
    {
      id: "EMP001",
      name: "Rajesh Kumar",
      dept: "IT Department",
      login: "09:15 AM",
      logout: "06:45 PM",
      hours: "9h 30m",
      status: "Present",
      avatar: "https://i.pravatar.cc/150?u=EMP001",
    },
    {
      id: "EMP002",
      name: "Priya Sharma",
      dept: "HR",
      login: "08:30 AM",
      logout: "05:00 PM",
      hours: "8h 30m",
      status: "Present",
      avatar: "https://i.pravatar.cc/150?u=EMP002",
    },
    {
      id: "EMP003",
      name: "Amit Patel",
      dept: "IT Department",
      login: "10:00 AM",
      logout: "Not logged out",
      hours: "--",
      status: "Incomplete",
      avatar: "https://i.pravatar.cc/150?u=EMP003",
    },
    {
      id: "EMP004",
      name: "Sneha Reddy",
      dept: "HR",
      login: "09:00 AM",
      logout: "06:15 PM",
      hours: "9h 15m",
      status: "Present",
      avatar: "https://i.pravatar.cc/150?u=EMP004",
    },
    {
      id: "EMP005",
      name: "Vikram Singh",
      dept: "HR",
      login: "--",
      logout: "--",
      hours: "--",
      status: "Absent",
      avatar: "https://i.pravatar.cc/150?u=EMP005",
    },
    {
      id: "EMP006",
      name: "Ananya Iyer",
      dept: "HR",
      login: "08:45 AM",
      logout: "05:30 PM",
      hours: "8h 45m",
      status: "Present",
      avatar: "https://i.pravatar.cc/150?u=EMP006",
    },
    {
      id: "EMP007",
      name: "Karthik Menon",
      dept: "IT Department",
      login: "09:30 AM",
      logout: "07:00 PM",
      hours: "9h 30m",
      status: "Present",
      avatar: "https://i.pravatar.cc/150?u=EMP007",
    },
    {
      id: "EMP008",
      name: "Divya Nair",
      dept: "HR",
      login: "--",
      logout: "--",
      hours: "--",
      status: "Absent",
      avatar: "https://i.pravatar.cc/150?u=EMP008",
    },
    {
      id: "EMP009",
      name: "Arjun Desai",
      dept: "HR",
      login: "08:50 AM",
      logout: "05:20 PM",
      hours: "8h 30m",
      status: "Present",
      avatar: "https://i.pravatar.cc/150?u=EMP009",
    },
    {
      id: "EMP010",
      name: "Meera Joshi",
      dept: "HR",
      login: "09:10 AM",
      logout: "06:00 PM",
      hours: "8h 50m",
      status: "Present",
      avatar: "https://i.pravatar.cc/150?u=EMP010",
    },
    {
      id: "EMP011",
      name: "Rohan Kapoor",
      dept: "IT Department",
      login: "10:30 AM",
      logout: "Not logged out",
      hours: "--",
      status: "Incomplete",
      avatar: "https://i.pravatar.cc/150?u=EMP011",
    },
    {
      id: "EMP012",
      name: "Kavya Rao",
      dept: "HR",
      login: "08:20 AM",
      logout: "04:50 PM",
      hours: "8h 30m",
      status: "Present",
      avatar: "https://i.pravatar.cc/150?u=EMP012",
    },
    {
      id: "EMP013",
      name: "Sanjay Gupta",
      dept: "HR",
      login: "09:05 AM",
      logout: "06:30 PM",
      hours: "9h 25m",
      status: "Present",
      avatar: "https://i.pravatar.cc/150?u=EMP013",
    },
    {
      id: "EMP014",
      name: "Pooja Verma",
      dept: "HR",
      login: "08:55 AM",
      logout: "05:40 PM",
      hours: "8h 45m",
      status: "Present",
      avatar: "https://i.pravatar.cc/150?u=EMP014",
    },
    {
      id: "EMP015",
      name: "Aditya Malhotra",
      dept: "IT Department",
      login: "--",
      logout: "--",
      hours: "--",
      status: "Absent",
      avatar: "https://i.pravatar.cc/150?u=EMP015",
    },
  ];

  // Filter Logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      selectedDepartment === "All" || emp.dept === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  // Generate mock entries for the calendar based on employee status
  const getMockEntries = (empId: string | null) => {
    if (!empId) return [];
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return [];

    const daysInMonth = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth() + 1,
      0
    ).getDate();
    const data: TimesheetEntry[] = [];
    const now = new Date(2026, 0, 5); // Fixed now for mock

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(
        displayDate.getFullYear(),
        displayDate.getMonth(),
        i
      );
      const isToday =
        i === now.getDate() &&
        displayDate.getMonth() === now.getMonth() &&
        displayDate.getFullYear() === now.getFullYear();
      const isFuture =
        displayDate.getFullYear() > now.getFullYear() ||
        (displayDate.getFullYear() === now.getFullYear() &&
          displayDate.getMonth() > now.getMonth()) ||
        (displayDate.getFullYear() === now.getFullYear() &&
          displayDate.getMonth() === now.getMonth() &&
          i > now.getDate());

      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      let loginTime = "";
      let logoutTime = "";
      let status: TimesheetEntry["status"] = "Absent";
      let attendanceType: TimesheetEntry["attendanceType"] = "login";

      if (!isFuture && !isWeekend) {
        // Create employee-specific absent days based on their ID
        const empNumber = parseInt(emp.id.replace("EMP", ""));
        const absentDays = [
          (empNumber % 31) + 1, // First absent day based on employee number
          ((empNumber * 2) % 31) + 1, // Second absent day
        ].filter((day) => day <= daysInMonth && day !== now.getDate()); // Exclude today and invalid days

        if (absentDays.includes(i)) {
          loginTime = "--";
          logoutTime = "--";
          status = "Absent";
          attendanceType = null;
        } else if (isToday) {
          loginTime = "";
          attendanceType = null;
          status = "Present";
        } else {
          loginTime = emp.login !== "--" ? emp.login : "09:00 AM";
          logoutTime =
            emp.logout !== "--" && emp.logout !== "Not logged out"
              ? emp.logout
              : "06:00 PM";
          status = "Present";
          attendanceType = "logout";
        }
      }

      data.push({
        date: i,
        fullDate: date,
        dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
        formattedDate: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        isToday,
        isWeekend,
        isFuture,
        attendanceType,
        loginTime: loginTime as any,
        logoutTime: logoutTime as any,
        status: isWeekend ? "Absent" : status,
        isEditing: false,
        isSaved: false,
      });
    }
    return data;
  };

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
    const totalEmployees = filteredEmployees.length;
    const presentCount = filteredEmployees.filter(
      (e) => e.status === "Present"
    ).length;
    const absentCount = filteredEmployees.filter(
      (e) => e.status === "Absent"
    ).length;
    const presentPercentage =
      totalEmployees > 0
        ? ((presentCount / totalEmployees) * 100).toFixed(1)
        : "0.0";
    const absentPercentage =
      totalEmployees > 0
        ? ((absentCount / totalEmployees) * 100).toFixed(1)
        : "0.0";

    // Calculate average hours
    const workingHours = filteredEmployees
      .filter((e) => e.status === "Present" && e.hours !== "--")
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
              {totalEmployees}
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
              {absentCount}
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

    filteredEmployees.forEach((emp, index) => {
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

      // Row 2: ID & Designation
      // ID
      doc.setTextColor(113, 128, 150); // Gray Label
      doc.setFont("helvetica", "bold");
      doc.text("Employee ID:", 14, gridStartY + rowGap);

      doc.setTextColor(43, 54, 116); // Blue Value
      doc.setFont("helvetica", "normal");
      doc.text(emp.id, 45, gridStartY + rowGap);

      // Designation (Mock)
      doc.setTextColor(113, 128, 150); // Gray Label
      doc.setFont("helvetica", "bold");
      doc.text("Designation:", col2X, gridStartY + rowGap);

      doc.setTextColor(43, 54, 116); // Blue Value
      doc.setFont("helvetica", "normal");
      doc.text("Senior Developer", col2X + 25, gridStartY + rowGap);

      // --- Period Section ---
      doc.setTextColor(43, 54, 116);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Period: ${startDate} to ${endDate}`,
        14,
        gridStartY + rowGap * 2 + 5
      );

      // --- Table Data Preparation ---
      const empEntries = getMockEntries(emp.id);

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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-[#F4F7FE] px-4 py-2 rounded-xl text-sm font-medium text-[#1B254B] cursor-pointer whitespace-nowrap relative group">
            <Filter size={16} className="text-[#A3AED0]" />
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1); // Reset to page 1 on filter change
              }}
              className="bg-transparent border-none outline-none appearance-none pr-6 cursor-pointer text-[#1B254B] font-bold"
            >
              <option value="All">All Departments</option>
              <option value="IT Department">IT Department</option>
              <option value="HR">HR</option>
            </select>
            {/* Custom Arrow because appearance-none removes default */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="text-gray-400 text-xs">▼</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button className="flex items-center gap-2 px-6 py-2.5 bg-[#00A3C4] text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-100/50 hover:bg-[#0093b1] transition-all">
          <Eye size={16} />
          View All Attendance
        </button>
        <button className="flex items-center gap-2 px-6 py-2.5 border border-[#00A3C4] text-[#00A3C4] rounded-xl text-sm font-bold hover:bg-[#E6FFFA] transition-all">
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
          employees={filteredEmployees.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
          )}
          onViewTimesheet={(id) => {
            setViewingEmpId(id);
            setShowTimesheet(true);
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
            {filteredEmployees
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((emp) => (
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
                                          emp.status === "Present"
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
                        setViewingEmpId(emp.id);
                        setShowTimesheet(true);
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
            {Math.min(
              (currentPage - 1) * itemsPerPage + 1,
              filteredEmployees.length
            )}
          </span>{" "}
          to{" "}
          <span className="font-bold text-[#2B3674]">
            {Math.min(currentPage * itemsPerPage, filteredEmployees.length)}
          </span>{" "}
          {/* of{" "}
          <span className="font-bold text-[#2B3674]">
            {filteredEmployees.length}
          </span>{" "} */}
          {/* employees */}
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
            { length: Math.ceil(filteredEmployees.length / itemsPerPage) },
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
                Math.min(
                  Math.ceil(filteredEmployees.length / itemsPerPage),
                  prev + 1
                )
              )
            }
            disabled={
              currentPage === Math.ceil(filteredEmployees.length / itemsPerPage)
            }
            className={`p-2 rounded-lg border transition-all ${
              currentPage === Math.ceil(filteredEmployees.length / itemsPerPage)
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
    if (showTimesheet && viewingEmpId) {
      return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F7FE]">
          <div className="p-4 pb-0">
            <button
              onClick={() => setShowTimesheet(false)}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#2B3674] rounded-xl text-sm font-bold shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
            >
              <ChevronLeft size={18} />
              Back
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <EmployeeTimesheetView
              entries={getMockEntries(viewingEmpId)}
              calculateTotal={calculateTotal}
              displayDate={displayDate}
              onPrevMonth={() => {
                const newDate = new Date(displayDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setDisplayDate(newDate);
              }}
              onNextMonth={() => {
                const newDate = new Date(displayDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setDisplayDate(newDate);
              }}
              employeeName={
                employees.find((e) => e.id === viewingEmpId)?.name || "Employee"
              }
            />
          </div>
        </div>
      );
    }

    if (activeTab === "User & Role Management") {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-[#2B3674]">
            User & Role Management
          </h1>
          <p className="text-gray-500 mt-2">
            Control user access and assign administrative roles.
          </p>
        </div>
      );
    }

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
                <Calendar
                  entries={getMockEntries(selectedEmpId)}
                  now={new Date(2026, 0, 5)}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] overflow-hidden bg-[#F4F7FE]">
      <SidebarLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </SidebarLayout>

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
