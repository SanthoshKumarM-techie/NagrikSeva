import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // warning | danger | info | success
  loading = false,
  size = 'sm',
  children
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
      case 'warning':
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getButtonVariant = () => {
    if (type === 'danger') return 'danger';
    if (type === 'success') return 'success';
    return 'primary';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={getButtonVariant()} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {title}
          </h4>
          {message && (
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {message}
            </p>
          )}
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
