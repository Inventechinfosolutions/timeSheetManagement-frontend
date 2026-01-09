import React, { useState, useRef } from "react";
import {
  Camera,
  Mail,
  Briefcase,
  User,
  Building,
  CreditCard,
} from "lucide-react";
import { useAppSelector } from "../hooks";

const MyProfile = () => {
  const { entity } = useAppSelector((state) => state.employeeDetails);

  // Use entity values or fallbacks
  const [profileImage, setProfileImage] = useState(
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=2576&auto=format&fit=crop"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Top Card - User Header */}
      <div className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-100 flex items-center gap-6 relative overflow-hidden">
        <div
          className="relative group cursor-pointer inline-block"
          onClick={handleCameraClick}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
          <div className="p-1 rounded-full border-4 border-[#00A3C4] shadow-sm">
            <img
              src={profileImage}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
          </div>
          <div className="absolute bottom-1 right-1 bg-[#00A3C4] text-white p-1.5 rounded-full border border-white shadow-sm transition-transform group-hover:scale-110">
            <Camera size={14} />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#2B3674]">
            {entity?.fullName || "Employee"}
          </h1>
          <p className="text-gray-400 font-medium text-sm">Employee</p>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400 font-medium">
            <Building size={14} className="text-gray-400" />
            <span>InvenTech</span>
          </div>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-[#2B3674]">
            Personal Information
          </h2>
        </div>
        <div className="mb-8">
          <div className="h-px bg-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] w-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">
              Full Name
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                defaultValue={entity?.fullName || ""}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-100 rounded-xl bg-[#F4F7FE] text-[#2B3674] text-xs font-medium"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            </div>
          </div>

          {/* Employee ID */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">
              Employee ID
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                defaultValue={entity?.employeeId || ""}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-100 rounded-xl bg-[#F4F7FE] text-[#2B3674] text-xs font-medium"
              />
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">
              Department
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                defaultValue={entity?.department || ""}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-100 rounded-xl bg-[#F4F7FE] text-[#2B3674] text-xs font-medium"
              />
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            </div>
          </div>

          {/* Designation */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">
              Designation
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                defaultValue={entity?.designation || ""}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-100 rounded-xl bg-[#F4F7FE] text-[#2B3674] text-xs font-medium"
              />
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5">
              Email Address
            </label>
            <div className="relative group">
              <input
                type="email"
                disabled
                defaultValue={entity?.email || ""}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-100 rounded-xl bg-[#F4F7FE] text-[#2B3674] text-xs font-medium"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
