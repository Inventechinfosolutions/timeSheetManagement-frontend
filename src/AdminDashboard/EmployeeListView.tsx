import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RootState } from "../store";
import {
  getEntities,
  getEntity,
  bulkUploadEmployees,
  clearUploadResult,
  createEntity,
  reset,
  resendActivationLink,
} from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  Eye,
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Briefcase,
  Building,
  CreditCard,
  Loader2,
  Send,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";

const EmployeeListView = () => {
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
  });
  const [formError, setFormError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  // Activation Modal State
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [activationData, setActivationData] = useState<{
    link: string;
    message: string;
    loginId?: string;
    password?: string;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>("");

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
  const {
    entities,
    totalItems,
    uploadLoading,
    uploadResult,
    loading,
    updateSuccess,
    errorMessage,
  } = useAppSelector((state: RootState) => state.employeeDetails);

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
    userStatus: emp.userStatus,
    resetRequired: emp.resetRequired,
    rawId: emp.employeeId, // Store employeeId string for API calls
  }));

  const currentItems = employees;
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

  const handleViewDetails = (empId: string) => {
    dispatch(getEntity(empId));
    navigate(`/admin-dashboard/employee-details/${empId}`);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid Excel file (.xlsx or .xls)");
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (Object.values(formData).some((val) => !val)) {
      setFormError("Please fill in all fields");
      return;
    }

    dispatch(createEntity(formData));
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormData({
      fullName: "",
      employeeId: "",
      department: "",
      designation: "",
      email: "",
    });
    setFormError("");
    setShowSuccess(false);
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
          }),
        );
      } else {
        alert(
          "Failed to send activation link: " +
            (result.payload || "Unknown error"),
        );
      }
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopySuccess(field);
      setTimeout(() => setCopySuccess(""), 2000);
    }
  };

  // Handle success after employee creation
  useEffect(() => {
    if (updateSuccess && isCreateModalOpen) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        dispatch(reset());
        setShowSuccess(false);
        setFormData({
          fullName: "",
          employeeId: "",
          department: "",
          designation: "",
          email: "",
        });
        // Refresh the list
        dispatch(
          getEntities({
            search: debouncedSearchTerm,
            department:
              selectedDepartment === "All" ? undefined : selectedDepartment,
          }),
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (errorMessage && isCreateModalOpen) {
      setFormError(errorMessage);
    }
  }, [
    updateSuccess,
    errorMessage,
    dispatch,
    isCreateModalOpen,
    debouncedSearchTerm,
    selectedDepartment,
  ]);

  return (
    <div className="p-5 bg-[#F4F7FE] min-h-screen font-sans">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold text-[#2B3674] m-0">
            Employee List
          </h1>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Modern Custom Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-[0px_18px_40px_rgba(112,144,176,0.12)] text-[#2B3674] font-bold text-sm hover:bg-gray-50 transition-all border border-transparent focus:border-[#4318FF]/20"
              >
                <Filter size={16} className="text-[#4318FF]" />
                <span>{selectedDepartment}</span>
                <ChevronDown
                  size={16}
                  className={`text-[#A3AED0] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.1)] border border-white/20 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
            <div className="flex items-center bg-white rounded-full px-5 py-2.5 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] min-w-[250px] flex-1 md:flex-initial border border-transparent focus-within:border-[#4318FF]/20 transition-all">
              <Search size={18} className="text-[#A3AED0] mr-2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-none outline-none bg-transparent text-[#2B3674] w-full text-sm font-semibold placeholder:text-[#A3AED0]/60"
              />
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#4318FF] border-2 border-[#4318FF] rounded-xl font-black text-xs transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 tracking-widest uppercase"
            >
              <Upload size={18} />
              <span className="hidden sm:inline">Upload</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-[#4318FF] to-[#868CFF] text-white rounded-xl font-black text-xs transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:-translate-y-0.5 active:scale-95 tracking-widest uppercase"
            >
              <UserPlus size={18} />
              <span className="hidden sm:inline">Create Employee</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] overflow-x-auto border border-gray-50">
          <h3 className="text-xl font-bold text-[#2B3674] mb-5">
            Employee Registry
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th
                  className="text-left py-2.5 pl-10 pr-4 border-b border-[#E9EDF7] text-[#A3AED0] text-[12px] font-bold uppercase tracking-wider cursor-pointer select-none hover:text-[#4318FF] transition-colors"
                  onClick={() => handleSort("fullName")}
                >
                  Name
                </th>
                <th
                  className="text-center py-2.5 px-4 border-b border-[#E9EDF7] text-[#A3AED0] text-[12px] font-bold uppercase tracking-wider cursor-pointer select-none hover:text-[#4318FF] transition-colors"
                  onClick={() => handleSort("employeeId")}
                >
                  ID
                </th>
                <th className="text-center py-2.5 px-4 border-b border-[#E9EDF7] text-[#A3AED0] text-[12px] font-bold uppercase tracking-wider">
                  Department
                </th>
                <th className="py-2.5 pl-4 pr-10 border-b border-[#E9EDF7] text-[#A3AED0] text-[12px] font-bold uppercase tracking-wider text-center w-64">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.map((emp, index) => (
                <tr
                  key={emp.id}
                  className={`group transition-all duration-300 ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} hover:bg-[#E9EDF7] hover:shadow-[0px_4px_25px_rgba(112,144,176,0.18)] hover:scale-[1.005] cursor-pointer`}
                >
                  <td className="py-3 pl-10 pr-4 text-[#2B3674] text-sm font-bold">
                    {emp.name}
                  </td>
                  <td className="py-3 px-4 text-center text-[#A3AED0] text-sm font-semibold">
                    {emp.id}
                  </td>
                  <td className="py-3 px-4 text-center text-[#A3AED0] text-sm font-semibold">
                    {emp.department || "General"}
                  </td>
                  <td className="py-3 pl-4 pr-10 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewDetails(emp.rawId)}
                        className="p-2 text-[#4318FF] hover:bg-[#4318FF]/10 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>

                      {emp.resetRequired ? (
                        <button
                          onClick={() => handleResendActivation(emp.rawId)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold border
                            ${
                              emp.userStatus === "DRAFT"
                                ? "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                                : "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200"
                            }`}
                          title={
                            emp.userStatus === "DRAFT"
                              ? "Send Activation Link"
                              : "Resend Activation Link"
                          }
                        >
                          {emp.userStatus === "DRAFT" ? (
                            <Send size={14} />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                          {emp.userStatus === "DRAFT" ? "Send" : "Resend"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-20 text-center text-[#A3AED0] font-bold"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="opacity-20" />
                      <span>No employees found matching your criteria</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex justify-end items-center mt-6 gap-3">
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

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-[#2B3674]">
                Bulk Upload Employees
              </h3>
              <button
                onClick={handleCloseUploadModal}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Required Excel Columns:
                </p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>fullName</li>
                  <li>employeeId</li>
                  <li>department</li>
                  <li>designation</li>
                  <li>email</li>
                  <li>password (optional)</li>
                </ul>
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

            <div className="p-6 flex gap-3 border-t border-gray-100">
              <button
                onClick={handleCloseUploadModal}
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadLoading}
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#4318FF] to-[#868CFF] rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
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

            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
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

            <div className="p-6 border-t border-gray-100">
              <button
                onClick={handleCloseResultModal}
                className="w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#4318FF] to-[#868CFF] rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-100 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
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

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  {formError}
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
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="fullName"
                          placeholder="John Doe"
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm"
                          value={formData.fullName}
                          onChange={handleFormChange}
                          required
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                    </div>

                    {/* Employee ID */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Employee ID
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="employeeId"
                          placeholder="EMP-1234"
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm"
                          value={formData.employeeId}
                          onChange={handleFormChange}
                          required
                        />
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Department
                      </label>
                      <div className="relative">
                        <select
                          name="department"
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm appearance-none bg-white"
                          value={formData.department}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="" disabled>
                            Select Department
                          </option>
                          <option value="HR">HR</option>
                          <option value="IT">IT</option>
                          <option value="Sales">Sales</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Finance">Finance</option>
                        </select>
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                      </div>
                    </div>

                    {/* Designation */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Designation
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
                    </div>
                  </div>

                  {/* Email - Full Width */}
                  <div className="space-y-2 mt-4">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        placeholder="john.doe@inventech.com"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm"
                        value={formData.email}
                        onChange={handleFormChange}
                        required
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
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
                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#4318FF] to-[#868CFF] rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all flex items-center justify-center gap-2"
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
    </div>
  );
};

export default EmployeeListView;
