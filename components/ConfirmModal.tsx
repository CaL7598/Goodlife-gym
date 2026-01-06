import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Confirmation',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          confirmBg: 'bg-blue-400 hover:bg-blue-500 border border-blue-500',
          confirmText: 'text-white',
          cancelBg: 'bg-blue-700 hover:bg-blue-800 border border-blue-800',
          cancelText: 'text-white'
        };
      case 'danger':
        return {
          iconBg: 'bg-rose-100',
          iconColor: 'text-rose-600',
          confirmBg: 'bg-rose-600 hover:bg-rose-700',
          confirmText: 'text-white',
          cancelBg: 'bg-slate-200 hover:bg-slate-300',
          cancelText: 'text-slate-700'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmBg: 'bg-blue-500 hover:bg-blue-600',
          confirmText: 'text-white',
          cancelBg: 'bg-slate-200 hover:bg-slate-300',
          cancelText: 'text-slate-700'
        };
    }
  };

  const styles = getTypeStyles();

  // Parse message to handle line breaks and bullet points
  const formatMessage = (msg: string) => {
    const lines = msg.split('\n');
    return lines.map((line, index) => {
      if (line.trim().startsWith('•')) {
        return (
          <div key={index} className="ml-4 mt-1">
            {line}
          </div>
        );
      }
      return <div key={index} className={index > 0 ? 'mt-2' : ''}>{line}</div>;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 rounded-t-lg flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`${styles.iconBg} rounded-full p-2 flex-shrink-0`}>
              <AlertTriangle className={styles.iconColor} size={24} />
            </div>
            <div className="flex-1 text-slate-700 text-sm leading-relaxed">
              {formatMessage(message)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onConfirm}
            className={`${styles.confirmBg} ${styles.confirmText} px-6 py-2 rounded font-medium transition-colors`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className={`${styles.cancelBg} ${styles.cancelText} px-6 py-2 rounded font-medium transition-colors`}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

