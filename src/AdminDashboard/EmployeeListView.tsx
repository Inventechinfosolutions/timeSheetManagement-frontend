import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RootState } from "../store";
import {
  getEntities,
  getEntity,
  bulkUploadEmployees,
  clearUploadResult,
  downloadBulkTemplate,
  createEntity,
  resendActivationLink,
  updateEmployeeStatus,
  fetchRoles,
} from "../reducers/employeeDetails.reducer";
import { fetchDepartments } from "../reducers/masterDepartment.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  Pencil,
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Upload,
  X,
  AlertCircle,
  User,
  Mail,
  Briefcase,
  Building,
  Loader2,
  RefreshCw,
  CheckCircle,
  CreditCard,
  Eye,
  Calendar,
  Cake,
  Download,
  LayoutDashboard,
} from "lucide-react";
import EmployeeListMobileCard from "./EmployeeListMobileCard";
import Toast from "../components/Toast";
import { SearchBox } from "../components/ui";
import { UserType, EmploymentType, UserStatus } from "../enums";
import { isAdminAccess, isEmployeeRole } from "../utils/roleAccess";

const EmployeeListView = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = location.pathname.startsWith("/manager-dashboard")
    ? "/manager-dashboard"
    : "/admin-dashboard";

  const isAdmin = basePath === "/admin-dashboard";
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const isReceptionist = currentUser?.userType === UserType.RECEPTIONIST;
  const canEdit = isAdmin && !isReceptionist;

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
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "",
    department: "",
    designation: "",
    email: "",
    role: "",
    employmentType: "" as "" | EmploymentType,
    gender: "" as "" | "MALE" | "FEMALE",
    joiningDate: "",
    dateOfBirth: "",
  });
  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    employeeId: "",
    department: "",
    designation: "",
    email: "",
    role: "",
    employmentType: "",
    gender: "",
    joiningDate: "",
    dateOfBirth: "",
  });
  const [generalError, setGeneralError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  // Activation Modal State
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [selectedEmployeeForToggle, setSelectedEmployeeForToggle] =
    useState<any>(null);
  const [activationData, setActivationData] = useState<{
    link: string;
    message: string;
    loginId?: string;
    password?: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  // const [copySuccess, setCopySuccess] = useState<string>("");

  // const [copySuccess, setCopySuccess] = useState<string>("");

  const dispatch = useAppDispatch();
  const {
    entities,
    totalItems,
    uploadLoading,
    uploadResult,
    loading,
    roles,
    errorMessage,
  } = useAppSelector((state: RootState) => state.employeeDetails);
  const { departments } = useAppSelector(
    (state: RootState) => state.masterDepartments,
  );

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchRoles());
  }, [dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        includeSelf: !isAdmin,
        userStatus: selectedStatus === "All" ? undefined : selectedStatus,
      }),
    );
  }, [
    dispatch,
    currentPage,
    debouncedSearchTerm,
    sortConfig,
    selectedDepartment,
    selectedStatus,
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
    email: emp.email || "",
    department: emp.department,
    role: emp.role,
    userStatus: emp.userStatus,
    resetRequired: emp.resetRequired,
    rawId: emp.employeeId, // Store employeeId string for API calls
    createdAt: emp.createdAt,
    lastLoggedIn: emp.lastLoggedIn,
    lastLinkSentAt: emp.lastLinkSentAt,
    isActive: emp.userStatus !== UserStatus.INACTIVE,
    isAdmin: isAdminAccess(emp),
  }));

  const currentItems = employees.filter((emp) => {
    if (!debouncedSearchTerm) return true;
    const s = debouncedSearchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(s) ||
      emp.id.toString().toLowerCase().includes(s) ||
      (emp.email && emp.email.toLowerCase().includes(s)) ||
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

  const handleViewDashboard = (empId: string) => {
    navigate(`${basePath}/view-attendance/${empId}`);
  };

  const handleViewDetails = (empId: string) => {
    dispatch(getEntity(empId));
    navigate(`${basePath}/employee-details/${empId}?mode=view`, {
      state: { mode: "view", isEditing: false },
    });
  };

  const handleEditEmployee = (empId: string) => {
    dispatch(getEntity(empId));
    navigate(`${basePath}/employee-details/${empId}?mode=edit`, {
      state: { mode: "edit", isEditing: true },
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!validTypes.includes(file.type)) {
        setToast({
          message: "Please upload a valid Excel file (.xlsx or .xls)",
          type: "error",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await dispatch(bulkUploadEmployees(selectedFile));
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Close upload modal so only results show; Close on results returns to table
    setIsUploadModalOpen(false);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCloseResultModal = () => {
    dispatch(clearUploadResult());
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Refresh directory table with current filters
    dispatch(
      getEntities({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        sort: sortConfig.key || undefined,
        order: sortConfig.key ? sortConfig.direction.toUpperCase() : undefined,
        department:
          selectedDepartment === "All" ? undefined : selectedDepartment,
        includeSelf: !isAdmin,
        userStatus: selectedStatus === "All" ? undefined : selectedStatus,
      }),
    );
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]:
          name === "employmentType"
            ? (value as "" | EmploymentType)
            : name === "gender"
              ? (value as "" | "MALE" | "FEMALE")
              : value,
      };
      // Only the Employee role can be an intern
      if (name === "role" && value && !isEmployeeRole(value)) {
        next.employmentType = "FULL_TIMER" as EmploymentType;
      }
      return next;
    });
    // Validation
    let error = "";
    switch (name) {
      case "fullName":
        if (value && !/^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(value)) {
          error = "Full Name should only contain letters";
        }
        break;
      case "employeeId":
        if (value && !/^[A-Z0-9-]+$/.test(value)) {
          error =
            "Employee ID should contain only uppercase letters, numbers, and hyphens";
        }
        break;
      case "designation":
        if (value && !/^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(value)) {
          error = "Designation should only contain letters";
        }
        break;
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "department":
        // No specific validation beyond required
        break;
      case "dateOfBirth":
        if (value && value > new Date().toISOString().slice(0, 10)) {
          error = "Date of birth cannot be in the future";
        }
        break;
      default:
        break;
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check for field errors
    const hasErrors = Object.values(fieldErrors).some((error) => error !== "");
    if (hasErrors) {
      return;
    }
    const requiredKeys = [
      "fullName",
      "employeeId",
      "department",
      "role",
      "designation",
      "employmentType",
      "gender",
      "email",
      "joiningDate",
    ];
    if (requiredKeys.some((k) => !(formData as Record<string, unknown>)[k])) {
      setGeneralError("Please fill in all required fields");
      return;
    }

    setGeneralError("");
    setShowSuccess(false);

    const { dateOfBirth, ...rest } = formData;
    const submitData = dateOfBirth ? { ...rest, dateOfBirth } : rest;

    try {
      const resultAction = await dispatch(createEntity(submitData));

      if (createEntity.fulfilled.match(resultAction)) {
        setShowSuccess(true);
        setGeneralError("");
        setTimeout(() => {
          handleCloseCreateModal();

          dispatch(
            getEntities({
              page: currentPage,
              limit: itemsPerPage,
              search: debouncedSearchTerm,
              department:
                selectedDepartment === "All" ? undefined : selectedDepartment,
              userStatus: selectedStatus === "All" ? undefined : selectedStatus,
            }),
          );
        }, 2000);
      } else if (createEntity.rejected.match(resultAction)) {
        const errorMsg =
          (resultAction.payload as string) || "Failed to create employee";
        console.error("Creation failed:", errorMsg);
        setGeneralError(errorMsg);
        setShowSuccess(false);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setGeneralError("An unexpected error occurred");
      setShowSuccess(false);
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormData({
      fullName: "",
      employeeId: "",
      department: "",
      designation: "",
      email: "",
      role: "",
      employmentType: "",
      gender: "",
      joiningDate: "",
      dateOfBirth: "",
    });
    setFieldErrors({
      fullName: "",
      employeeId: "",
      department: "",
      designation: "",
      email: "",
      role: "",
      employmentType: "",
      gender: "",
      joiningDate: "",
      dateOfBirth: "",
    });
    setGeneralError("");
    setShowSuccess(false);
  };

  const handleToggleStatus = (employeeId: string) => {
    const emp = entities.find(
      (e) => e.employeeId === employeeId || e.id === Number(employeeId),
    );
    setSelectedEmployeeForToggle(emp);
    setShowToggleConfirm(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedEmployeeForToggle) return;
    try {
      const newStatus =
        selectedEmployeeForToggle.userStatus !== "INACTIVE"
          ? "INACTIVE"
          : "ACTIVE";

      await dispatch(
        updateEmployeeStatus({
          employeeId: selectedEmployeeForToggle.employeeId,
          status: newStatus,
        }),
      ).unwrap();
      setShowToggleConfirm(false);
      setSelectedEmployeeForToggle(null);
      // Refresh the list
      dispatch(
        getEntities({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm,
          department:
            selectedDepartment === "All" ? undefined : selectedDepartment,
          userStatus: selectedStatus === "All" ? undefined : selectedStatus,
        }),
      );
    } catch (error: any) {
      console.error("Failed to toggle status:", error);
      setToast({
        message: "Failed to update status: " + (error.message || error),
        type: "error",
      });
      setShowToggleConfirm(false);
      setSelectedEmployeeForToggle(null);
    }
  };
  const handleDownloadClick = () => {
    setShowDownloadConfirm(true);
  };

  const confirmDownload = async () => {
    try {
      await dispatch(downloadBulkTemplate()).unwrap();
      setShowDownloadConfirm(false);
      setToast({
        message: "Template downloaded successfully!",
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to download template:", error);
      setToast({
        message: "Failed to download template: " + (error.message || error),
        type: "error",
      });
      setShowDownloadConfirm(false);
    }
  };

  const handleResendActivation = (employeeId: string) => {
    dispatch(resendActivationLink(employeeId)).then((result: any) => {
      if (!result.error) {
        setActivationData({
          link: result.payload.link,
          message: "Activation link shared successfully!",
          loginId: result.payload.loginId,
          password: result.payload.password,
        });
        setIsActivationModalOpen(true);

        // Refresh list to potentially update status if needed
        dispatch(
          getEntities({
            page: currentPage,
            limit: itemsPerPage,
            search: debouncedSearchTerm,
            department:
              selectedDepartment === "All" ? undefined : selectedDepartment,
            userStatus: selectedStatus === "All" ? undefined : selectedStatus,
          }),
        );
      } else {
        setToast({
          message:
            "Failed to send activation link: " +
            (result.payload || "Unknown error"),
          type: "error",
        });
      }
    });
  };

  // Handle success after employee creation - REMOVED to avoid conflict with direct handling
  // useEffect(() => {
  // if (updateSuccess && isCreateModalOpen) {
  // // ... Logic moved to handleCreateSubmit ...
  // }
  // }, ...);

  const departmentTagClass = (name: string, isSelected: boolean) =>
    isSelected
      ? "bg-[#4318FF] text-white border-[#4318FF] shadow-sm"
      : name === "All"
        ? "bg-gray-50 text-[#475569] border-gray-200 hover:bg-gray-100"
        : "bg-[#F4F7FE] text-[#4318FF] border-[#4318FF]/15 hover:bg-[#4318FF]/10";

  const statusTagClass = (status: string, isSelected: boolean) => {
    if (isSelected) {
      if (status === "ACTIVE") {
        return "bg-green-500 text-white border-green-500 shadow-sm";
      }
      if (status === "INACTIVE") {
        return "bg-red-500 text-white border-red-500 shadow-sm";
      }
      if (status === "DRAFT") {
        return "bg-gray-500 text-white border-gray-500 shadow-sm";
      }
      return "bg-[#4318FF] text-white border-[#4318FF] shadow-sm";
    }
    if (status === "ACTIVE") {
      return "bg-green-50 text-green-600 border-green-100 hover:bg-green-100";
    }
    if (status === "INACTIVE") {
      return "bg-red-50 text-red-600 border-red-100 hover:bg-red-100";
    }
    if (status === "DRAFT") {
      return "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100";
    }
    return "bg-gray-50 text-[#475569] border-gray-200 hover:bg-gray-100";
  };

  const formatStatusLabel = (status: string) => {
    if (status === "All") return "All Status";
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  return (
    <div className="p-5 bg-[#F4F7FE] font-sans">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-row flex-wrap justify-between items-center gap-3 mb-8">
          <div className="flex flex-row flex-wrap items-center gap-3">
            {/* Modern Custom Dropdown */}
            {canEdit && (
              <div className="relative min-w-[160px] sm:min-w-[180px]" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-5 py-2.5 bg-white rounded-full border border-gray-200 font-bold text-sm hover:bg-gray-50 transition-all focus:border-[#4318FF]/40 ${selectedDepartment !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Filter size={16} className="text-[#4318FF] shrink-0" />
                    <span className="truncate">
                      {selectedDepartment === "All" ? "All Departments" : selectedDepartment}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-[#A3AED0] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full min-w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.1)] border border-gray-100 p-3 z-50 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="mb-2">
                      <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">
                        Departments
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        key="All"
                        onClick={() => {
                          setSelectedDepartment("All");
                          setIsDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full flex items-center justify-center px-3 py-2 rounded-full text-xs font-bold border transition-all ${departmentTagClass("All", selectedDepartment === "All")}`}
                      >
                        All Departments
                      </button>
                      {departments.map((dept) => (
                        <button
                          key={dept.id}
                          onClick={() => {
                            setSelectedDepartment(dept.departmentName);
                            setIsDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full flex items-center justify-center px-3 py-2 rounded-full text-xs font-bold border transition-all text-center ${departmentTagClass(dept.departmentName, selectedDepartment === dept.departmentName)}`}
                        >
                          {dept.departmentName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modern Status Dropdown */}
            {canEdit && (
              <div className="relative min-w-[140px] sm:min-w-[160px]" ref={statusDropdownRef}>
                <button
                  onClick={() => {
                    setIsStatusDropdownOpen(!isStatusDropdownOpen);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-5 py-2.5 bg-white rounded-full border border-gray-200 font-bold text-sm hover:bg-gray-50 transition-all focus:border-[#4318FF]/40 ${selectedStatus !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Filter size={16} className="text-[#4318FF] shrink-0" />
                    <span className="truncate">
                      {selectedStatus === "All" ? "Status" : formatStatusLabel(selectedStatus)}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-[#A3AED0] transition-transform duration-300 ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isStatusDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full min-w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.1)] border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="mb-2">
                      <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">
                        Status
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {["All", "DRAFT", "ACTIVE", "INACTIVE"].map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setSelectedStatus(status);
                            setIsStatusDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full flex items-center justify-center px-3 py-2 rounded-full text-xs font-bold border transition-all ${statusTagClass(status, selectedStatus === status)}`}
                        >
                          {formatStatusLabel(status)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <SearchBox
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onDebounce={(val) => {
                setDebouncedSearchTerm(val);
                setCurrentPage(1);
              }}
              onClear={() => {
                setSearchTerm("");
                setDebouncedSearchTerm("");
                setCurrentPage(1);
              }}
              containerClassName="w-full min-w-[180px] sm:w-56"
              variant="outlined"
            />

            {basePath === "/admin-dashboard" && canEdit && (
              <>
                <button
                  onClick={handleDownloadClick}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#4318FF] text-white rounded-xl font-black text-xs transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:-translate-y-0.5 active:scale-95 tracking-widest uppercase cursor-pointer"
                  title="Download Excel Template"
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">Download Template</span>
                </button>

                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-[#4318FF] rounded-2xl font-black text-xs ring-1 ring-[#4318FF]/20 shadow-[0_8px_24px_-12px_rgba(67,24,255,0.35)] hover:bg-[#F4F7FE] hover:ring-[#4318FF]/40 hover:shadow-[0_12px_28px_-10px_rgba(67,24,255,0.45)] hover:-translate-y-0.5 transition-all active:scale-95 tracking-widest uppercase cursor-pointer"
                >
                  <Upload size={16} strokeWidth={2.25} />
                  <span className="hidden sm:inline">Upload</span>
                </button>

                <button
                  onClick={() => {
                    dispatch(fetchRoles());
                    setIsCreateModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#4318FF] text-white rounded-xl font-black text-xs transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:-translate-y-0.5 active:scale-95 tracking-widest uppercase cursor-pointer"
                >
                  <UserPlus size={18} />
                  <span className="hidden sm:inline">Create Employee</span>
                </button>
              </>
            )}

            {/* Clear Filters Button */}
            {(searchTerm || selectedDepartment !== "All" || selectedStatus !== "All") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearchTerm("");
                  setSelectedDepartment("All");
                  setSelectedStatus("All");
                  setCurrentPage(1);
                  setSortConfig({ key: null, direction: "asc" });
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B4FFF] text-white rounded-full hover:bg-[#4318FF] active:scale-95 transition-all text-sm font-bold border border-[#4318FF]/50 whitespace-nowrap"
                title="Clear all filters"
              >
                <X size={16} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-0 overflow-hidden border border-gray-100">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#4318FF] text-white">
                  <th className="text-center py-4 px-1 text-[13px] font-bold uppercase tracking-wider w-[4%]">
                    Sl No
                  </th>
                  <th
                    className="text-left py-4 px-3 text-[13px] font-bold uppercase tracking-wider cursor-pointer select-none hover:bg-[#3d16e5] transition-colors w-[14%]"
                    onClick={() => handleSort("fullName")}
                  >
                    Name
                  </th>
                  <th className="text-left py-4 px-3 text-[13px] font-bold uppercase tracking-wider w-[24%]">
                    Email
                  </th>
                  <th
                    className="text-center py-4 px-3 text-[13px] font-bold uppercase tracking-wider cursor-pointer select-none hover:bg-[#3d16e5] transition-colors w-[9%]"
                    onClick={() => handleSort("employeeId")}
                  >
                    ID
                  </th>
                  <th className="text-center py-4 px-3 text-[13px] font-bold uppercase tracking-wider w-[12%]">
                    Department
                  </th>
                  <th className="text-center py-4 px-3 text-[13px] font-bold uppercase tracking-wider w-[10%]">
                    Role
                  </th>
                  <th className="text-center py-4 px-3 text-[13px] font-bold uppercase tracking-wider w-[10%]">
                    Status
                  </th>
                  <th className="text-center py-4 px-3 text-[13px] font-bold uppercase tracking-wider w-[9%]">
                    Activation
                  </th>
                  <th className="py-4 px-3 text-[13px] font-bold uppercase tracking-wider text-center w-[8%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentItems.map((emp, index) => (
                  <tr
                    key={emp.id}
                    className={`group transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} hover:bg-[#F1F4FF] cursor-pointer`}
                  >
                    <td className="py-4 px-3 text-center text-[#475569] text-sm font-semibold">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="py-4 px-3 text-[#2B3674] text-sm font-bold">
                      {emp.name}
                    </td>
                    <td className="py-4 px-3 text-left text-[#475569] text-sm font-semibold break-all whitespace-normal">
                      {emp.email || "—"}
                    </td>
                    <td className="py-4 px-3 text-center text-[#475569] text-sm font-semibold">
                      {emp.id}
                    </td>
                    <td className="py-4 px-3 text-center text-[#475569] text-sm font-semibold">
                      {emp.department || "General"}
                    </td>
                    <td className="py-4 px-3 text-center text-[#475569] text-sm font-semibold">
                      {emp.role || "-"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {emp.userStatus === UserStatus.DRAFT ? (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700 border border-gray-300">
                          Draft
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              (emp.userStatus === UserStatus.ACTIVE ||
                                emp.userStatus === UserStatus.INACTIVE) &&
                              canEdit
                            ) {
                              handleToggleStatus(emp.rawId);
                            }
                          }}
                          disabled={!canEdit || emp.userStatus === UserStatus.DRAFT}
                          className={`relative w-20 h-7 rounded-full transition-all duration-300 flex items-center mx-auto ${
                            emp.isActive
                              ? canEdit
                                ? "bg-[#0095FF] cursor-pointer"
                                : "bg-[#0095FF]/60 cursor-not-allowed"
                              : canEdit
                                ? "bg-red-500 cursor-pointer"
                                : "bg-red-300 cursor-not-allowed"
                          }`}
                          title={
                            emp.userStatus === UserStatus.DRAFT
                              ? "Activate first to change status"
                              : !canEdit
                                ? "Only admins can change employee status"
                                : "Toggle Status"
                          }
                        >
                          <span
                            className={`absolute text-[10px] font-bold text-white uppercase transition-all duration-300 ${
                              emp.isActive ? "left-2" : "right-2"
                            }`}
                          >
                            {emp.isActive ? "Active" : "Inactive"}
                          </span>
                          <div
                            className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                              emp.isActive
                                ? "translate-x-[54px]"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      )}
                    </td>
                    {/* Activation Column - Shows "Send Link" (first) or "Resend Link" (after 24h) */}
                    <td className="py-4 px-4 text-center">
                      {canEdit &&
                      emp.userStatus === UserStatus.DRAFT &&
                      (() => {
                        if (!emp.lastLinkSentAt) return true;
                        const lastSent = new Date(emp.lastLinkSentAt);
                        const now = new Date();
                        const hours =
                          (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
                        return hours >= 24;
                      })() ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResendActivation(emp.rawId);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold border mx-auto whitespace-nowrap ${
                            !emp.lastLinkSentAt
                              ? "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                              : "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200"
                          }`}
                          title={
                            !emp.lastLinkSentAt
                              ? "Send Activation Link"
                              : "Resend Activation Link"
                          }
                        >
                          {!emp.lastLinkSentAt ? (
                            <Mail size={14} />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                          {!emp.lastLinkSentAt ? "Send Link" : "Resend Link"}
                        </button>
                      ) : (
                        <span className="text-[#A3AED0] text-xs font-bold uppercase tracking-widest">
                          —
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleViewDetails(emp.rawId)}
                          className="inline-flex items-center justify-center bg-transparent border-none cursor-pointer text-[#4318FF] hover:scale-110 active:scale-95 transition-all"
                          title="View Employee"
                        >
                          <Eye size={16} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleEditEmployee(emp.rawId)}
                            className="inline-flex items-center justify-center bg-transparent border-none cursor-pointer text-[#4318FF] hover:scale-110 active:scale-95 transition-all"
                            title="Edit Employee"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDashboard(emp.rawId)}
                          className="inline-flex items-center justify-center bg-transparent border-none cursor-pointer text-[#4318FF] hover:scale-110 active:scale-95 transition-all"
                          title="View Dashboard"
                        >
                          <LayoutDashboard size={16} />
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
              <EmployeeListMobileCard
                employees={currentItems}
                onViewDetails={handleViewDetails}
                onEditEmployee={handleEditEmployee}
                onViewDashboard={handleViewDashboard}
                onResendActivation={handleResendActivation}
                onToggleStatus={handleToggleStatus}
                isAdmin={canEdit}
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

      {/* Upload Modal — modern Worksphere card style */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1B2559]/45 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_24px_80px_-20px_rgba(67,24,255,0.35)] animate-in zoom-in-95 duration-200">
            {/* Soft ambient gradient */}
            <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-[#4318FF]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-sky-300/20 blur-3xl" />

            <div className="relative flex-none flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-7 pb-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7551FF] to-[#4318FF] text-white shadow-lg shadow-[#4318FF]/30">
                  <Upload size={22} strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#1B2559]">
                    Bulk Upload Employees
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm font-medium text-[#707EAE]">
                    Import multiple employee accounts from an Excel sheet in one go.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F7FE] px-3.5 py-2 text-[11px] font-bold text-[#4318FF] ring-1 ring-[#4318FF]/15 transition-all hover:bg-[#EEF2FF] hover:shadow-sm active:scale-95"
                >
                  <Download size={13} />
                  Download Excel Template
                </button>
                <button
                  type="button"
                  onClick={handleCloseUploadModal}
                  className="p-2 text-[#A3AED0] hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="relative px-6 sm:px-8 pb-2 overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#E0E5F2] bg-[#F4F7FE]/90 p-4 sm:p-5 shadow-[0_8px_24px_-16px_rgba(67,24,255,0.2)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#4318FF] shadow-sm ring-1 ring-[#4318FF]/10">
                      <CreditCard size={15} />
                    </span>
                    <p className="text-sm font-bold text-[#1B2559]">
                      Required columns
                      <span className="text-red-500 ml-0.5">*</span>
                    </p>
                  </div>
                  <p className="text-[11px] font-semibold text-[#707EAE] mb-3 leading-relaxed">
                    Use these <span className="text-[#4318FF]">exact headers</span> (case-sensitive):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "fullName",
                      "employeeId",
                      "department",
                      "designation",
                      "email",
                      "employmentType",
                      "joiningDate",
                      "dateOfBirth",
                      "gender",
                      "role",
                    ].map((col) => (
                      <span
                        key={col}
                        className="inline-flex items-center rounded-lg bg-white px-2 py-1 text-[10px] font-bold font-mono text-[#2B3674] ring-1 ring-[#E0E5F2]"
                      >
                        {col}
                        {col === "dateOfBirth" ? (
                          <span className="ml-1 text-[9px] font-semibold text-[#A3AED0]">
                            optional
                          </span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/90 to-orange-50/50 p-4 sm:p-5 shadow-[0_8px_24px_-16px_rgba(245,158,11,0.25)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm ring-1 ring-amber-200/80">
                      <AlertCircle size={15} />
                    </span>
                    <p className="text-sm font-bold text-[#1B2559]">
                      Rules to follow
                    </p>
                  </div>
                  <ul className="space-y-2.5 text-[11px] text-[#4A5568] leading-relaxed">
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span>
                        <strong className="text-[#1B2559]">employmentType</strong> —{" "}
                        <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-[10px] text-amber-800">FULL_TIMER</code>{" "}
                        or{" "}
                        <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-[10px] text-amber-800">INTERN</code>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span>
                        <strong className="text-[#1B2559]">Date format</strong> — YYYY-MM-DD or dd/mm/yyyy
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span>
                        <strong className="text-[#1B2559]">gender</strong> — MALE or FEMALE (uppercase)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span>
                        <strong className="text-[#1B2559]">role</strong> — Employee or Manager
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#707EAE]">
                  {selectedFile ? "Selected Excel File" : "Select Excel File"}
                </label>

                {!selectedFile ? (
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="group flex flex-col items-center justify-center w-full px-4 py-8 sm:py-10 border-2 border-dashed border-[#4318FF]/25 rounded-3xl cursor-pointer bg-gradient-to-b from-[#F4F7FE] to-white hover:border-[#4318FF]/50 hover:shadow-[0_12px_40px_-20px_rgba(67,24,255,0.35)] transition-all"
                    >
                      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7551FF] to-[#4318FF] text-white shadow-lg shadow-[#4318FF]/25 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5">
                        <Upload size={24} strokeWidth={2.25} />
                      </span>
                      <p className="text-sm font-bold text-[#1B2559]">
                        Click to upload Excel file
                      </p>
                      <p className="text-xs font-medium text-[#A3AED0] mt-1.5">
                        .xlsx or .xls files only
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                        <CheckCircle size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-emerald-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                          {(selectedFile.size / 1024).toFixed(2)} KB · Ready to upload
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="shrink-0 p-2 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative flex-none px-6 sm:px-8 py-5 mt-2 flex flex-col-reverse sm:flex-row gap-3 border-t border-[#E0E5F2]/80 bg-[#F4F7FE]/50">
              <button
                type="button"
                onClick={handleCloseUploadModal}
                className="flex-1 px-4 py-3.5 text-sm font-bold text-[#2B3674] bg-white hover:bg-[#EEF2FF] rounded-2xl border border-[#E0E5F2] shadow-sm transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || uploadLoading}
                className="flex-1 px-4 py-3.5 text-sm font-bold text-white rounded-2xl bg-gradient-to-r from-[#7551FF] to-[#4318FF] shadow-lg shadow-[#4318FF]/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[#4318FF]/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload Employees
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Result Modal */}
      {uploadResult && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1B2559]/45 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_24px_80px_-20px_rgba(67,24,255,0.35)] animate-in zoom-in-95 duration-200">
            <div className="pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full bg-[#4318FF]/12 blur-3xl" />

            <div className="relative flex-none flex items-center justify-between px-6 sm:px-7 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7551FF] to-[#4318FF] text-white shadow-lg shadow-[#4318FF]/25">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-[#1B2559]">
                    Upload Results
                  </h3>
                  <p className="text-xs font-medium text-[#707EAE] mt-0.5">
                    Summary of your bulk employee import
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseResultModal}
                className="p-2 text-[#A3AED0] hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative px-6 sm:px-7 pb-2 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Success
                  </p>
                  <p className="text-3xl font-black text-emerald-600 mt-1">
                    {uploadResult.successCount || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                    Failed
                  </p>
                  <p className="text-3xl font-black text-red-600 mt-1">
                    {uploadResult.failureCount || 0}
                  </p>
                </div>
              </div>

              {uploadResult.message && (
                <div
                  className={`p-4 rounded-2xl border ${
                    uploadResult.successCount > 0
                      ? "bg-[#F4F7FE] border-[#E0E5F2]"
                      : "bg-amber-50 border-amber-100"
                  }`}
                >
                  <p className="text-sm font-semibold text-[#2B3674]">
                    {uploadResult.message}
                  </p>
                </div>
              )}

              {uploadResult.createdEmployees &&
                uploadResult.createdEmployees.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-[#707EAE]">
                      Created Employee Id's
                    </p>
                    <div className="bg-[#F4F7FE] rounded-2xl p-3 max-h-32 overflow-y-auto ring-1 ring-[#E0E5F2]">
                      <div className="flex flex-wrap gap-2">
                        {uploadResult.createdEmployees.map((id: string) => (
                          <span
                            key={id}
                            className="px-3 py-1 bg-[#4318FF] text-white text-xs font-bold rounded-full"
                          >
                            {id}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-wider text-red-600 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Errors
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {uploadResult.errors.map((error: any, index: number) => (
                      <div
                        key={index}
                        className="bg-red-50 border border-red-100 rounded-2xl p-3"
                      >
                        <p className="text-xs font-bold text-red-900">
                          Row {error.row}
                          {error.field && ` · Field: ${error.field}`}
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          {error.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex-none px-6 sm:px-7 py-5 mt-2 border-t border-[#E0E5F2]/80 bg-[#F4F7FE]/50">
              <button
                type="button"
                onClick={handleCloseResultModal}
                className="w-full px-4 py-3.5 text-sm font-bold text-white rounded-2xl bg-gradient-to-r from-[#7551FF] to-[#4318FF] shadow-lg shadow-[#4318FF]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex-none flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-[#2B3674]">
                  Create Employee Account
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Create an employee account and manage their workforce
                  efficiently.
                </p>
              </div>
              <button
                onClick={handleCloseCreateModal}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {generalError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  {generalError}
                </div>
              )}

              {showSuccess && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-500">
                  <div className="bg-emerald-100 p-2 rounded-full">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">
                      Account Created Successfully!
                    </p>
                    <p className="text-xs opacity-80">
                      The employee can now login with their credentials.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="fullName"
                          placeholder="Employee Name"
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm"
                          value={formData.fullName}
                          onChange={handleFormChange}
                          required
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                      {fieldErrors.fullName && (
                        <p className="text-red-500 text-xs mt-1">
                          {fieldErrors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Employee ID */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 tracking-wide">
                        Employee ID <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="employeeId"
                          placeholder="Employee ID"
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm"
                          value={formData.employeeId}
                          onChange={(e) => {
                            const event = {
                              ...e,
                              target: {
                                ...e.target,
                                name: "employeeId",
                                value: e.target.value.toUpperCase(),
                              },
                            };
                            handleFormChange(
                              event as React.ChangeEvent<HTMLInputElement>,
                            );
                          }}
                          onInput={(e) => {
                            e.currentTarget.value =
                              e.currentTarget.value.toUpperCase();
                          }}
                          required
                        />
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                      {fieldErrors.employeeId && (
                        <p className="text-red-500 text-xs mt-1">
                          {fieldErrors.employeeId}
                        </p>
                      )}
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="department"
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm bg-white appearance-none"
                          value={formData.department}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.departmentName}>
                              {dept.departmentName}
                            </option>
                          ))}
                        </select>
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="role"
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm bg-white appearance-none"
                          value={formData.role}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="">Select Role</option>
                          {roles
                            .filter((r) => {
                              const normalized = r.toUpperCase().trim();
                              return (
                                normalized !== "ADMIN" &&
                                normalized !== "RECEPTIONIST" &&
                                normalized !== "TEAM LEAD" &&
                                normalized !== "TEAMLEAD"
                              );
                            })
                            .map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                        </select>
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Designation */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="designation"
                          placeholder="Senior Developer"
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm"
                          value={formData.designation}
                          onChange={handleFormChange}
                          required
                        />
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                      {fieldErrors.designation && (
                        <p className="text-red-500 text-xs mt-1">
                          {fieldErrors.designation}
                        </p>
                      )}
                    </div>

                    {/* Employment Type (leave balance) */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Employment Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="employmentType"
                          value={formData.employmentType}
                          onChange={handleFormChange}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm appearance-none bg-white"
                          required
                        >
                          <option value="">Select Employment Type</option>
                          <option value="FULL_TIMER">
                            Full-time employee{" "}
                          </option>
                          {(!formData.role || isEmployeeRole(formData.role)) && (
                            <option value="INTERN">Intern </option>
                          )}
                        </select>
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {/* Used for leave balance: Full timer = 18, Intern = 12 leaves/year */}
                      </p>
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleFormChange}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm appearance-none bg-white"
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Date of Joining */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Date of Joining <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="joiningDate"
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm appearance-none bg-white"
                          value={formData.joiningDate}
                          onChange={handleFormChange}
                          required
                        />
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                      </div>
                      {fieldErrors.joiningDate && (
                        <p className="text-red-500 text-xs mt-1">
                          {fieldErrors.joiningDate}
                        </p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="dateOfBirth"
                          max={new Date().toISOString().slice(0, 10)}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm appearance-none bg-white"
                          value={formData.dateOfBirth}
                          onChange={handleFormChange}
                        />
                        <Cake className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                      </div>
                      {fieldErrors.dateOfBirth && (
                        <p className="text-red-500 text-xs mt-1">
                          {fieldErrors.dateOfBirth}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email - Full Width */}
                  <div className="space-y-2 mt-4">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        placeholder="Employee Email"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm"
                        value={formData.email}
                        onChange={handleFormChange}
                        required
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
                    className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-[#4318FF] rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Activation Success Modal */}
      {isActivationModalOpen && activationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#4318FF] to-[#868CFF] p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold">Action Successful!</h3>
              <p className="text-blue-100 text-sm mt-1">
                {activationData.message}
              </p>
            </div>

            <div className="p-6 space-y-5 text-center">
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <p className="text-sm text-green-800 font-medium">
                  The activation email has been sent successfully.
                </p>
              </div>

              <div className="flex gap-3 pt-2 justify-center">
                <button
                  onClick={() => setIsActivationModalOpen(false)}
                  className="px-8 py-2.5 text-sm font-bold text-white bg-[#4318FF] hover:bg-[#3311CC] rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Download Template Confirmation Modal */}
      {showDownloadConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download size={32} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-[#2B3674] mb-2">
                  Download Template
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Do you want to download the employee bulk upload template?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDownloadConfirm(false)}
                    className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                  >
                    No
                  </button>
                  <button
                    onClick={confirmDownload}
                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-[#4318FF] rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Status Confirmation Modal */}
      {showToggleConfirm && selectedEmployeeForToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-[#2B3674] mb-2">
                  Confirm Status Change
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Are you sure you want to change the status of{" "}
                  {selectedEmployeeForToggle.fullName ||
                    selectedEmployeeForToggle.name}{" "}
                  to{" "}
                  {selectedEmployeeForToggle.userStatus !== "INACTIVE"
                    ? "Inactive"
                    : "Active"}
                  ?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowToggleConfirm(false)}
                    className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmToggleStatus}
                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default EmployeeListView;
