import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Mail,
  Briefcase,
  User,
  Building,
  CreditCard,
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
    <div className="px-4 md:px-8 pt-3 pb-8 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 space-y-3">
      {/* Top Card - User Header with Gradient */}
      <div className="relative overflow-hidden rounded-[24px] shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100">
        {/* Gradient Background */}
        <div
          className="absolute inset-0 opacity-100"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10 p-3 flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="flex flex-col items-center gap-2">
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
              <div className="p-1 rounded-full bg-white shadow-xl overflow-hidden">
                <img
                  src={profileImageUrl || defaultImage}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
              </div>
              <div className="absolute bottom-1 right-1 bg-white text-[#667eea] p-1.5 rounded-full shadow-lg transition-transform group-hover:scale-110">
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

          <div className="text-center md:text-left flex-1 mt-1">
            <h1 className="text-2xl font-black text-white mb-0.5">
              {entity?.fullName || entity?.name || ""}
            </h1>
            <p className="text-white/90 font-semibold text-base mb-3">
              {entity?.designation || ""}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-white/80">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                <Building size={14} />
                <span className="font-medium">InvenTech</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                <CreditCard size={14} />
                <span className="font-medium">
                  {entity?.employeeId || entity?.id || ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#1B2559]">
            Personal Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Full Name
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.fullName || entity?.name || ""}
                className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all focus:border-[#667eea] focus:bg-white"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="text-[#667eea] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Employee ID */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Employee ID
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.employeeId || entity?.id || ""}
                className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all focus:border-[#667eea] focus:bg-white"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <CreditCard className="text-[#764ba2] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Department
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.department || ""}
                className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all focus:border-[#667eea] focus:bg-white"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <Building className="text-[#05CD99] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Designation */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Designation
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.designation || ""}
                className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all focus:border-[#667eea] focus:bg-white"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                <Briefcase className="text-[#FFB020] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Email Address
            </label>
            <div className="relative group">
              <input
                type="email"
                disabled
                value={entity?.email || ""}
                className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all focus:border-[#667eea] focus:bg-white"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                <Mail className="text-[#EE5D50] w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
