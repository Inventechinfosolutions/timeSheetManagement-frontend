import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { verifyActivationEmployee, clearActivationState } from '../reducers/public.reducer';
import { AppDispatch, RootState } from '../store';

const FcManagerActivation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const token = searchParams.get('token');
  
  const { 
    activationLoading, 
    activationError
  } = useSelector((state: RootState) => state.public);

  useEffect(() => {
    if (token) {
      dispatch(verifyActivationEmployee({ token }));
    }

    return () => {
      dispatch(clearActivationState());
    };
  }, [token, dispatch]);

  const handleGoToLogin = () => {
    navigate('/landing');
  };

  const WatermarkBackground = () => (
    <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-20 p-10 rotate-12 scale-150">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center grayscale">
             <div className="w-16 h-20 border-2 border-current rounded-lg flex flex-col p-1.5 gap-1">
                <div className="w-full h-2 bg-current rounded-full"></div>
                <div className="w-2/3 h-2 bg-current rounded-full opacity-50"></div>
                <div className="mt-auto flex justify-between">
                  <div className="w-4 h-4 bg-current rounded-sm"></div>
                  <div className="w-8 h-4 bg-current rounded-sm opacity-30"></div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f8f9fc] relative overflow-hidden font-sans">
      <WatermarkBackground />

      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-16 text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {activationLoading ? (
          <div className="py-10">
            <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center bg-blue-50 rounded-full">
              <Loader2 className="w-10 h-10 text-[#00a3c4] animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-[#2B3674] mb-3 tracking-tight">Verifying...</h2>
          </div>
        ) : activationError || !token ? (
          <div className="py-4">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 transition-transform hover:scale-105 duration-300">
              <XCircle className="w-14 h-14 text-red-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#2B3674] mb-4 tracking-tight">Activation Failed</h2>
            <p className="text-gray-500 font-medium mb-10 max-w-xs mx-auto leading-relaxed">
              {activationError || 'The activation link is invalid or has expired.'}
            </p>
            <button
              onClick={handleGoToLogin}
              className="w-full bg-[#00a3c4] hover:bg-[#008ba8] text-white px-8 py-4 rounded-xl font-bold transition-all"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="py-2">
            {/* Success Icon Perfectly Centered like screenshot */}
            <div className="relative mb-8 flex justify-center">
              <div className="w-24 h-24 bg-[#66db69] rounded-full flex items-center justify-center relative shadow-[0_0_20px_rgba(102,219,105,0.3)]">
                <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Success Text */}
            <h2 className="text-3xl font-bold text-[#333333] mb-4 tracking-tight">
              Account Activated Successfully!
            </h2>
            <p className="text-gray-400 font-normal text-sm mb-10 leading-relaxed">
              Click below to go to the login page.
            </p>

            {/* Action Button - Exact blue from screenshot */}
            <button
              onClick={handleGoToLogin}
              className="bg-[#0095ff] hover:bg-[#0081dd] text-white px-5 py-2.5 rounded-md font-medium text-sm transition-all shadow-sm active:scale-95 duration-200"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#A3AED0] font-bold text-sm tracking-widest uppercase opacity-40">
        Keonics Portal • Security Verified
      </div>
    </div>
  );
};

export default FcManagerActivation;
