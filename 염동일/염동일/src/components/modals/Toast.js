import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  if (!message) return null;
  const bgClass = type === 'error' ? 'bg-rose-600' : 'bg-stone-800';
  return (
    <div className={`fixed bottom-0 right-0 m-6 ${bgClass} text-white px-6 py-4 shadow-2xl z-[100] flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 font-medium border-l-4 border-white/30 rounded-none`}>
      {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
      <span className="text-sm text-center">{String(message)}</span>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100 transition-opacity"><X size={18} /></button>
    </div>
  );
}
