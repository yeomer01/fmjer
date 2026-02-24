import React from 'react';
import { ArrowRight } from 'lucide-react';

export function ActionCard({ title, value, icon: Icon, bgClass, onClick }) {
  return (
    <button onClick={onClick} className={`w-full h-full p-5 shadow-sm border border-stone-200 rounded-xl flex flex-col justify-between items-start text-left group transition-all duration-300 hover:border-stone-300 hover:shadow-md active:scale-[0.99] ${bgClass}`}>
      <div className="flex justify-between items-start w-full mb-3"><div><p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 text-stone-500`}>{title}</p><div className={`text-xl font-black leading-tight tracking-tight text-stone-900`}>{value}</div></div><div className={`p-2 rounded-lg bg-stone-50 text-stone-500`}><Icon className="w-5 h-5" /></div></div>
      <div className={`w-full mt-2 pt-2 border-t border-stone-50 flex items-center justify-between group-hover:pl-1 transition-all duration-300`}><span className={`text-[10px] font-bold text-stone-400 group-hover:text-stone-600`}>상세 내역 보기</span><ArrowRight size={12} className={`text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-transform`} /></div>
    </button>
  );
}
