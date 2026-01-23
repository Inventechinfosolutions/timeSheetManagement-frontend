import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle, Search } from "lucide-react";
import { Modal, Input, message } from "antd";
import inventechLogo from "../assets/inventech-logo.jpg";
import { useAppSelector, useAppDispatch } from "../hooks";
import {
  getEntities,
  setCurrentUser,
} from "../reducers/employeeDetails.reducer";
import {
  forgotPasswordOtp,
  clearAllPublicState,
  clearOtpState,
} from "../reducers/public.reducer";

type ResetStep = "ID" | "EMAIL" | "SUCCESS";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Cleanup on mount and unmount
  useEffect(() => {
    dispatch(clearOtpState());
    return () => {
      dispatch(clearOtpState());
    };
  }, [dispatch]);

  // Redux State
  // const { entity } = useAppSelector((state) => state.employeeDetails);
  const { otpLoading, otpError, otpSent } = useAppSelector(
    (state) => state.public,
  );

  // Local State
  const [step, setStep] = useState<ResetStep>("ID");
  const [email, setEmail] = useState("");
  const [loginId, setLoginId] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Modal State for ID Lookup
  const [isIdModalOpen, setIsIdModalOpen] = useState(true);
  const [searchId, setSearchId] = useState("");
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Sync Redux step changes with Local step
  useEffect(() => {
    if (otpSent && step === "EMAIL") {
      // 'otpSent' here means 'link sent' based on backend response
      setStep("SUCCESS");
      message.success("Reset link sent to your email");
    }
    if (otpError) {
      setError(otpError);
    }
  }, [otpSent, otpError, step]);

  // Handle ID Identification
  const handleIdSubmit = async () => {
    if (!searchId.trim()) {
      message.error("Please enter your Employee ID");
      return;
    }

    setIsIdentifying(true);
    try {
      const response: any = await dispatch(
        getEntities({ search: searchId.trim() }),
      ).unwrap();
      const list = Array.isArray(response) ? response : response.data || [];
      const foundUser = list.length > 0 ? list[0] : null;

      if (foundUser) {
        dispatch(setCurrentUser(foundUser));
        setEmail(foundUser.email || "");
        setLoginId(foundUser.employeeId || searchId.trim()); // Use internal ID if available, else what was typed
        setIsIdModalOpen(false);
        setStep("EMAIL");
      } else {
        message.error("No employee found with this ID");
      }
    } catch (err) {
      message.error("Error searching for employee");
    } finally {
      setIsIdentifying(false);
    }
  };

  // Step 1: Send Reset Link
  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    dispatch(forgotPasswordOtp({ loginId, email })); // Reusing existing thunk as it calls the backend trigger
  };

  const resetAll = () => {
    dispatch(clearAllPublicState());
    navigate("/landing");
  };

  if (step === "SUCCESS") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#1c9cc0] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2"></div>
        </div>

        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Link Sent!</h2>
          <p className="text-blue-100 mb-8 opacity-90 leading-relaxed">
            A password reset link has been sent to your email. <br />
            Please check your inbox and follow the instructions.
          </p>
          <button
            onClick={resetAll}
            className="w-full bg-white text-[#1c9cc0] font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-50 transition-all duration-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#1c9cc0] relative overflow-hidden">
      {/* Step 0: ID Lookup Modal */}
      <Modal
        title={null}
        open={isIdModalOpen}
        onCancel={() => navigate("/landing")}
        footer={null}
        centered
        closable={false}
        styles={{
          mask: {
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(28, 156, 192, 0.4)",
          },
          body: { borderRadius: "24px", padding: 0, overflow: "hidden" },
        }}
      >
        <div className="p-8 sm:p-10 bg-white text-center">
          <Search className="w-12 h-12 text-[#1c9cc0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Identify Yourself
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Please enter your Employee ID to proceed.
          </p>
          <div className="space-y-6">
            <Input
              placeholder="Employee ID"
              size="large"
              className="rounded-xl h-12"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onPressEnter={handleIdSubmit}
            />
            <button
              onClick={handleIdSubmit}
              disabled={isIdentifying}
              className="w-full bg-[#1c9cc0] text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isIdentifying ? (
                <Loader2 className="animate-spin" />
              ) : (
                "IDENTIFY EMPLOYEE"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Main Container */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 relative z-10">
        <button
          onClick={() => navigate("/landing")}
          className="absolute left-6 top-6 text-blue-100 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft size={16} /> BACK
        </button>

        <div className="text-center mb-8 mt-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl p-2 mx-auto mb-4 flex items-center justify-center">
            <img
              src={inventechLogo}
              alt="Logo"
              className="w-full h-full object-contain mix-blend-multiply opacity-90 rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {step === "EMAIL" && "Confirm Email"}
          </h1>
          <p className="text-blue-100 text-sm opacity-90">
            {step === "EMAIL" &&
              "We will send a password reset link to your registered email."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-white text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* STEP 1: SEND LINK FORM */}
        {step === "EMAIL" && (
          <form onSubmit={handleSendLink} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                Registered Email
              </label>
              <div className="relative">
                <Input
                  value={email}
                  readOnly
                  className="pl-10 h-12 bg-white/20 border-white/30 text-white rounded-xl"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-100 w-5 h-5" />
              </div>
            </div>
            <button
              type="submit"
              disabled={otpLoading}
              className="w-full bg-white text-[#1c9cc0] font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {otpLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "SEND RESET LINK"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
