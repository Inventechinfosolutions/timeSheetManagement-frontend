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
import { getEntities, setCurrentUser, uploadProfileImage, fetchProfileImage } from "../reducers/employeeDetails.reducer";
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
                const dataList = Array.isArray(response) ? response : (response.data || []);
                const foundUser = dataList.find((u: any) => u.employeeId === displayEmployeeId);
                
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




  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentDbId) {
      // 1. Show Preview Immediately
      setUploadStatus('idle');
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
          setUploadStatus('success');
          // Clear message after 3 seconds
          setTimeout(() => setUploadStatus('idle'), 3000);
        })
        .catch((err) => {
             console.error("Failed to upload info:", err);
             setUploadStatus('error');
             setTimeout(() => setUploadStatus('idle'), 3000);
        });
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="px-8 pt-1 pb-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-2">
      {/* Top Card - User Header */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 flex items-center gap-6 relative">
        <div className="flex flex-col items-center gap-1">
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
          
          <div className="h-4 flex items-center justify-center">
            {uploadStatus === 'success' && (
              <span className="text-[#01B574] text-[10px] font-bold animate-in fade-in slide-in-from-top-1 px-2 py-0.5 bg-green-50 rounded-full">
                Successfully updated
              </span>
            )}
            {uploadStatus === 'error' && (
              <span className="text-red-500 text-[10px] font-bold animate-in fade-in slide-in-from-top-1 px-2 py-0.5 bg-red-50 rounded-full">
                Upload Failed
              </span>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#2B3674]">
            {entity?.fullName || entity?.name || ""}
          </h1>
          <p className="text-gray-400 font-medium text-sm">
            {entity?.designation || ""}
          </p>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400 font-medium">
            <Building size={14} className="text-gray-400" />
            <span>InvenTech</span>
          </div>
        </div>

      </div>

      {/* Personal Information Card */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-[#2B3674]">
            Personal Information
          </h2>
        </div>
        <div className="mb-6">
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
                value={entity?.fullName || entity?.name || ""}
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
                value={entity?.employeeId || entity?.id || ""}
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
                value={entity?.department || ""}
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
                value={entity?.designation || ""}
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
                value={entity?.email || ""}
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
