import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { verifyActivationEmployee, clearActivationState } from '../reducers/public.reducer';
import { AppDispatch, RootState } from '../store';
import inventechLogo from '../assets/inventech-logo.jpg';

const EmployeeActivation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const token = searchParams.get('token');
  
  const { 
    activationLoading, 
    activationError, 
    activationResponse 
  } = useSelector((state: RootState) => state.public);

  useEffect(() => {
    if (token) {
      dispatch(verifyActivationEmployee({ token }));
    } else {
      // No token provided handling is done in JSX
    }

    return () => {
      dispatch(clearActivationState());
    };
  }, [token, dispatch]);

  const handleGoToLogin = () => {
    navigate('/landing');
  };

  // Loading State
  if (activationLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-[#1c9cc0] animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Your Account</h2>
          <p className="text-gray-500 text-sm">Please wait while we verify your activation link...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (activationError || !token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Activation Failed</h2>
          <p className="text-gray-600 text-sm mb-6">{activationError || 'Invalid activation link or token is missing.'}</p>
          <button
            onClick={handleGoToLogin}
            className="bg-[#1c9cc0] hover:bg-[#178ba8] text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-green-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-emerald-200 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-teal-200 rounded-full blur-2xl"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center relative z-10 border border-gray-100">
        {/* Logo */}
        <div className="w-16 h-16 bg-gray-50 rounded-xl p-2 mx-auto mb-4 border border-gray-100 shadow-sm flex items-center justify-center">
          <img
            src={inventechLogo}
            alt="Logo"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>

        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>

        {/* Success Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Activated Successfully!</h2>
        <p className="text-gray-500 text-sm mb-8">
          Click below to go to the login page.
        </p>

        {/* Employee Info (if available) */}
        {activationResponse && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Welcome,</p>
            <p className="font-semibold text-gray-900">{activationResponse.fullName}</p>
            {activationResponse.email && (
              <p className="text-sm text-gray-600 mt-1">{activationResponse.email}</p>
            )}
          </div>
        )}

        {/* Go to Login Button */}
        <button
          onClick={handleGoToLogin}
          className="w-full bg-[#1c9cc0] hover:bg-[#178ba8] text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default EmployeeActivation;
