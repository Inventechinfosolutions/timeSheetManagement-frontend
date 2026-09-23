import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { RootState } from "../store";
import {
  getEntities,
  getEntity,
  bulkUploadEmployees,
  clearUploadResult,
  downloadBulkTemplate,
  createEntity,
  createCeo,
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
  EyeOff,
  Calendar,
  Download,
  Crown,
  Lock,
} from "lucide-react";
import EmployeeListMobileCard from "./EmployeeListMobileCard";
import Toast from "../components/Toast";
import { UserType, EmploymentType, UserStatus } from "../enums";

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
  const isOnlyAdmin = currentUser?.userType === UserType.ADMIN;

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
  // CEO Modal State
  const [isCreateCeoModalOpen, setIsCreateCeoModalOpen] = useState(false);
  const [ceoFormData, setCeoFormData] = useState({
    fullName: "",
    email: "",
    designation: "Chief Executive Officer",
    gender: "" as "" | "MALE" | "FEMALE",
    password: "",
  });
  const [ceoFieldErrors, setCeoFieldErrors] = useState({
    fullName: "",
    email: "",
    designation: "",
    gender: "",
    password: "",
  });
  const [ceoGeneralError, setCeoGeneralError] = useState("");
  const [ceoLoading, setCeoLoading] = useState(false);
  const [showCeoSuccess, setShowCeoSuccess] = useState(false);
  const [showCeoPassword, setShowCeoPassword] = useState(false);
  const [showCeoTooltip, setShowCeoTooltip] = useState(false);
  const [hasCeoAccount, setHasCeoAccount] = useState(false);

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

  const checkCeoStatus = useCallback(async () => {
    try {
      const res = await axios.get("/api/employee-details/has-ceo");
      setHasCeoAccount(Boolean(res.data?.hasCeo));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    checkCeoStatus();
  }, [checkCeoStatus, entities]);

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
    department: emp.department,
    role: emp.role,
    userStatus: emp.userStatus,
    resetRequired: emp.resetRequired,
    rawId: emp.employeeId, // Store employeeId string for API calls
    createdAt: emp.createdAt,
    lastLoggedIn: emp.lastLoggedIn,
    lastLinkSentAt: emp.lastLinkSentAt,
    isActive: emp.userStatus !== UserStatus.INACTIVE,
    isAdmin: emp.userType === UserType.ADMIN || emp.userType === UserType.CEO
      || String(emp.role).toLowerCase() === 'admin' || String(emp.role).toLowerCase() === 'ceo',
  }));

  // Detect if a CEO already exists via API status or anywhere in the entity list
  const ceoExists =
    hasCeoAccount ||
    entities.some(
      (emp: any) =>
        emp.userType === UserType.CEO ||
        String(emp.role).toLowerCase() === "ceo" ||
        emp.employeeId === "CEO" ||
        emp.rawId === "CEO"
    );

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

  const handleViewDashboard = (empId: string) => {
    navigate(`${basePath}/view-attendance/${empId}`);
  };

  const handleViewDetails = (empId: string) => {
    dispatch(getEntity(empId));
    navigate(`${basePath}/employee-details/${empId}`);
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
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "employmentType"
          ? (value as "" | EmploymentType)
          : name === "gender"
            ? (value as "" | "MALE" | "FEMALE")
            : value,
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

    const submitData = { ...formData };

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
    });
    setGeneralError("");
    setShowSuccess(false);
  };

  const handleCeoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCeoFormData((prev) => ({ ...prev, [name]: value }));
    setCeoFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setCeoGeneralError("");
  };

  const handleCloseCeoModal = () => {
    setIsCreateCeoModalOpen(false);
    setCeoFormData({
      fullName: "",
      email: "",
      designation: "Chief Executive Officer",
      gender: "" as any,
      password: "",
    });
    setCeoFieldErrors({
      fullName: "",
      email: "",
      designation: "",
      gender: "",
      password: "",
    });
    setCeoGeneralError("");
    setShowCeoSuccess(false);
    setShowCeoPassword(false);
  };

  const handleCeoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCeoGeneralError("");

    const errors = {
      fullName: "",
      email: "",
      designation: "",
      gender: "",
      password: "",
    };
    let hasError = false;

    if (!ceoFormData.fullName.trim()) {
      errors.fullName = "Full name is required";
      hasError = true;
    }
    if (!ceoFormData.email.trim()) {
      errors.email = "Email is required";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ceoFormData.email.trim())) {
      errors.email = "Please enter a valid email address";
      hasError = true;
    }
    if (!ceoFormData.designation.trim()) {
      errors.designation = "Designation is required";
      hasError = true;
    }
    if (!ceoFormData.gender) {
      errors.gender = "Gender is required";
      hasError = true;
    }
    if (!ceoFormData.password) {
      errors.password = "Password is required";
      hasError = true;
    } else if (ceoFormData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      hasError = true;
    }

    if (hasError) {
      setCeoFieldErrors(errors);
      return;
    }

    setCeoLoading(true);
    try {
      const resultAction = await dispatch(
        createCeo({
          fullName: ceoFormData.fullName.trim(),
          email: ceoFormData.email.trim().toLowerCase(),
          designation: ceoFormData.designation.trim(),
          gender: ceoFormData.gender,
          password: ceoFormData.password,
        })
      );

      if (createCeo.fulfilled.match(resultAction)) {
        setShowCeoSuccess(true);
        setHasCeoAccount(true);
        checkCeoStatus();
        setToast({
          message: "CEO Account created successfully! Welcome email sent.",
          type: "success",
        });
        setTimeout(() => {
          handleCloseCeoModal();
          dispatch(
            getEntities({
              page: currentPage,
              limit: itemsPerPage,
              search: debouncedSearchTerm,
              department:
                selectedDepartment === "All" ? undefined : selectedDepartment,
              userStatus: selectedStatus === "All" ? undefined : selectedStatus,
            })
          );
        }, 1800);
      } else {
        const errorMsg =
          (resultAction.payload as string) || "Failed to create CEO";
        setCeoGeneralError(errorMsg);
      }
    } catch (err: any) {
      setCeoGeneralError(err.message || "An unexpected error occurred");
    } finally {
      setCeoLoading(false);
    }
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
    <div className="p-2 bg-[#F4F7FE] font-sans">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-3 mb-6 w-full">
            <h1 className="text-xl md:text-2xl font-bold text-[#2B3674] m-0 whitespace-nowrap">
            Employee Directory
          </h1>

          {/* Row 1: Filters (Full Width) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
            {/* Dropdowns wrapper: 2 columns on mobile, auto width on tablet/desktop */}
            <div className="order-1 sm:order-1 grid grid-cols-2 gap-2.5 w-full sm:w-auto sm:flex sm:items-center sm:gap-3 shrink-0">
              {/* Modern Custom Dropdown */}
              {canEdit && (
                <div className="relative w-full sm:w-auto sm:min-w-[180px] md:min-w-[210px]" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(!isDropdownOpen);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-white rounded-full border border-gray-200 font-bold text-xs sm:text-sm hover:bg-gray-50 transition-all focus:border-[#4318FF]/40 ${selectedDepartment !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <Filter size={15} className="text-[#4318FF] shrink-0" />
                      <span className="truncate">
                        {selectedDepartment === "All" ? "Department" : selectedDepartment}
                      </span>
                    </div>
                    <ChevronDown
                      size={15}
                      className={`shrink-0 text-[#A3AED0] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full sm:w-64 min-w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.1)] border border-gray-100 p-3 z-50 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
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
                <div className="relative w-full sm:w-auto sm:min-w-[130px] md:min-w-[160px]" ref={statusDropdownRef}>
                  <button
                    onClick={() => {
                      setIsStatusDropdownOpen(!isStatusDropdownOpen);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-white rounded-full border border-gray-200 font-bold text-xs sm:text-sm hover:bg-gray-50 transition-all focus:border-[#4318FF]/40 ${selectedStatus !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <Filter size={15} className="text-[#4318FF] shrink-0" />
                      <span className="truncate">
                        {selectedStatus === "All" ? "Status" : formatStatusLabel(selectedStatus)}
                      </span>
                    </div>
                    <ChevronDown
                      size={15}
                      className={`shrink-0 text-[#A3AED0] transition-transform duration-300 ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full sm:w-48 min-w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.1)] border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
            </div>

            {/* Search Box and Clear Button in one line */}
            <div className="order-2 sm:order-2 flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto flex-1 min-w-0">
              <div className="w-full flex-1 min-w-0 flex items-center bg-white rounded-full px-4 sm:px-5 py-2.5 border border-gray-200 focus-within:border-[#4318FF]/40 transition-all shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                <Search size={18} className="text-[#A3AED0] mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-none outline-none bg-transparent text-[#2B3674] w-full min-w-0 text-xs sm:text-sm font-semibold placeholder:text-[#A3AED0]/60"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

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
                  className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 bg-[#5B4FFF] text-white rounded-full hover:bg-[#4318FF] active:scale-95 transition-all text-xs sm:text-sm font-bold border border-[#4318FF]/50 whitespace-nowrap shrink-0"
                  title="Clear all filters"
                >
                  <X size={15} />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Action Buttons */}
          {basePath === "/admin-dashboard" && canEdit && (
            <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 w-full flex-nowrap overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={handleDownloadClick}
                className="flex-1 sm:flex-initial h-10 sm:h-11 flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 px-1.5 xs:px-2.5 sm:px-3.5 md:px-4 lg:px-5 bg-[#4318FF] text-white rounded-xl font-black text-[11px] sm:text-xs transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 active:scale-95 tracking-tight xs:tracking-normal sm:tracking-widest uppercase whitespace-nowrap shrink-0"
                title="Download Excel Template"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <div className="flex flex-col leading-[1.05] sm:hidden text-left text-[7.5px] xs:text-[8.5px]">
                  <span>Download</span>
                  <span>Template</span>
                </div>
                <span className="hidden sm:inline">Download Template</span>
              </button>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex-1 sm:flex-initial h-10 sm:h-11 flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 px-1.5 xs:px-2.5 sm:px-3.5 md:px-4 lg:px-5 bg-white text-[#4318FF] border-2 border-[#4318FF] rounded-xl font-black text-[11px] sm:text-xs transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 tracking-tight xs:tracking-normal sm:tracking-widest uppercase whitespace-nowrap shrink-0"
                title="Upload Employees"
              >
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-[8.5px] xs:text-[9.5px] sm:text-xs font-black">Upload</span>
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex-1 sm:flex-initial h-10 sm:h-11 flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 px-1.5 xs:px-2.5 sm:px-3.5 md:px-4 lg:px-5 bg-[#4318FF] text-white rounded-xl font-black text-[11px] sm:text-xs transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 active:scale-95 tracking-tight xs:tracking-normal sm:tracking-widest uppercase whitespace-nowrap shrink-0"
                title="Create Employee"
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <div className="flex flex-col leading-[1.05] sm:hidden text-left text-[7.5px] xs:text-[8.5px]">
                  <span>Create</span>
                  <span>Employee</span>
                </div>
                <span className="hidden sm:inline">Create Employee</span>
              </button>

              {isOnlyAdmin && (
                <div
                  className="flex-1 sm:flex-initial h-10 sm:h-11 relative group/ceo cursor-pointer flex items-center shrink-0"
                  onClick={() => {
                    if (ceoExists) {
                      setShowCeoTooltip(true);
                      setTimeout(() => setShowCeoTooltip(false), 2500);
                    }
                  }}
                >
                  <button
                    onClick={(e) => {
                      if (ceoExists) {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowCeoTooltip(true);
                        setTimeout(() => setShowCeoTooltip(false), 2500);
                        return;
                      }
                      setCeoGeneralError("");
                      setCeoFieldErrors({ fullName: "", email: "", designation: "", gender: "", password: "" });
                      setShowCeoSuccess(false);
                      setIsCreateCeoModalOpen(true);
                    }}
                    disabled={ceoExists}
                    className={`w-full h-full flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 px-1.5 xs:px-2.5 sm:px-3.5 md:px-4 lg:px-5 rounded-xl font-black text-[11px] sm:text-xs transition-all tracking-tight xs:tracking-normal sm:tracking-widest uppercase whitespace-nowrap ${
                      ceoExists
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none pointer-events-none"
                        : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 transform hover:-translate-y-0.5 active:scale-95"
                    }`}
                    title={ceoExists ? "A CEO account already exists" : "Create CEO Account"}
                  >
                    <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <div className="flex flex-col leading-[1.05] sm:hidden text-left text-[7.5px] xs:text-[8.5px]">
                      <span>Create</span>
                      <span>CEO</span>
                    </div>
                    <span className="hidden sm:inline">Create CEO</span>
                  </button>
                  {/* Tooltip shown when CEO exists on hover or click */}
                  {ceoExists && (
                    <div
                      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] bg-gray-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-lg pointer-events-none transition-all duration-200 z-50 text-center ${
                        showCeoTooltip
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95 group-hover/ceo:opacity-100 group-hover/ceo:scale-100"
                      }`}
                    >
                      A CEO account already exists
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[20px] p-0 overflow-hidden border border-gray-100">
          {/* Desktop & Tablet Table View */}
          <div className="hidden md:block overflow-x-auto w-full custom-scrollbar">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#4318FF] text-white">
                  <th
                    className="text-left py-4 pl-6 pr-3 text-[13px] font-bold uppercase tracking-wider cursor-pointer select-none hover:bg-[#3d16e5] transition-colors whitespace-nowrap"
                    onClick={() => handleSort("fullName")}
                  >
                    Name
                  </th>
                  <th
                    className="text-center py-4 px-3 text-[13px] font-bold uppercase tracking-wider cursor-pointer select-none hover:bg-[#3d16e5] transition-colors whitespace-nowrap"
                    onClick={() => handleSort("employeeId")}
                  >
                    ID
                  </th>
                  <th className="text-center py-4 px-3 text-[13px] font-bold uppercase tracking-wider whitespace-nowrap">
                    Department
                  </th>
                  <th className="text-center py-4 px-3 text-[13px] font-bold uppercase tracking-wider whitespace-nowrap">
                    Role
                  </th>
                  <th className="text-center py-4 px-3 text-[13px] font-bold uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-center py-4 px-3 text-[13px] font-bold uppercase tracking-wider whitespace-nowrap">
                    Activation
                  </th>
                  <th className="py-4 pl-3 pr-6 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap">
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
                    <td className="py-4 pl-6 pr-3 text-[#2B3674] text-sm font-bold whitespace-nowrap">
                      {emp.name}
                    </td>
                    <td className="py-4 px-3 text-center text-[#475569] text-sm font-semibold whitespace-nowrap">
                      {emp.id}
                    </td>
                    <td className="py-4 px-3 text-center text-[#475569] text-sm font-semibold whitespace-nowrap">
                      {emp.department || "General"}
                    </td>
                    <td className="py-4 px-3 text-center text-[#475569] text-sm font-semibold whitespace-nowrap">
                      {emp.role || "-"}
                    </td>
                    <td className="py-4 px-3 text-center whitespace-nowrap">
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
                    <td className="py-4 px-3 text-center whitespace-nowrap">
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
                    <td className="py-4 pl-3 pr-6 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2.5">
                        <button
                          onClick={() => handleViewDashboard(emp.rawId)}
                          className="inline-flex items-center justify-center bg-transparent border-none cursor-pointer text-[#4318FF] hover:scale-110 active:scale-95 transition-all"
                          title="View Dashboard"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleViewDetails(emp.rawId)}
                          className="inline-flex items-center justify-center bg-transparent border-none cursor-pointer text-[#4318FF] hover:scale-110 active:scale-95 transition-all"
                          title={canEdit ? "Edit Details" : "View Details"}
                        >
                          {canEdit ? <Pencil size={16} /> : <User size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Cards only on mobile) */}
          <div className="block md:hidden p-4">
            {currentItems.length > 0 ? (
              <EmployeeListMobileCard
                employees={currentItems}
                onViewDetails={handleViewDetails}
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

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex-none flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-[#2B3674]">
                  Bulk Upload Employees
                </h3>
                <button
                  onClick={handleDownloadClick}
                  className="mt-1 text-xs font-bold text-[#4318FF] hover:underline flex items-center gap-1 w-fit"
                >
                  <Download size={14} />
                  Download Excel Template
                </button>
              </div>
              <button
                onClick={handleCloseUploadModal}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    Required Excel columns — use these{" "}
                    <strong>exact Same </strong> headers (case-sensitive):
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>fullName</li>
                    <li>employeeId</li>
                    <li>department</li>
                    <li>designation</li>
                    <li>email</li>
                    <li>employmentType</li>
                    <li>joiningDate</li>
                    <li>gender</li>
                    <li>role</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:flex-1">
                  <p className="text-sm font-semibold text-amber-900 mb-2">
                    Rules to follow:
                  </p>
                  <ul className="text-xs text-amber-800 space-y-1.5">
                    <li>
                      <strong>employmentType</strong> — use: FULL_TIMER
                      (full-time) or INTERN (intern).
                    </li>
                    <li>
                      <strong>Date Format</strong> — use: YYYY-MM-DD or
                      dd/mm/yyyy.
                    </li>
                    <li>
                      <strong>gender</strong> — use: MALE or FEMALE (uppercase).
                    </li>
                    <li>
                      <strong>role</strong> — Employee, Manager
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-[#2B3674]">
                  Select Excel File
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
                      className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-[#4318FF]/30 rounded-xl cursor-pointer bg-[#4318FF]/5 hover:bg-[#4318FF]/10 transition-all group"
                    >
                      <Upload className="w-6 h-6 text-[#4318FF] mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-bold text-[#2B3674]">
                        Click to upload Excel file
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        .xlsx or .xls files only
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border-2 border-green-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-green-100 rounded-lg">
                        <CheckCircle size={18} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(selectedFile.size / 1024).toFixed(2)} KB
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
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-none p-6 flex gap-3 border-t border-gray-100">
              <button
                onClick={handleCloseUploadModal}
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadLoading}
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-[#4318FF] rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                {uploadLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Result Modal */}
      {uploadResult && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex-none flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-[#2B3674]">
                Upload Results
              </h3>
              <button
                onClick={handleCloseResultModal}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-green-700">
                    Success
                  </p>
                  <p className="text-3xl font-black text-green-600">
                    {uploadResult.successCount || 0}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-700">Failed</p>
                  <p className="text-3xl font-black text-red-600">
                    {uploadResult.failureCount || 0}
                  </p>
                </div>
              </div>

              {uploadResult.message && (
                <div
                  className={`p-4 rounded-xl border ${
                    uploadResult.successCount > 0
                      ? "bg-blue-50 border-blue-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-700">
                    {uploadResult.message}
                  </p>
                </div>
              )}

              {uploadResult.createdEmployees &&
                uploadResult.createdEmployees.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-[#2B3674]">
                      Created Employees:
                    </p>
                    <div className="bg-gray-50 rounded-xl p-3 max-h-32 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {uploadResult.createdEmployees.map((id: string) => (
                          <span
                            key={id}
                            className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full"
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
                  <p className="text-sm font-bold text-red-600 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Errors:
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {uploadResult.errors.map((error: any, index: number) => (
                      <div
                        key={index}
                        className="bg-red-50 border border-red-200 rounded-lg p-3"
                      >
                        <p className="text-xs font-bold text-red-900">
                          Row {error.row}
                          {error.field && ` - Field: ${error.field}`}
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

            <div className="flex-none p-6 border-t border-gray-100">
              <button
                onClick={handleCloseResultModal}
                className="w-full px-4 py-3 text-sm font-bold text-white bg-[#4318FF] rounded-xl shadow-lg hover:shadow-xl transition-all"
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
                                normalized !== "TEAMLEAD" &&
                                normalized !== "CEO"
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
                          <option value="INTERN">Intern </option>
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

                  {/* Date of Joining */}
                  <div className="space-y-2 mt-4">
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

      {/* Create CEO Modal */}
      {isCreateCeoModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex-none flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50/60 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                  <Crown size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#2B3674]">
                    Create CEO Account
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Chief Executive Officer lifecycle setup (Single account only)
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseCeoModal}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {ceoGeneralError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">{ceoGeneralError}</span>
                </div>
              )}

              {showCeoSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-3 animate-in fade-in zoom-in-95">
                  <div className="bg-emerald-100 p-2 rounded-full">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">CEO Account Created Successfully!</p>
                    <p className="text-xs text-emerald-600/80">
                      Welcome email has been sent to {ceoFormData.email}. Form closing...
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-800 leading-relaxed">
                <strong>Account Credentials Note:</strong> The CEO account will be assigned Login ID <strong>CEO</strong>. The password will be hashed with bcrypt. CEO receives a welcome confirmation email.
              </div>

              <form onSubmit={handleCeoSubmit} className="space-y-4" autoComplete="off">
                {/* Prevent browser password manager / autofill from pre-filling saved admin credentials */}
                <input
                  type="text"
                  name="prevent_autofill_username"
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <input
                  type="password"
                  name="prevent_autofill_password"
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="new-password"
                  aria-hidden="true"
                />

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="e.g. Johnathan Smith"
                      autoComplete="off"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all text-sm font-medium"
                      value={ceoFormData.fullName}
                      onChange={handleCeoChange}
                      required
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {ceoFieldErrors.fullName && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{ceoFieldErrors.fullName}</p>
                  )}
                </div>

                {/* Registered Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Registered Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      id="ceo-create-email"
                      placeholder="e.g. ceo@worksphere.com"
                      autoComplete="new-password"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all text-sm font-medium"
                      value={ceoFormData.email}
                      onChange={handleCeoChange}
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {ceoFieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{ceoFieldErrors.email}</p>
                  )}
                </div>

                {/* Designation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="designation"
                      placeholder="e.g. Chief Executive Officer"
                      autoComplete="off"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all text-sm font-medium"
                      value={ceoFormData.designation}
                      onChange={handleCeoChange}
                      required
                    />
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {ceoFieldErrors.designation && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{ceoFieldErrors.designation}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="gender"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all text-sm font-medium bg-white appearance-none"
                      value={ceoFormData.gender}
                      onChange={handleCeoChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                  {ceoFieldErrors.gender && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{ceoFieldErrors.gender}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCeoPassword ? "text" : "password"}
                      name="password"
                      id="ceo-create-password"
                      placeholder="Enter secure initial password"
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-form-type="other"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all text-sm font-medium"
                      value={ceoFormData.password}
                      onChange={handleCeoChange}
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <button
                      type="button"
                      onClick={() => setShowCeoPassword(!showCeoPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={showCeoPassword ? "Hide Password" : "Show Password"}
                    >
                      {showCeoPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {ceoFieldErrors.password && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{ceoFieldErrors.password}</p>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCloseCeoModal}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ceoLoading || showCeoSuccess}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50"
                  >
                    {ceoLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Creating CEO...</span>
                      </>
                    ) : (
                      <>
                        <Crown size={16} />
                        <span>Create CEO</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
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
