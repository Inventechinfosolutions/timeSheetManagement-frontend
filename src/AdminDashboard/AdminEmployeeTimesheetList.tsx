import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { getEntities } from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  Edit,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
} from "lucide-react";
import EmployeeTimeSheetMobileCard from "./EmployeeTimeSheetMobileCard";

const AdminEmployeeTimesheetList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const departments = [
    "All",
    "HR",
    "IT",
    "Sales",
    "Marketing",
    "Finance",
    "Admin",
  ];

  const dispatch = useAppDispatch();
  const { entities, totalItems } = useAppSelector(
    (state: RootState) => state.employeeDetails,
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(
      getEntities({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        sort: sortConfig.key || undefined,
        order: sortConfig.key ? sortConfig.direction.toUpperCase() : undefined,
        department:
          selectedDepartment === "All" ? undefined : selectedDepartment,
      }),
    );
  }, [
    dispatch,
    currentPage,
    debouncedSearchTerm,
    sortConfig,
    selectedDepartment,
  ]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const employees = entities.map((emp: any) => ({
    id: emp.employeeId || emp.id,
    name: emp.fullName || emp.name,
    department: emp.department,
  }));

  const currentItems = employees.filter((emp) => {
    if (!debouncedSearchTerm) return true;
    const s = debouncedSearchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(s) ||
      emp.id.toString().toLowerCase().includes(s) ||
      (emp.department && emp.department.toLowerCase().includes(s))
    );
  });
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleViewTimesheet = (empId: string) => {
    navigate(`/admin-dashboard/timesheet/${empId}`);
  };

  const handleViewWorkingDetails = (empId: string) => {
    navigate(`/admin-dashboard/working-details/${empId}`);
  };

  return (
    <div className="p-5 bg-[#F4F7FE] min-h-screen font-sans">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-[#2B3674] m-0">
            Employee Timesheet
          </h1>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Modern Custom Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-5 py-2.5 bg-white rounded-full shadow-[0px_18px_40px_rgba(112,144,176,0.12)] text-[#2B3674] font-bold text-sm hover:bg-gray-50 transition-all border border-transparent focus:border-[#4318FF]/20"
              >
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-[#4318FF]" />
                  <span>{selectedDepartment}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-[#A3AED0] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full sm:w-48 bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.1)] border border-white/20 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-1 mb-1">
                    <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest pl-2">
                      Departments
                    </span>
                  </div>
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => {
                        setSelectedDepartment(dept);
                        setIsDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-5 py-2 text-sm font-semibold transition-colors
                      ${
                        selectedDepartment === dept
                          ? "text-[#4318FF] bg-[#4318FF]/5"
                          : "text-[#2B3674] hover:bg-gray-50 hover:text-[#4318FF]"
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Box */}
            <div className="flex items-center bg-white rounded-full px-5 py-2.5 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] min-w-0 sm:min-w-[250px] flex-1 border border-transparent focus-within:border-[#4318FF]/20 transition-all">
              <Search size={18} className="text-[#A3AED0] mr-2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-none outline-none bg-transparent text-[#2B3674] w-full text-sm font-semibold placeholder:text-[#A3AED0]/60"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-0 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] overflow-hidden border border-gray-100">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#4318FF] text-white">
                  <th
                    className="text-left py-4 pl-10 pr-4 text-[13px] font-bold uppercase tracking-wider cursor-pointer select-none hover:bg-[#3d16e5] transition-colors"
                    onClick={() => handleSort("fullName")}
                  >
                    Name
                  </th>
                  <th
                    className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider cursor-pointer select-none hover:bg-[#3d16e5] transition-colors"
                    onClick={() => handleSort("employeeId")}
                  >
                    ID
                  </th>
                  <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                    Department
                  </th>
                  <th className="py-4 pl-4 pr-10 text-[13px] font-bold uppercase tracking-wider text-center w-48">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentItems.map((emp, index) => (
                  <tr
                    key={emp.id}
                    className={`group transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} hover:bg-[#F1F4FF] cursor-pointer`}
                  >
                    <td className="py-4 pl-10 pr-4 text-[#2B3674] text-sm font-bold">
                      {emp.name}
                    </td>
                    <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold">
                      {emp.id}
                    </td>
                    <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold">
                      {emp.department || "General"}
                    </td>
                    <td className="py-4 pl-4 pr-10 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => handleViewWorkingDetails(emp.id)}
                          className="inline-flex items-center gap-2 bg-transparent border-none cursor-pointer text-[#4318FF] text-sm font-bold hover:underline transition-all hover:scale-105 active:scale-95"
                          title="View Working Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleViewTimesheet(emp.id)}
                          className="inline-flex items-center gap-2 bg-transparent border-none cursor-pointer text-[#4318FF] text-sm font-bold hover:underline transition-all hover:scale-105 active:scale-95"
                          title="Edit Timesheet"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="block lg:hidden p-4">
            {currentItems.length > 0 ? (
              <EmployeeTimeSheetMobileCard
                employees={currentItems}
                onViewTimesheet={handleViewTimesheet}
                onViewWorkingDetails={handleViewWorkingDetails}
              />
            ) : null}
          </div>

          {currentItems.length === 0 && (
            <div className="py-24 text-center text-[#A3AED0] font-bold bg-white">
              <div className="flex flex-col items-center gap-3">
                <Search size={40} className="text-[#E0E5F2]" />
                <span>No employees found matching your criteria</span>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-6 lg:px-10 lg:pb-10 gap-6">
            <div className="text-sm font-bold text-[#A3AED0] text-center sm:text-left">
              Showing{" "}
              <span className="text-[#2B3674]">
                {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="text-[#2B3674]">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{" "}
              of <span className="text-[#2B3674]">{totalItems}</span> entries
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-xl border border-[#E9EDF7] transition-all flex items-center justify-center
                ${
                  currentPage === 1
                    ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                    : "bg-white text-[#4318FF] hover:bg-[#4318FF]/5 active:scale-90 shadow-sm"
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="bg-[#F4F7FE] px-4 py-1.5 rounded-xl border border-transparent">
                <span className="text-xs font-black text-[#2B3674] tracking-widest">
                  {currentPage} / {totalPages > 0 ? totalPages : 1}
                </span>
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`p-2 rounded-xl border border-[#E9EDF7] transition-all flex items-center justify-center
                ${
                  currentPage === totalPages || totalPages === 0
                    ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                    : "bg-white text-[#4318FF] hover:bg-[#4318FF]/5 active:scale-90 shadow-sm"
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEmployeeTimesheetList;
