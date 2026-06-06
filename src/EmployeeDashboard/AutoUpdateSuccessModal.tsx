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
      <div className="relative w-full max-w-sm bg-white rounded-[20px] md:rounded-[24px] shadow-2xl overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200 border border-white/50 flex flex-col max-h-[85vh]">
        
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 py-3.5 px-4 text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#000]/10 rounded-full blur-xl transform -translate-x-5 translate-y-5" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center mb-1.5 shadow-lg border border-white/30">
              <CheckCircle2 className="text-white w-5 h-5" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              {isUpToDate ? 'Attendance Up to Date!' : 'Auto Update Successful!'}
            </h2>
            <p className="text-green-100 text-[11px] font-medium mt-0.5">
              {monthName} {year}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-3 right-3 z-20 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          {isUpToDate ? (
            <div className="bg-green-50/50 rounded-xl p-2.5 border border-green-100 text-center">
              <Calendar className="w-7 h-7 text-green-500 mx-auto mb-1.5" />
              <p className="text-xs md:text-sm font-bold text-gray-700 mb-1">
                Attendance is Up to Date
              </p>
              <p className="text-[10px] md:text-xs text-gray-600">
                All eligible working days have been filled. No updates were needed.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-green-50/50 rounded-xl p-2.5 border border-green-100 text-center">
                <TrendingUp className="w-7 h-7 text-green-500 mx-auto mb-1.5" />
                <p className="text-xs md:text-sm font-bold text-gray-700 mb-1">
                  Successfully Updated
                </p>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-2xl font-black text-green-600">{count}</span>
                  <span className="text-gray-600 font-bold text-[11px] md:text-xs">
                    {count === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <p className="text-[9px] md:text-[10px] text-gray-500 mt-1">
                  All eligible working days have been filled with 9 hours.
                </p>
              </div>

              <div className="flex gap-2 items-start p-2 bg-blue-50 rounded-xl border border-blue-100">
                <CheckCircle2 className="text-blue-500 w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-500 leading-tight">
                  Your timesheet has been automatically updated. You can review and make any adjustments if needed.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 pt-1.5 bg-white sticky bottom-0 z-1 border-t border-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 px-3 rounded-lg font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:to-green-500 transition-all active:scale-95 flex items-center justify-center gap-1.5 text-[11px] md:text-xs"
          >
            <CheckCircle2 size={14} />
            <span>Got It!</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoUpdateSuccessModal;
