import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  Check,
  ChevronDown,
  Filter,
  Users,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import {
  getEntities,
  getEntitiesSelect,
  fetchDepartments,
  fetchManagers,
} from "../reducers/employeeDetails.reducer";
import {
  createManagerMapping,
  getManagerMappingHistory,
  getMappedEmployeeIds,
} from "../reducers/managerMapping.reducer";

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  role: string;
}

interface ManagerMapping {
  id: number;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  department: string;
  status: "ACTIVE" | "INACTIVE";
  createdDate: string;
}

const ManagerMapping: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    entities: employees,
    departments,
    managers,
  } = useAppSelector((state: RootState) => state.employeeDetails);
  const {
    historyEntities: groupedMappings,
    mappedEmployeeIds,
    loading: mappingLoading,
  } = useAppSelector((state: RootState) => state.managerMapping);
  const navigate = useNavigate();

  // State management
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedManager, setSelectedManager] = useState<Employee | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(getManagerMappingHistory());
    dispatch(getMappedEmployeeIds());
  }, [dispatch]);

  // Filter managers by department and role
  const availableManagers = useMemo(() => {
    return managers.filter((emp: Employee) => {
      // API already filters by role, so we just check dept if needed (though API does that too)
      const matchesDept =
        selectedDepartment === "All Departments" ||
        emp.department === selectedDepartment;
      return matchesDept;
    });
  }, [managers, selectedDepartment]);

  // Filter available employees
  const availableEmployees = useMemo(() => {
    return employees.filter((emp: Employee) => {
      // If we are strictly fetching employees now, this check confirms it
      const isEmployee = emp.role === "EMPLOYEE";
      const matchesDept =
        selectedDepartment === "All Departments" ||
        emp.department === selectedDepartment;
      const matchesSearch =
        emp.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchText.toLowerCase());
      const notAssigned = !assignedEmployees.some(
        (assigned) => assigned.id === emp.id,
      );
      // Check if employee is already mapped in the database
      const isAlreadyMapped = mappedEmployeeIds.includes(emp.employeeId);

      return (
        isEmployee &&
        matchesDept &&
        matchesSearch &&
        notAssigned &&
        !isAlreadyMapped
      );
    });
  }, [
    employees,
    selectedDepartment,
    searchText,
    assignedEmployees,
    mappedEmployeeIds,
  ]);

  // Handlers
  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    setSelectedManager(null);
    setAssignedEmployees([]);
    setSelectedEmployees([]);
    setIsDeptDropdownOpen(false);

    // Fetch managers for selected department
    if (dept === "All Departments") {
      dispatch(fetchManagers({}));
    } else {
      dispatch(fetchManagers({ department: dept }));
    }
  };

  const handleManagerSelect = (manager: Employee) => {
    setSelectedManager(manager);
    setAssignedEmployees([]);
    setSelectedEmployees([]);

    // Fetch employees for selected department to assign
    const dept =
      selectedDepartment === "All Departments" ? undefined : selectedDepartment;
    dispatch(getEntitiesSelect({ department: dept, role: "EMPLOYEE" }));
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  const handleAssign = () => {
    const employeesToAssign = employees.filter((emp) =>
      selectedEmployees.includes(emp.id),
    );
    setAssignedEmployees((prev) => [...prev, ...employeesToAssign]);
    setSelectedEmployees([]);
  };

  const handleUnassign = (employeeId: string) => {
    setAssignedEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
  };

  const handleConfirmMapping = async () => {
    if (!selectedManager) return;

    for (const employee of assignedEmployees) {
      await dispatch(
        createManagerMapping({
          managerName: selectedManager.fullName,
          employeeId: employee.employeeId,
          employeeName: employee.fullName,
          department: selectedDepartment,
          status: "ACTIVE",
        }),
      );
    }

    await dispatch(getManagerMappingHistory());
    await dispatch(getMappedEmployeeIds());
    setIsConfirmModalOpen(false);
    handleClear();
  };

  const handleClear = () => {
    setSelectedDepartment("");
    setSelectedManager(null);
    setAssignedEmployees([]);
    setSelectedEmployees([]);
    setSearchText("");
  };

  return (
    <div className="p-4 md:p-8 bg-[#F4F7FE] min-h-screen font-['DM_Sans',sans-serif]">
      {/* Header Card */}
      <div className="bg-white rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] p-6 mb-6">
        <h1 className="text-2xl font-bold text-[#2B3674] mb-2">
          Manager Mapping
        </h1>
        <p className="text-sm text-[#A3AED0] font-medium">
          Assign employees to managers based on department
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Department Dropdown */}
          <div>
            <label className="block text-sm font-bold text-[#2B3674] mb-2">
              Department
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#2B3674] font-medium hover:border-[#4318FF] transition-colors"
              >
                <span>{selectedDepartment || "Select Department"}</span>
                <ChevronDown
                  size={20}
                  className={`text-[#A3AED0] transition-transform ${isDeptDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isDeptDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => handleDepartmentChange("All Departments")}
                    className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#F4F7FE] ${selectedDepartment === "All Departments" ? "text-[#4318FF] bg-[#4318FF]/5" : "text-[#2B3674]"}`}
                  >
                    All Departments
                  </button>
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => handleDepartmentChange(dept)}
                      className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#F4F7FE] ${selectedDepartment === dept ? "text-[#4318FF] bg-[#4318FF]/5" : "text-[#2B3674]"}`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Manager Dropdown */}
          <div>
            <label className="block text-sm font-bold text-[#2B3674] mb-2">
              Manager
            </label>
            <select
              value={selectedManager?.id || ""}
              onChange={(e) => {
                const manager = availableManagers.find(
                  (m) => String(m.id) === e.target.value,
                );
                if (manager) handleManagerSelect(manager);
              }}
              disabled={selectedDepartment === "All Departments"}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#2B3674] font-medium hover:border-[#4318FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Manager</option>
              {availableManagers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.fullName} ({manager.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content - Only show when department and manager are selected */}
      {selectedDepartment !== "All Departments" && selectedManager && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 mb-6">
          {/* Available Employees */}
          <div className="bg-white rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#2B3674]">
                Available Employees
              </h3>
              <span className="text-xs font-bold text-[#A3AED0]">
                {availableEmployees.length} available
              </span>
            </div>

            {/* Select All */}
            {availableEmployees.length > 0 && (
              <div className="flex items-center gap-3 mb-4 px-1">
                <div
                  onClick={() => {
                    if (
                      selectedEmployees.length === availableEmployees.length
                    ) {
                      setSelectedEmployees([]);
                    } else {
                      setSelectedEmployees(availableEmployees.map((e) => e.id));
                    }
                  }}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                    selectedEmployees.length === availableEmployees.length
                      ? "bg-[#4318FF] border-[#4318FF]"
                      : "border-gray-300"
                  }`}
                >
                  {selectedEmployees.length === availableEmployees.length && (
                    <Check size={14} className="text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-[#2B3674]">
                  Select All
                </span>
              </div>
            )}

            {/* Search */}
            <div className="relative mb-4">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3AED0]"
              />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F4F7FE] border border-transparent rounded-xl text-sm font-medium outline-none focus:border-[#4318FF] transition-colors"
              />
            </div>

            {/* Employee List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {availableEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => toggleEmployeeSelection(emp.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    selectedEmployees.includes(emp.id)
                      ? "bg-[#4318FF]/10 border-2 border-[#4318FF]"
                      : "bg-[#F4F7FE] hover:bg-[#F4F7FE]/70 border-2 border-transparent"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      selectedEmployees.includes(emp.id)
                        ? "bg-[#4318FF] border-[#4318FF]"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedEmployees.includes(emp.id) && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#2B3674] truncate">
                      {emp.fullName}
                    </p>
                    <p className="text-xs text-[#A3AED0] font-medium">
                      {emp.employeeId}
                    </p>
                  </div>
                </div>
              ))}
              {availableEmployees.length === 0 && (
                <div className="text-center py-8 text-[#A3AED0]">
                  <Users size={48} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No employees available</p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Buttons */}
          <div className="flex lg:flex-col items-center justify-center gap-4">
            <button
              onClick={handleAssign}
              disabled={selectedEmployees.length === 0}
              className="p-4 bg-[#4318FF] text-white rounded-full hover:bg-[#3311DD] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              title="Assign selected employees"
            >
              <ArrowRight size={24} />
            </button>
          </div>

          {/* Assigned Employees */}
          <div className="flex flex-col gap-4 bg-gradient-to-br from-[#4318FF] to-[#868CFF] rounded-[24px] shadow-[0px_18px_40px_rgba(67,24,255,0.3)] p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Assigned Employees</h3>
              <div className="flex items-center gap-4">
                {assignedEmployees.length > 0 && (
                  <button
                    onClick={() => setAssignedEmployees([])}
                    className="text-xs font-bold px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                  >
                    Remove All
                  </button>
                )}
                <span className="text-xs font-bold opacity-80">
                  {assignedEmployees.length} assigned
                </span>
              </div>
            </div>

            {/* Assigned List */}
            <div className="space-y-2 max-h-[450px] overflow-y-auto">
              {assignedEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{emp.fullName}</p>
                    <p className="text-xs opacity-80">{emp.employeeId}</p>
                  </div>
                  <button
                    onClick={() => handleUnassign(emp.id)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Remove assignment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {assignedEmployees.length === 0 && (
                <div className="text-center py-8 opacity-60">
                  <Users size={48} className="mx-auto mb-2" />
                  <p className="text-sm font-medium">
                    No employees assigned yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {selectedDepartment && selectedManager && (
        <div className="flex gap-4 justify-center mt-4">
          <button
            onClick={handleClear}
            className="px-6 py-3 bg-white border-2 border-gray-200 text-[#2B3674] rounded-xl font-bold hover:border-[#4318FF] hover:text-[#4318FF] transition-all"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={assignedEmployees.length === 0}
            className="px-6 py-3 bg-[#4318FF] text-white rounded-xl font-bold hover:bg-[#3311DD] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            Confirm Mapping
          </button>
        </div>
      )}

      {/* Mapping History */}
      <div className="bg-white rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] p-6">
        <h3 className="text-lg font-bold text-[#2B3674] mb-4">
          Mapping History
        </h3>
        {mappingLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4318FF]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#4318FF] text-white">
                  <th className="text-left py-4 pl-10 pr-4 text-[13px] font-bold uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                    Manager ID
                  </th>
                  <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                    Total Employees Count
                  </th>
                  <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                    Department
                  </th>
                  <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-4 pl-4 pr-10 text-[13px] font-bold uppercase tracking-wider text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {groupedMappings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[#A3AED0]">
                      <Filter size={48} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">
                        No mapping history available
                      </p>
                    </td>
                  </tr>
                ) : (
                  groupedMappings.map((mapping: any, index: number) => (
                    <tr
                      key={`${mapping.managerId}-${mapping.department}`}
                      className={`group transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} hover:bg-[#F1F4FF] cursor-pointer`}
                    >
                      <td className="py-4 pl-10 pr-4 text-[#2B3674] text-sm font-bold">
                        {mapping.managerName}
                      </td>
                      <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold">
                        {mapping.managerId}
                      </td>
                      <td className="py-4 px-4 text-center text-[#2B3674] text-sm font-bold">
                        {mapping.employeeCount}
                      </td>
                      <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold">
                        {mapping.department}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                            mapping.status === "ACTIVE"
                              ? "bg-green-50 text-green-500 border-green-100"
                              : "bg-red-50 text-red-500 border-red-100"
                          }`}
                        >
                          {mapping.status}
                        </span>
                      </td>
                      <td className="py-4 pl-4 pr-10 text-center">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin-dashboard/manager-employees/${mapping.managerId}`,
                            )
                          }
                          className="inline-flex items-center gap-2 bg-transparent border-none cursor-pointer text-[#4318FF] text-sm font-bold hover:underline transition-all hover:scale-105 active:scale-95"
                          title="View mapped employees"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#2B3674]/20 backdrop-blur-md"
            onClick={() => setIsConfirmModalOpen(false)}
          />
          <div className="relative bg-white rounded-[32px] shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-[#2B3674] mb-4">
              Confirm Manager Mapping
            </h2>
            <p className="text-[#A3AED0] mb-6">
              Are you sure you want to assign{" "}
              <span className="font-bold text-[#4318FF]">
                {assignedEmployees.length} employee(s)
              </span>{" "}
              to{" "}
              <span className="font-bold text-[#4318FF]">
                {selectedManager?.fullName}
              </span>
              ?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-[#2B3674] rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMapping}
                className="flex-1 px-6 py-3 bg-[#4318FF] text-white rounded-xl font-bold hover:bg-[#3311DD] transition-all shadow-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerMapping;
