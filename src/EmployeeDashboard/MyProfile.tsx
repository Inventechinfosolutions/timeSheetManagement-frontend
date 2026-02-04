import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Mail,
  Briefcase,
  User,
  Building,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../hooks";
import {
  getEntities,
  setCurrentUser,
  uploadProfileImage,
  fetchProfileImage,
} from "../reducers/employeeDetails.reducer";
import defaultAvatar from "../assets/default-avatar.jpg";

const MyProfile = () => {
  const dispatch = useAppDispatch();
  const { entity, profileImageUrl } = useAppSelector(
    (state) => state.employeeDetails,
  );
  const { currentUser } = useAppSelector((state) => state.user);

  // Identify current user ID from the session (set during login)
  // Logic: 1. check Redux currentUser, 2. check Redux entity (last fetched), 3. check localStorage (persisted on login)
  const currentSearchId =
    currentUser?.loginId ||
    entity?.employeeId ||
    localStorage.getItem("userLoginId");

  // Use entity values or fallbacks
  // const defaultImage =
  //   "https://media.istockphoto.com/id/1389610405/vector/avatar-man-user-icon.webp?a=1&b=1&s=612x612&w=0&k=20&c=044RCWtERyeaZmepUN5Zpca7CXL5sLFgHd9JoZosTPE=";

  // Use the database Primary Key (number) for API calls, fallback to employeeId string if needed for display
  const currentDbId = entity?.id;
  const displayEmployeeId = entity?.employeeId || String(currentSearchId || "");

  // Use entity values or fallbacks
  // Default to a local asset if no image found in entity
  const defaultImage = defaultAvatar;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailsFetched = useRef(false);
  const imageFetchedForId = useRef<string | null>(null);

  // Debug logs
  useEffect(() => {
    console.log(
      "MyProfile: Component mounted or searchId changed:",
      currentSearchId,
    );
  }, [currentSearchId]);

  // Effect: Fetch Full Employee Details & Profile Image
  useEffect(() => {
    if (currentSearchId && !detailsFetched.current) {
      console.log(
        "MyProfile: Initial fetch via direct API for:",
        currentSearchId,
      );
      detailsFetched.current = true;

      dispatch(getEntities({ search: String(currentSearchId) }))
        .unwrap()
        .then((response: any) => {
          const list = Array.isArray(response) ? response : response.data || [];
          const foundUser = list.length > 0 ? list[0] : null;

          if (foundUser) {
            dispatch(setCurrentUser(foundUser));

            // Immediately fetch the profile image if we have an ID
            const empId = foundUser.employeeId || foundUser.id;
            if (empId && imageFetchedForId.current !== String(empId)) {
              imageFetchedForId.current = String(empId);
              dispatch(fetchProfileImage(String(empId)))
                .unwrap()
                .catch(() => {
                  imageFetchedForId.current = null;
                });
            }
          }
        })
        .catch((err: any) => {
          detailsFetched.current = false;
          console.error("MyProfile: API Error:", err);
        });
    }
  }, [dispatch, currentSearchId]);

  // Sync state with entity updates from other components
  // (No longer needed since we use profileImageUrl from Redux)

  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Show Preview Immediately (Optional, but let's wait for upload to be safe or use a local preview if needed.
      // For now, let's just trigger upload and let fetchProfileImage handle the update)
      setUploadStatus("idle");

      // 2. Upload to Backend Immediately
      // The thunk expects { employeeId: string, file: File }
      const idToUse = displayEmployeeId || String(currentDbId || "");

      if (!idToUse) {
        console.error("No employee ID available for upload");
        return;
      }

      dispatch(uploadProfileImage({ employeeId: idToUse, file }))
        .unwrap()
        .then(() => {
          console.log("Profile image uploaded successfully");
          setUploadStatus("success");
          // Re-fetch image to update Redux state (and Header)
          dispatch(fetchProfileImage(idToUse));
          // Clear message after 3 seconds
          setTimeout(() => setUploadStatus("idle"), 3000);
        })
        .catch((err) => {
          console.error("Failed to upload info:", err);
          setUploadStatus("error");
          setTimeout(() => setUploadStatus("idle"), 3000);
        });
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="overflow-y-auto custom-scrollbar px-5 md:px-8 pt-6 pb-0 w-full max-w-[1000px] mx-auto animate-in fade-in duration-500 space-y-6 md:space-y-8">
      {/* Top Card - User Header with Gradient */}
      <div className="relative overflow-hidden rounded-[20px] md:rounded-[32px] shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100">
        {/* Gradient Background */}
        <div
          className="absolute inset-0 opacity-100"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10 p-4 md:p-5 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-5">
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative group cursor-pointer"
              onClick={handleCameraClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
              <div className="p-1 rounded-full bg-white shadow-2xl overflow-hidden border-4 border-white/20">
                <img
                  src={profileImageUrl || defaultImage}
                  alt="Profile"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 md:bottom-1 md:right-1 bg-white text-[#667eea] p-1.5 md:p-2 rounded-full shadow-lg transition-transform group-hover:scale-110 border-2 border-transparent group-hover:border-[#667eea]/10">
                <Camera size={14} />
              </div>
            </div>

            <div className="h-4 flex items-center justify-center">
              {uploadStatus === "success" && (
                <span className="text-white text-[10px] font-bold animate-in fade-in slide-in-from-top-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                  ✓ Updated
                </span>
              )}
              {uploadStatus === "error" && (
                <span className="text-white text-[10px] font-bold animate-in fade-in slide-in-from-top-1 px-2 py-0.5 bg-red-500/80 backdrop-blur-sm rounded-full">
                  Failed
                </span>
              )}
            </div>
          </div>

          <div className="text-center md:text-left flex-1 space-y-2">
            <div className="space-y-0">
              <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
                {entity?.fullName || entity?.name || ""}
              </h1>
              <p className="text-white/80 font-bold text-sm md:text-base">
                {entity?.designation || ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white text-[11px] font-bold">
                <Building size={14} />
                <span>InvenTech</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white text-[11px] font-bold">
                <CreditCard size={14} />
                <span>{entity?.employeeId || entity?.id || ""}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="bg-white rounded-[20px] md:rounded-[32px] p-6 md:p-8 shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#1B2559]">
            Personal Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 md:gap-y-8">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest pl-1">
              Full Name
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.fullName || entity?.name || ""}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-50 rounded-2xl bg-gray-50/40 text-[#1B2559] text-sm md:text-base font-bold transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <User className="text-[#667eea] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Employee ID */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest pl-1">
              Employee ID
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.employeeId || entity?.id || ""}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-50 rounded-2xl bg-gray-50/40 text-[#1B2559] text-sm md:text-base font-bold transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <CreditCard className="text-[#764ba2] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest pl-1">
              Department
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.department || ""}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl bg-gray-50/40 text-[#1B2559] text-sm md:text-base font-bold transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                <Building className="text-[#05CD99] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Designation */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest pl-1">
              Designation
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.designation || ""}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl bg-gray-50/40 text-[#1B2559] text-sm md:text-base font-bold transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                <Briefcase className="text-[#FFB020] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest pl-1">
              Email Address
            </label>
            <div className="relative group">
              <input
                type="email"
                disabled
                value={entity?.email || ""}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl bg-gray-50/40 text-[#1B2559] text-sm md:text-base font-bold transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <Mail className="text-[#EE5D50] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest pl-1">
              User Role
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.role || ""}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl bg-gray-50/40 text-[#1B2559] text-sm md:text-base font-bold transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                <ShieldCheck className="text-[#4318FF] w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
