import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type = 'info', onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: <CheckCircle size={20} className="text-green-500" />,
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: <AlertCircle size={20} className="text-red-500" />,
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: <Info size={20} className="text-blue-500" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-2 fade-in duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border ${styles.bg} ${styles.border} min-w-[300px] max-w-[500px]`}
      >
        {styles.icon}
        <p className={`flex-1 text-sm font-semibold ${styles.text}`}>{message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded-lg transition-colors"
        >
          <X size={16} className={styles.text} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
