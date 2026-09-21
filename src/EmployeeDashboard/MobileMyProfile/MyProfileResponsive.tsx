import React from "react";
import {
    Camera,
    Mail,
    Briefcase,
    User,
    Building,
    CreditCard,
    ShieldCheck,
    Calendar,
    Users,
    Trash2,
    Eye,
    ArrowLeft,
} from "lucide-react";
import { Modal } from "antd";
import { UploadStatus, EmployeeEntity } from "./MyProfileResponsive.types";
import { EmploymentTypeDisplay, GenderDisplay } from "./MyProfileResponsive.enum";
import "./MyProfileResponsive.css";

interface MyProfileResponsiveProps {
    fullName: string;
    designation: string;
    displayEmployeeId: string;
    department: string;
    email: string;
    role: string;
    employmentType: string;
    joiningDate: string;
    gender: string;
    managerMapping: any;
    profileImageUrl: string | null;
    defaultImage: string;
    imageError: boolean;
    setImageError: (err: boolean) => void;
    uploadStatus: UploadStatus;
    isImageModalOpen: boolean;
    setIsImageModalOpen: (open: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleCameraClick: () => void;
    handleConfirmRemove: () => void;
    handleBackNavigation: () => void;
}

/* ------------------------------------------------------------
   Generic, non-photographic gender-based avatar fallbacks.
   Used only when no photo has been uploaded (or it failed to load).
   ------------------------------------------------------------ */

const MaleAvatar: React.FC = () => (
    <svg viewBox="0 0 80 80" className="w-full h-full">
        <rect width="80" height="80" rx="16" fill="#DCE7FF" />
        <circle cx="40" cy="31" r="13" fill="#5B7FDB" />
        <path d="M13 75c2.5-17 13.5-25.5 27-25.5S64.5 58 67 75z" fill="#5B7FDB" />
    </svg>
);

const FemaleAvatar: React.FC = () => (
    <svg viewBox="0 0 80 80" className="w-full h-full">
        <rect width="80" height="80" rx="16" fill="#ffffff" />
        <path
            d="M40 15c-9 0-15.5 6.8-15.5 15.2 0 5 2 9.3 4.4 12.3l-1.6 4.6c8 3.7 21.8 3.7 29.4 0l-1.6-4.6c2.4-3 4.4-7.3 4.4-12.3C59.5 21.8 49 15 40 15z"
            fill="#d8ccd1ff"
        />
        <path d="M13 75c2.5-17 13.5-25.5 27-25.5S64.5 58 67 75z" fill="#d8ccd1ff" />
    </svg>
);

// Presentational row for the info list — purely visual, no logic,
// so it can't change any existing behavior.
const FieldRow: React.FC<{
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
}> = ({ icon, iconBg, label, value }) => (
    <div className="profile-field-card">
        <div className={`profile-field-icon ${iconBg}`}>{icon}</div>
        <div className="min-w-0 flex-1">
            <p className="profile-field-label">{label}</p>
            <p className="profile-field-value truncate">{value || "-"}</p>
        </div>
    </div>
);

export const MyProfileResponsive: React.FC<MyProfileResponsiveProps> = ({
    fullName,
    designation,
    displayEmployeeId,
    department,
    email,
    role,
    employmentType,
    joiningDate,
    gender,
    managerMapping,
    profileImageUrl,
    defaultImage,
    imageError,
    setImageError,
    uploadStatus,
    isImageModalOpen,
    setIsImageModalOpen,
    fileInputRef,
    handleImageChange,
    handleCameraClick,
    handleConfirmRemove,
    handleBackNavigation,
}) => {
    const employmentTypeLabel =
        employmentType === "FULL_TIMER"
            ? EmploymentTypeDisplay.FULL_TIMER
            : employmentType === "INTERN"
                ? EmploymentTypeDisplay.INTERN
                : employmentType || "-";

    const genderKey = (gender || "").toLowerCase().trim();
    const genderLabel =
        genderKey === "male"
            ? GenderDisplay.MALE
            : genderKey === "female"
                ? GenderDisplay.FEMALE
                : genderKey === "other"
                    ? GenderDisplay.OTHER
                    : gender || "-";

    const managerName =
        (Array.isArray(managerMapping) ? managerMapping[0]?.managerName : managerMapping?.managerName) ||
        "Not Assigned";

    const joiningDateShort = joiningDate
        ? new Date(joiningDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : "-";

    const joiningDateLong = joiningDate
        ? new Date(joiningDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "-";

    const hasUploadedPhoto = !!profileImageUrl && !imageError;

    const renderAvatar = () => {
        if (hasUploadedPhoto) {
            return (
                <img
                    src={profileImageUrl as string}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            );
        }
        if (genderKey === "male") return <MaleAvatar />;
        if (genderKey === "female") return <FemaleAvatar />;
        return <img src={defaultImage} alt="Profile" className="w-full h-full object-cover" />;
    };

    return (
        <div className="overflow-y-auto no-scrollbar px-2 md:px-8 pt-4 pb-6 my-profile-container animate-in fade-in duration-500 space-y-3 md:space-y-4">
            {/* Header Card */}
            <div className="profile-header-card p-4 md:p-6 text-white relative">
                <div className="profile-gradient-bg" />

                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex flex-row items-center gap-4">
                        {/* Avatar */}
                        <div className="flex flex-col items-center flex-shrink-0">
                            <div className="relative group">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <div className="profile-avatar-frame">{renderAvatar()}</div>

                                {hasUploadedPhoto ? (
                                    <div
                                        className="absolute -bottom-1 -right-1 bg-[#a27b36] text-white p-1.5 rounded-full shadow-md transition-transform group-hover:scale-110 cursor-pointer border border-[#667eea]"
                                        onClick={() => setIsImageModalOpen(true)}
                                    >
                                        <Eye size={12} />
                                    </div>
                                ) : (
                                    <div
                                        className="absolute -bottom-1 -right-1 bg-[#a27b36] text-white p-1.5 rounded-full shadow-md transition-transform group-hover:scale-110 cursor-pointer border border-[#667eea]"
                                        onClick={handleCameraClick}
                                    >
                                        <Camera size={12} />
                                    </div>
                                )}
                            </div>

                            <div className="h-3 flex items-center justify-center mt-1">
                                {uploadStatus === "success" && (
                                    <span className="text-white text-[9px] font-medium px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-md">
                                        ✓ Updated
                                    </span>
                                )}
                                {uploadStatus === "deleted" && (
                                    <span className="text-white text-[9px] font-medium px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-md">
                                        ✓ Deleted
                                    </span>
                                )}
                                {uploadStatus === "error" && (
                                    <span className="text-white text-[9px] font-medium px-1.5 py-0.5 bg-red-500/80 backdrop-blur-sm rounded-md">
                                        Failed
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Name + title */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white leading-tight truncate">
                                {fullName || "abc"}
                            </h1>
                            <p className="text-white/60 font-medium text-xs md:text-sm mt-0.5 truncate">
                                {designation || "cba"} · {department || "Information Technology"}
                            </p>
                        </div>
                    </div>

                    {/* Chips — horizontally scrollable so nothing clips on small screens */}
                    <div className="profile-chip-row">
                        <div className="profile-chip flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white text-[11px] font-semibold">
                            <Building size={12} className="opacity-80" />
                            <span>InvenTech</span>
                        </div>
                        <div className="profile-chip flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white text-[11px] font-semibold">
                            <CreditCard size={12} className="opacity-80" />
                            <span>{displayEmployeeId || "ABC-01"}</span>
                        </div>
                    </div>

                    <hr className="border-t border-dashed border-white/20 my-0.5" />

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold tracking-wider text-white/40 uppercase">
                                Joined
                            </span>
                            <span className="text-sm font-bold text-white tracking-wide mt-0.5">
                                {joiningDateShort}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Information — one field after another */}
            <div className="profile-info-card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1E3A8A] flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-white" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-[#1B2559]">Personal Information</h2>
                </div>

                <div className="profile-field-list">
                    <FieldRow
                        icon={<User className="text-[#667eea] w-4 h-4" />}
                        iconBg="bg-blue-50"
                        label="Full Name"
                        value={fullName}
                    />
                    <FieldRow
                        icon={<CreditCard className="text-[#764ba2] w-4 h-4" />}
                        iconBg="bg-purple-50"
                        label="Employee ID"
                        value={displayEmployeeId}
                    />
                    <FieldRow
                        icon={<Building className="text-[#05CD99] w-4 h-4" />}
                        iconBg="bg-green-50"
                        label="Department"
                        value={department}
                    />
                    <FieldRow
                        icon={<Briefcase className="text-[#FFB020] w-4 h-4" />}
                        iconBg="bg-orange-50"
                        label="Designation"
                        value={designation}
                    />
                    <FieldRow
                        icon={<Mail className="text-[#EE5D50] w-4 h-4" />}
                        iconBg="bg-red-50"
                        label="Email Address"
                        value={email}
                    />
                    <FieldRow
                        icon={<ShieldCheck className="text-[#4318FF] w-4 h-4" />}
                        iconBg="bg-indigo-50"
                        label="User Role"
                        value={role}
                    />
                    <FieldRow
                        icon={<Briefcase className="text-blue-500 w-4 h-4" />}
                        iconBg="bg-blue-50"
                        label="Employment Type"
                        value={employmentTypeLabel}
                    />
                    <FieldRow
                        icon={<Calendar className="text-cyan-500 w-4 h-4" />}
                        iconBg="bg-cyan-50"
                        label="Date of Joining"
                        value={joiningDateLong}
                    />
                    <FieldRow
                        icon={<User className="text-[#667eea] w-4 h-4" />}
                        iconBg="bg-pink-50"
                        label="Gender"
                        value={genderLabel}
                    />
                    <FieldRow
                        icon={<Users className="text-[#667eea] w-4 h-4" />}
                        iconBg="bg-blue-50"
                        label="Assigned Manager"
                        value={managerName}
                    />
                </div>
            </div>

            {/* Image Modal */}
            <Modal
                open={isImageModalOpen}
                onCancel={() => setIsImageModalOpen(false)}
                footer={null}
                centered
                width="92%"
                style={{ maxWidth: 420 }}
                className="profile-modal"
            >
                <div className="flex flex-col items-center gap-6 py-4 px-2">
                    <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-50">
                        <img
                            src={profileImageUrl || defaultImage}
                            alt="Profile Preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full justify-center">
                        <button
                            onClick={() => {
                                setIsImageModalOpen(false);
                                setTimeout(() => handleCameraClick(), 100);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-2xl shadow-lg hover:shadow-xl transition-all font-bold text-sm"
                        >
                            <Camera size={18} />
                            <span>Change</span>
                        </button>
                        <button
                            onClick={() => {
                                handleConfirmRemove();
                                setIsImageModalOpen(false);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 rounded-2xl border border-red-100 shadow-md hover:bg-red-100 transition-all font-bold text-sm"
                        >
                            <Trash2 size={18} />
                            <span>Remove</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
export default MyProfileResponsive;