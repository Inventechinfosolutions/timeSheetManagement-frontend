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
import inventechLogo from "../assets/inventech-logo.jpg";
import defaultAvatar from "../assets/default-avatar.jpg";

const MyProfile = () => {
  const dispatch = useAppDispatch();
  const { entity } = useAppSelector((state) => state.employeeDetails);
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
  const displayEmployeeId = entity?.employeeId;

  // Use entity values or fallbacks
  // Default to a local asset if no image found in entity
  const defaultImage = defaultAvatar;
  const [profileImage, setProfileImage] = useState(defaultImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailsFetched = useRef(false);
  const imageFetchedForId = useRef<number | null>(null);

  // Debug logs
  useEffect(() => {
    console.log(
      "MyProfile: Component mounted or searchId changed:",
      currentSearchId
    );
  }, [currentSearchId]);

  // Effect: Fetch Full Employee Details
  useEffect(() => {
    if (currentSearchId) {
      console.log("MyProfile: Calling getEntities for:", currentSearchId);
      dispatch(
        getEntities({ page: 1, limit: 10, search: String(currentSearchId) })
      )
        .unwrap()
        .then((response) => {
          const dataList = Array.isArray(response)
            ? response
            : response.data || [];
          const foundUser = dataList.find(
            (u: any) =>
              String(u.email || "").toLowerCase() ===
                String(currentSearchId).toLowerCase() ||
              String(u.loginId || "").toLowerCase() ===
                String(currentSearchId).toLowerCase() ||
              String(u.employeeId || "").toLowerCase() ===
                String(currentSearchId).toLowerCase() ||
              (u.fullName && u.fullName === currentUser?.aliasLoginName) ||
              (u.name && u.name === currentUser?.aliasLoginName)
          );

          if (foundUser) {
            dispatch(setCurrentUser(foundUser));
            if (foundUser.profileImage || foundUser.image) {
              setProfileImage(foundUser.profileImage || foundUser.image);
            }
          } else if (dataList.length === 1) {
            dispatch(setCurrentUser(dataList[0]));
            if (dataList[0].profileImage || dataList[0].image) {
              setProfileImage(dataList[0].profileImage || dataList[0].image);
            }
          }
        })
        .catch((err) => console.error("MyProfile: API Error:", err));
    }
  }, [dispatch, currentSearchId]);

  // Sync state with entity updates from authMe or other components
  useEffect(() => {
    if (entity?.profileImage || entity?.image) {
      setProfileImage(entity.profileImage || entity.image);
    }
  }, [entity]);

  // Effect: Fetch Full Employee Details & Image on Mount
  useEffect(() => {
    // 1. Fetch data using the string ID (if available) - assuming search works with string ID
    if (displayEmployeeId) {
      if (detailsFetched.current) return;
      detailsFetched.current = true;

      dispatch(getEntities({ page: 1, limit: 1, search: displayEmployeeId }))
        .unwrap()
        .then((response) => {
          const dataList = Array.isArray(response)
            ? response
            : response.data || [];
          const foundUser = dataList.find(
            (u: any) => u.employeeId === displayEmployeeId
          );

          if (foundUser) {
            dispatch(setCurrentUser(foundUser));
          }
        })
        .catch((err) => {
          detailsFetched.current = false;
          console.error("Failed to fetch profile data:", err);
        });
    }

    // 2. Securely Fetch Profile Image using Numeric ID
    if (currentDbId) {
      if (imageFetchedForId.current === currentDbId) return;
      imageFetchedForId.current = currentDbId;

      dispatch(fetchProfileImage(currentDbId))
        .unwrap()
        .then((blobUrl) => {
          setProfileImage(blobUrl);
        })
        .catch(() => {
          imageFetchedForId.current = null;
          setProfileImage(defaultImage);
        });
    }
  }, [dispatch, displayEmployeeId, currentDbId]);

  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentDbId) {
      // 1. Show Preview Immediately
      setUploadStatus("idle");
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // 2. Upload to Backend Immediately
      dispatch(uploadProfileImage({ id: currentDbId, file }))
        .unwrap()
        .then(() => {
          console.log("Profile image uploaded successfully");
          setUploadStatus("success");
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
    <div className="px-4 md:px-8 pt-1 pb-8 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 space-y-6">
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
        <div className="relative z-10 p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
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
              <div className="p-1.5 rounded-full bg-white shadow-xl">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover"
                />
              </div>
              <div className="absolute bottom-2 right-2 bg-white text-[#667eea] p-2 rounded-full shadow-lg transition-transform group-hover:scale-110">
                <Camera size={16} />
              </div>
            </div>

            <div className="h-5 flex items-center justify-center">
              {uploadStatus === "success" && (
                <span className="text-white text-xs font-bold animate-in fade-in slide-in-from-top-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                  ✓ Updated
                </span>
              )}
              {uploadStatus === "error" && (
                <span className="text-white text-xs font-bold animate-in fade-in slide-in-from-top-1 px-3 py-1 bg-red-500/80 backdrop-blur-sm rounded-full">
                  Upload Failed
                </span>
              )}
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-black text-white mb-1">
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
      <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#1B2559]">
            Personal Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Full Name
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.fullName || entity?.name || ""}
                className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all focus:border-[#667eea] focus:bg-white"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="text-[#667eea] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Employee ID */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Employee ID
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.employeeId || entity?.id || ""}
                className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all focus:border-[#667eea] focus:bg-white"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <CreditCard className="text-[#764ba2] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Department
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.department || ""}
                className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all focus:border-[#667eea] focus:bg-white"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <Building className="text-[#05CD99] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Designation */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Designation
            </label>
            <div className="relative group">
              <input
                type="text"
                disabled
                value={entity?.designation || ""}
                className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all focus:border-[#667eea] focus:bg-white"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                <Briefcase className="text-[#FFB020] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Email Address
            </label>
            <div className="relative group">
              <input
                type="email"
                disabled
                value={entity?.email || ""}
                className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-[#1B2559] text-sm font-semibold transition-all focus:border-[#667eea] focus:bg-white"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
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
