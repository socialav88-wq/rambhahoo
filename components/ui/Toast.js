'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: 'border-accent-green text-accent-green',
  error: 'border-accent-red text-accent-red',
  info: 'border-blue-primary text-blue-primary',
};

function ToastItem({ toast }) {
  const removeToast = useUIStore((s) => s.removeToast);
  const Icon = ICONS[toast.type] || Info;
  
  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);
  
  return (
    <div className={`flex items-center gap-3 p-3 bg-white border border-border border-l-4 ${COLORS[toast.type] || COLORS.info} rounded-lg shadow-lg animate-slide-up`}>
      <Icon size={18} />
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button onClick={() => removeToast(toast.id)} className="text-text-muted hover:text-text-primary transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed bottom-20 right-4 z-[60] flex flex-col gap-2 w-80 md:bottom-6">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
