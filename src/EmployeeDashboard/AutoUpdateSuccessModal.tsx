import React from 'react';
import { CheckCircle2, X, Calendar, TrendingUp } from 'lucide-react';

interface AutoUpdateSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  monthName: string;
  year: number;
}

const AutoUpdateSuccessModal: React.FC<AutoUpdateSuccessModalProps> = ({
  isOpen,
  onClose,
  count,
  monthName,
  year,
}) => {
  if (!isOpen) return null;

  const isUpToDate = count === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-green-900/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-[30px] shadow-2xl overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200 border border-white/50">
        
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#000]/10 rounded-full blur-xl transform -translate-x-5 translate-y-5" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
              <CheckCircle2 className="text-green-500 w-12 h-12" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {isUpToDate ? 'Attendance Up to Date!' : 'Auto Update Successful!'}
            </h2>
            <p className="text-green-100 text-sm font-medium mt-1">
              {monthName} {year}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {isUpToDate ? (
            <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100 text-center">
              <Calendar className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-bold text-gray-700 mb-2">
                Attendance is Up to Date
              </p>
              <p className="text-sm text-gray-600">
                All eligible working days have been filled. No updates were needed.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100 text-center">
                <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-bold text-gray-700 mb-2">
                  Successfully Updated
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-black text-green-600">{count}</span>
                  <span className="text-gray-600 font-medium">
                    {count === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  All eligible working days have been filled with 9 hours.
                </p>
              </div>

              <div className="flex gap-2 items-start p-3 bg-blue-50 rounded-xl border border-blue-100">
                <CheckCircle2 className="text-blue-500 w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 leading-tight">
                  Your timesheet has been automatically updated. You can review and make any adjustments if needed.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 bg-white sticky bottom-0 z-1">
          <button
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:to-green-500 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} />
            <span>Got It!</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoUpdateSuccessModal;
