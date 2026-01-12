import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Copy, Check, Loader2 } from 'lucide-react';
import { generateEmailActivationLink, reset as resetLink } from '../reducers/employeeLink.reducer';
import { RootState, AppDispatch } from '../store';

interface ActivationSuccessProps {
  email: string;
  loginId: string;
  password?: string;
  activationLink?: string;
  employeeId?: number; // Internal DB ID needed for link generation
  onBack?: () => void;
}

const ActivationSuccess: React.FC<Partial<ActivationSuccessProps>> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const state = location.state as ActivationSuccessProps | undefined;

  const { loading, activationResponse, errorMessage } = useSelector(
    (state: RootState) => state.employeeLink
  );

  // Derive initial values from props or navigation state
  const email = props.email || state?.email || ''; // API response doesn't include email
  const loginId = props.loginId || state?.loginId || activationResponse?.employeeId || '';
  const employeeId = props.employeeId || state?.employeeId;

  // Values might come from props/state (if pre-generated) or from Redux (if generated here)
  const password = props.password || state?.password || activationResponse?.password || '';
  const activationLink = props.activationLink || state?.activationLink || activationResponse?.activationLink || '';
  
  const onBack = props.onBack || (() => navigate('/admin-dashboard/registration')); // Default back to registration

  useEffect(() => {
    console.log('ActivationSuccess State:', { employeeId, activationLink, password, activationResponse, loading });
    // If we have an employee ID but no link/password, dispatch generation
    if (employeeId && !activationLink && !password && !activationResponse && !loading) {
       console.log('Triggering generateEmailActivationLink for:', employeeId);
       dispatch(generateEmailActivationLink(employeeId));
    }
  }, [employeeId, activationLink, password, activationResponse, loading, dispatch]);
  
  useEffect(() => {
      // Cleanup on unmount
      return () => {
          if (activationResponse) {
              dispatch(resetLink());
          }
      };
  }, [dispatch, activationResponse]);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleResend = () => {
    const emailToUse = email || '';
    const newEmail = window.prompt("Please confirm or enter the email address to send the activation link to:", emailToUse);
    if (newEmail && employeeId) {
        dispatch(generateEmailActivationLink(employeeId));
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white bg-opacity-90 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 text-center backdrop-blur-sm border border-white/20">
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          TIME-SHEET Registration
        </h2>
        
        <div className="text-sm text-gray-600 mb-8 space-y-1">
          <p>We have sent verification link to your email id</p>
          <p className="font-medium text-gray-900 text-base py-1">{email}</p>
          <p>Please check your email to verify</p>
        </div>

        <div className="mb-8">
           <h3 className="text-lg font-bold text-gray-800 mb-6">
            Your Login Credentials :
           </h3>
           
           <div className="flex flex-wrap items-center justify-center gap-6 select-none min-h-[100px]">
              {loading ? (
                  <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <p className="text-sm">Generating Credentials...</p>
                  </div>
              ) : errorMessage ? (
                  <div className="text-red-500 text-sm font-medium">
                      Failed to generate credentials: {errorMessage}
                      <button 
                        onClick={handleResend}
                        className="block mt-2 text-blue-600 hover:underline mx-auto"
                      >
                          Not received email?
                      </button>
                  </div>
              ) : (
                <>
                  {/* Login ID */}
                  <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 text-sm">Login ID:</span>
                      <button 
                          onClick={() => handleCopy(loginId, 'loginId')}
                          className="text-[#1A73E8] hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50 relative group"
                          title="Copy Login ID"
                      >
                          {copiedField === 'loginId' ? <Check size={18} /> : <Copy size={18} />}
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {loginId}
                          </span>
                      </button>
                  </div>

                  {/* Password */}
                  <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 text-sm">Password:</span>
                      <button 
                          onClick={() => handleCopy(password, 'password')}
                          className="text-[#1A73E8] hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50 relative group"
                           title="Copy Password"
                      >
                           {copiedField === 'password' ? <Check size={18} /> : <Copy size={18} />}
                           <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {password}
                          </span>
                      </button>
                  </div>

                   {/* Activation Link */}
                   <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 text-sm">Activation Link:</span>
                      <button 
                           onClick={() => handleCopy(activationLink, 'activationLink')}
                           className="text-[#1A73E8] hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50 relative group"
                            title="Copy Link"
                      >
                          {copiedField === 'activationLink' ? <Check size={18} /> : <Copy size={18} />}
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            Copy Link
                          </span>
                      </button>
                  </div>
                </>
              )}
           </div>
           
           <p className="text-xs text-gray-400 mt-6 font-medium">
              Please save these credentials for future login
           </p>
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onBack}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all border border-gray-200"
            >
              Back
            </button>
          </div>
          <button 
            onClick={handleResend}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium hover:underline text-center"
          >
            Not received email?
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivationSuccess;


