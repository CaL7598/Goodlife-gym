import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          icon: <CheckCircle className="text-white" size={20} />,
          text: 'text-emerald-800',
          iconBg: 'bg-emerald-600'
        };
      case 'error':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          icon: <XCircle className="text-rose-600" size={20} />,
          text: 'text-rose-800',
          iconBg: 'bg-rose-100'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: <AlertCircle className="text-amber-600" size={20} />,
          text: 'text-amber-800',
          iconBg: 'bg-amber-100'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: <Info className="text-blue-600" size={20} />,
          text: 'text-blue-800',
          iconBg: 'bg-blue-100'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[320px] max-w-md animate-in slide-in-from-right fade-in duration-300`}
    >
      <div className={`${styles.iconBg} rounded-full p-1.5 flex-shrink-0`}>
        {styles.icon}
      </div>
      <p className={`${styles.text} text-sm font-medium flex-1`}>
        {toast.message}
      </p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 w-6 h-6 rounded-full border border-blue-300 hover:border-blue-400 flex items-center justify-center transition-colors group"
        aria-label="Close notification"
      >
        <X className="text-slate-600 group-hover:text-slate-800" size={14} />
      </button>
    </div>
  );
};

export default ToastComponent;

