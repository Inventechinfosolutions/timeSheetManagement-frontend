
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
      <div className="relative w-full max-w-md bg-white rounded-[30px] shadow-2xl overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200 border border-white/50">
        
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-[#4318FF] to-[#868CFF] p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#000]/10 rounded-full blur-xl transform -translate-x-5 translate-y-5" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-white/30">
              <Rocket className="text-white w-8 h-8" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Auto Update Timesheet
            </h2>
            <p className="text-blue-100 text-sm font-medium mt-1">
              {monthName} {year}
            </p>
          </div>

          <button 
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
            <p className="text-sm text-gray-600 leading-relaxed text-center font-medium">
              This will automatically fill <span className="text-[#4318FF] font-black">9 hours</span> for all eligible working days in the current month up to today.
            </p>
          </div>

          {/* Exclusions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
              Exclusions Rule
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Weekends', icon: CalendarDays, color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Holidays', icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'Approved Leaves', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Half Days', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Filled Days', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
              ].map((item, idx) => (
                <div key={idx} className={`${item.bg} p-2.5 rounded-xl border border-white flex items-center gap-2.5 transition-transform hover:scale-[1.02]`}>
                  <item.icon size={16} className={item.color} />
                  <span className="text-xs font-bold text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning Note */}
          <div className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
            <AlertTriangle className="text-gray-400 w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-tight">
              Only days with <strong>no existing entries</strong> will be updated. Existing data will not be overwritten.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 bg-white sticky bottom-0 z-1 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 px-4 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            Cancel
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-[2] py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#4318FF] to-[#868CFF] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:to-[#4318FF] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Rocket size={18} className="animate-pulse" />
                <span>Confirm & Update</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoUpdateModal;
