
import React from 'react';
import { X, Calendar, CheckCircle2, AlertTriangle, Clock, CalendarDays, Rocket } from 'lucide-react';

interface AutoUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  monthName: string;
  year: number;
  loading?: boolean;
}

const AutoUpdateModal: React.FC<AutoUpdateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  monthName,
  year,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-white rounded-[20px] md:rounded-[24px] shadow-2xl overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200 border border-white/50 flex flex-col max-h-[85vh]">
        
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-[#4318FF] to-[#868CFF] py-3.5 px-4 text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#000]/10 rounded-full blur-xl transform -translate-x-5 translate-y-5" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center mb-1.5 shadow-lg border border-white/30">
              <Rocket className="text-white w-5 h-5" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Auto Fill-Timesheet
            </h2>
            <p className="text-blue-100 text-[11px] font-medium mt-0.5">
              For {monthName} {year}
            </p>
          </div>

          <button 
            onClick={onClose}
            disabled={loading}
            className="absolute top-3 right-3 z-20 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          <div className="bg-blue-50/50 rounded-xl p-2.5 border border-blue-100">
            <p className="text-[11px] md:text-xs text-gray-600 leading-normal text-center font-medium">
              This will automatically log <span className="text-[#4318FF] font-bold">9 hours (Office)</span> for all past eligible working days this month.
            </p>
          </div>

          {/* Exclusions List */}
          <div className="space-y-1.5">
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Exclusions Rule
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Weekends', icon: CalendarDays, color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Holidays', icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'Approved Leaves', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Half Day Leave', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Filled Days', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
              ].map((item, idx) => (
                <div key={idx} className={`${item.bg} p-1.5 rounded-lg border border-white flex items-center gap-1.5 transition-transform hover:scale-[1.02]`}>
                  <item.icon size={12} className={item.color} />
                  <span className="text-[10px] font-bold text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning Note */}
          <div className="flex gap-2 items-start p-2 bg-gray-50 rounded-xl border border-gray-100">
            <AlertTriangle className="text-gray-400 w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-500 leading-tight">
              Only empty days will be filled. Existing entries will not be overwritten.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 pt-1.5 bg-white sticky bottom-0 z-1 flex gap-2 shrink-0 border-t border-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 px-3 rounded-lg font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-[11px] md:text-xs"
          >
            Cancel
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-[2] py-2 px-3 rounded-lg font-bold text-white bg-gradient-to-r from-[#4318FF] to-[#868CFF] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:to-[#4318FF] transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:pointer-events-none text-[11px] md:text-xs"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Rocket size={14} className="animate-pulse" />
                <span>Confirm & Auto-Fill</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoUpdateModal;
