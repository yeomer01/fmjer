import React from 'react';
import { ArrowDown } from 'lucide-react';

export function StatCard({ title, value, icon: Icon, colorClass, subText, borderColor, highlightText, onHighlightClick, variant = 'clean', progressValue }) {
  if (variant === 'clean') {
    return (
      <div className={`bg-[#FDFBF7] p-4 border border-stone-200 shadow-sm relative group transition-all duration-200 ${borderColor} border-t-4 hover:shadow-md h-full flex flex-col justify-between rounded-sm`}>
        <div className="flex justify-between items-start mb-2"><div className="min-w-0"><p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider mb-1">{title}</p><h3 className="text-xl font-black text-stone-800 leading-none tracking-tight">{value}</h3></div><div className={`p-2 ${colorClass} bg-opacity-10 rounded-sm`}><Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} /></div></div>
        {subText && (
          <div className="mt-2 pt-2 border-t border-stone-200 flex justify-between items-center"><div className="text-[10px] font-medium text-stone-400 leading-snug w-full">{subText}</div>
              {highlightText && (<button onClick={(e) => { if (onHighlightClick) { e.stopPropagation(); onHighlightClick(); } }} className={`text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm border border-rose-100 flex items-center gap-1 transition-all flex-shrink-0 ml-2 ${onHighlightClick ? 'hover:bg-rose-600 hover:text-white hover:shadow-md cursor-pointer active:scale-95' : ''}`}>{highlightText}{onHighlightClick && <ArrowDown size={10} />}</button>)}
          </div>
        )}
      </div>
    );
  }
  return (
      <div className={`bg-white p-4 border border-slate-200 shadow-sm relative group transition-all duration-200 hover:border-slate-300 h-full flex flex-col justify-between rounded-sm`}>
        <div className="flex justify-between items-start mb-2"><div className="min-w-0"><p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">{title}</p><h3 className="text-xl font-black text-slate-800 leading-none tracking-tight">{value}</h3></div><div className={`p-2 bg-slate-50 rounded-sm`}><Icon className={`w-5 h-5 text-slate-600`} /></div></div>
      </div>
  );
}
