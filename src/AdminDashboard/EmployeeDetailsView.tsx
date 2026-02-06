import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { useState, useEffect } from "react";
import axios from "axios";
import { getEntity } from "../reducers/employeeDetails.reducer";
import {
  User,
  Mail,
  Briefcase,
  Building,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  X,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { resetPassword } from "../reducers/employeeDetails.reducer";

const EmployeeDetailsView = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { entities, entity, loading } = useSelector(
    (state: RootState) => state.employeeDetails,
  );
  const [viewedProfileImage, setViewedProfileImage] = useState<string | null>(
    null,
  );
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    fullName: "",
    employeeId: "",
    department: "",
    designation: "",
    employmentType: "" as "" | "FULL_TIMER" | "INTERN",
    joiningDate: "",
    email: "",
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (
      employeeId &&
      !loading &&
      (!entity ||
        Object.keys(entity).length === 0 ||
        (entity.employeeId !== employeeId && entity.id !== Number(employeeId)))
    ) {
      dispatch(getEntity(employeeId));
    }
  }, [dispatch, employeeId]); // Removed entity from dependency array

  useEffect(() => {
    if (employeeId) {
      // Use direct axios call to avoid Redux side effects (like updating the global header avatar)
      axios
        .get(`/api/employee-details/profile-image/${employeeId}/view`, {
          responseType: "blob",
        })
        .then((response) => {
          const blobUrl = URL.createObjectURL(response.data);
          setViewedProfileImage(blobUrl);
        })
        .catch(() => {
          setViewedProfileImage(null);
        });
    }
  }, [employeeId]);

  const employeeFromList = entities.find(
    (e: any) => e.employeeId === employeeId || e.id === Number(employeeId),
  );

  const employee =
    entity &&
    (entity.employeeId === employeeId || entity.id === Number(employeeId))
      ? entity
      : employeeFromList;

  useEffect(() => {
    if (employee) {
      setEditedData({
        fullName: employee.fullName || employee.name || "",
        employeeId: employee.employeeId || employee.id || "",
        department: employee.department || "",
        designation: employee.designation || "",
        employmentType:
          (employee.employmentType as "" | "FULL_TIMER" | "INTERN") || "",
        joiningDate: employee.joiningDate
          ? new Date(employee.joiningDate).toISOString().split("T")[0]
          : "",
        email: employee.email || "",
      });
    }
  }, [employee]);

  if (loading && !employee) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-[#4318FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!employee && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="mb-4 text-xl font-bold">Employee not found</p>
        <button
          onClick={() => navigate("/admin-dashboard/employees")}
          className="px-6 py-2 bg-[#4318FF] text-white rounded-xl shadow-lg hover:bg-[#3311CC] transition-all"
        >
          Back to Employee List
        </button>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    try {
      const oldEmployeeId = employee.employeeId || employee.id;
      await axios.put(`/api/employee-details/${oldEmployeeId}`, editedData);
      setIsEditing(false);
      setShowConfirm(false);
      setUpdateSuccess(true);

      // If employee ID changed, navigate to new employee ID and fetch with new ID
      const newEmployeeId = editedData.employeeId;
      if (newEmployeeId && newEmployeeId !== oldEmployeeId) {
        // Navigate to new employee ID URL
        navigate(`/admin-dashboard/employees/${newEmployeeId}`, {
          replace: true,
        });
        // Fetch entity with new employee ID
        dispatch(getEntity(newEmployeeId));
      } else {
        // Refresh the entity with current employee ID
        dispatch(getEntity(employeeId!));
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to update employee:", error);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      fullName: employee.fullName || employee.name || "",
      employeeId: employee.employeeId || employee.id || "",
      department: employee.department || "",
      designation: employee.designation || "",
      employmentType:
        (employee.employmentType as "" | "FULL_TIMER" | "INTERN") || "",
      joiningDate: employee.joiningDate
        ? new Date(employee.joiningDate).toISOString().split("T")[0]
        : "",
      email: employee.email || "",
    });
    setIsEditing(false);
  };

  const avatarLetter = (employee.fullName || employee.name || "?")
    .charAt(0)
    .toUpperCase();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setResetError("Password must be at least 6 characters long");
      return;
    }

    try {
      await dispatch(
        resetPassword({
          loginId: employee.employeeId,
          password: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword, // Include if DTO requires it, otherwise ignored
        }),
      ).unwrap();

      setResetSuccess(true);
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetSuccess(false);
        setPasswordData({ newPassword: "", confirmPassword: "" });
      }, 2000);
    } catch (err: any) {
      setResetError(err?.message || "Failed to reset password");
    }
  };

  return (
    <div className="px-4 md:px-8 py-2 md:py-8 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 space-y-3 md:space-y-6">
      {/* Success Message */}
      {updateSuccess && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 px-4 py-3 bg-white rounded-full shadow-2xl border border-green-200">
          <div className="p-1 bg-green-100 rounded-full">
            <CheckCircle size={16} className="text-green-600" />
          </div>
          <span className="font-bold text-sm text-green-700">
            Employee details updated successfully!
          </span>
        </div>
      )}

      {/* Navigation Back */}
      <div className="flex items-center mb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-[#4318FF] transition-colors group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-semibold tracking-wide">
            Back to employee list
          </span>
        </button>
      </div>

      {/* Top Card - User Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-[24px] shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100">
        {/* Gradient Background */}
        <div
          className="absolute inset-0 opacity-100"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10 p-4 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-6">
          {/* Avatar Area */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-0.5 md:p-1 rounded-full bg-white shadow-xl overflow-hidden">
              {viewedProfileImage ? (
                <img
                  src={viewedProfileImage}
                  alt="Profile"
                  className="w-14 h-14 sm:w-20 md:w-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 sm:w-20 md:w-24 rounded-full bg-gradient-to-br from-[#4318FF] to-[#00A3C4] flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl font-black shadow-inner">
                  {avatarLetter}
                </div>
              )}
            </div>
          </div>

          <div className="text-center md:text-left flex-1 mt-0.5">
            <h1 className="text-base sm:text-2xl md:text-3xl font-black text-white mb-0">
              {employee.fullName || employee.name || ""}
            </h1>
            <p className="text-white/90 font-semibold text-[10px] sm:text-base md:text-lg mb-2">
              {employee.designation || "Employee"}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 text-[9px] sm:text-xs md:text-sm text-white/80">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                <Building size={12} className="md:w-3.5 md:h-3.5" />
                <span className="font-medium">InvenTech Info Solutions</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                <CreditCard size={12} className="md:w-3.5 md:h-3.5" />
                <span className="font-medium">
                  {employee.employeeId || employee.id || ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* {!employee.resetRequired && (
          <div className="absolute top-4 right-4 md:top-10 md:right-10 z-20">
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl text-sm font-bold hover:bg-white/30 transition-all shadow-lg"
            >
              <Lock size={16} />
              <span className="hidden sm:inline">Reset Password</span>
            </button>
          </div>
        )} */}
      </div>

      {/* Personal Information Card */}
      <div className="bg-white rounded-2xl md:rounded-[24px] p-5 sm:p-6 md:p-8 shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100 mb-4 md:mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-purple-200">
              <User size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#1B2559]">
              Personal Information
            </h2>
          </div>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-[#4318FF] text-white rounded-xl font-bold text-sm hover:bg-[#3311CC] transition-all"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-all"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-xl font-bold text-sm hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Full Name
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled={!isEditing}
                value={
                  isEditing
                    ? editedData.fullName
                    : employee.fullName || employee.name || ""
                }
                onChange={(e) =>
                  setEditedData({ ...editedData, fullName: e.target.value })
                }
                className={`w-full pl-11 pr-4 py-2.5 border-2 rounded-xl text-[#1B2559] text-sm font-semibold transition-all ${
                  isEditing
                    ? "border-gray-200 focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none bg-white"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="text-[#667eea] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Employee ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Employee ID
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled={!isEditing}
                value={
                  isEditing
                    ? editedData.employeeId
                    : employee.employeeId || employee.id || ""
                }
                onChange={(e) =>
                  setEditedData({ ...editedData, employeeId: e.target.value })
                }
                className={`w-full pl-11 pr-4 py-2.5 border-2 rounded-xl text-[#1B2559] text-sm font-semibold transition-all ${
                  isEditing
                    ? "border-gray-200 focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none bg-white"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <CreditCard className="text-[#764ba2] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Department
            </label>
            <div className="relative group">
              {isEditing ? (
                <select
                  value={editedData.department}
                  onChange={(e) =>
                    setEditedData({ ...editedData, department: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none bg-white text-[#1B2559] text-sm font-semibold transition-all appearance-none"
                >
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="Finance">Finance</option>
                  <option value="Admin">Admin</option>
                  <option value="Designer">Designer</option>
                  <option value="Business Analyst">Business Analyst</option>
                </select>
              ) : (
                <input
                  type="text"
                  disabled
                  value={employee.department || "IT"}
                  className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all"
                />
              )}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <Building className="text-[#05CD99] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Designation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Designation
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled={!isEditing}
                value={
                  isEditing
                    ? editedData.designation
                    : employee.designation || ""
                }
                onChange={(e) =>
                  setEditedData({ ...editedData, designation: e.target.value })
                }
                className={`w-full pl-11 pr-4 py-2.5 border-2 rounded-xl text-[#1B2559] text-sm font-semibold transition-all ${
                  isEditing
                    ? "border-gray-200 focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none bg-white"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                <Briefcase className="text-[#FFB020] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Employment type (leave balance) */}
          {/* <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Employment type
            </label>
            <select
              disabled={!isEditing}
              value={
                isEditing
                  ? editedData.employmentType
                  : (employee.employmentType as string) || ""
              }
              onChange={(e) =>
                setEditedData({
                  ...editedData,
                  employmentType: e.target.value as
                    | ""
                    | "FULL_TIMER"
                    | "INTERN",
                })
              }
              className={`w-full pl-11 pr-4 py-2.5 border-2 rounded-xl text-[#1B2559] text-sm font-semibold transition-all appearance-none ${
                isEditing
                  ? "border-gray-200 focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none bg-white"
                  : "border-gray-100 bg-gray-50/50"
              }`}
            >
              <option value="">Select Employment Type</option>
              <option value="FULL_TIMER">Full time Employee</option>
              <option value="INTERN">Intern</option>
            </select>
          </div> */}

          {/* Joining Date */}
          {/* <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Date of Joining
            </label>
            <div className="relative group">
              <input
                type="date"
                disabled={!isEditing}
                value={
                  isEditing
                    ? editedData.joiningDate
                    : employee.joiningDate
                      ? new Date(employee.joiningDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                }
                onChange={(e) =>
                  setEditedData({ ...editedData, joiningDate: e.target.value })
                }
                className={`w-full pl-11 pr-4 py-2.5 border-2 rounded-xl text-[#1B2559] text-sm font-semibold transition-all ${
                  isEditing
                    ? "border-gray-200 focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none bg-white"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Calendar className="text-blue-500 w-4 h-4" />
              </div>
            </div>
          </div> */}

          {/* Email */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Email Address
            </label>
            <div className="relative group">
              <input
                type="email"
                disabled={!isEditing}
                value={isEditing ? editedData.email : employee.email || ""}
                onChange={(e) =>
                  setEditedData({ ...editedData, email: e.target.value })
                }
                className={`w-full pl-11 pr-4 py-2.5 border-2 rounded-xl text-[#1B2559] text-sm font-semibold transition-all ${
                  isEditing
                    ? "border-gray-200 focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none bg-white"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                <Mail className="text-[#EE5D50] w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-[#2B3674] mb-2">
                  Confirm Changes
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Are you sure you want to save the changes to this employee's
                  details?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSave}
                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-[#2B3674]">
                Reset Password
              </h3>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {resetSuccess ? (
                <div className="flex flex-col items-center justify-center text-center py-4 text-emerald-600 animate-in fade-in zoom-in-95 duration-300">
                  <div className="bg-emerald-100 p-3 rounded-full mb-3">
                    <CheckCircle size={32} />
                  </div>
                  <p className="font-bold text-lg">
                    Password Reset Successfully!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {resetError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600 flex gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      {resetError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm"
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none transition-all text-sm"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 mt-2 bg-gradient-to-r from-[#4318FF] to-[#868CFF] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                  >
                    Update Password
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetailsView;
