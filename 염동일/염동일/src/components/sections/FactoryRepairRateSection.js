import React, { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Percent } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const FactoryRepairRateSection = forwardRef(({ data, defaultOpen }, ref) => {
  const [isOpen, setIsOpen] = useState(defaultOpen || false);
  const containerRef = useRef(null);
  useEffect(() => { if(defaultOpen) setIsOpen(true); }, [defaultOpen]);
  useImperativeHandle(ref, () => ({ open: () => setIsOpen(true), scrollIntoView: () => { if (containerRef.current) { containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } } }));
  const stats = useMemo(() => {
    const factoryMap = {};
    data.forEach(item => {
      const vendor = item.vendor || '미지정';
      if (!factoryMap[vendor]) factoryMap[vendor] = { total: 0, completed: 0, deductedAmount: 0 };
      factoryMap[vendor].total += 1;
      const isCompleted = (item.repairDate && item.repairDate.trim() !== '') || (item.note && typeof item.note === 'string' && item.note.includes('수선완료'));
      if (isCompleted) factoryMap[vendor].completed += 1;
      const hasDeductionDate = item.deductionDate && item.deductionDate.trim() !== '' && item.deductionDate !== 'X';
      const note = String(item.note || '');
      const defect = String(item.defectContent || '');
      const combined = (note + defect).trim();
      const hasDeductionText = combined.includes('차감') && !combined.includes('미차감');
      if (hasDeductionDate || hasDeductionText) { const cost = Number(item.cost || 0); const qty = Number(item.quantity || 0); factoryMap[vendor].deductedAmount += (cost * qty); }
    });
    return Object.entries(factoryMap).map(([vendor, stat]) => ({ vendor, total: stat.total, completed: stat.completed, deductedAmount: stat.deductedAmount, rate: stat.total === 0 ? 0 : Math.round((stat.completed / stat.total) * 100) })).sort((a, b) => b.total - a.total);
  }, [data]);

  return (
    <div ref={containerRef} className="space-y-4">
       <div className="bg-white px-6 py-5 rounded-xl border border-stone-200 shadow-sm flex justify-between items-center"><h3 className="text-lg font-bold text-stone-800 flex items-center gap-2"><Percent size={20} className="text-emerald-500" /> 공장별 수선 진행률</h3><span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-md">총 {stats.length}개 공장</span></div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
         {stats.map((stat) => (
           <div key={stat.vendor} className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col justify-between group">
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-3"><div><h4 className="font-bold text-stone-900 text-sm mb-1 truncate max-w-[140px]" title={stat.vendor}>{stat.vendor}</h4><div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-400"><span>{stat.total}건 접수</span><span className="w-1 h-1 rounded-full bg-stone-300"></span><span className="text-stone-600">{stat.completed}건 완료</span></div></div><div className={`flex items-center justify-center w-10 h-10 rounded-full font-black text-xs ${stat.rate === 100 ? 'bg-emerald-100 text-emerald-600' : stat.rate >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>{stat.rate}%</div></div>
               <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mb-3"><div className={`h-full transition-all duration-1000 ease-out rounded-full ${stat.rate === 100 ? 'bg-emerald-500' : stat.rate >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${stat.rate}%` }}></div></div>
               <div className="pt-3 border-t border-stone-50 flex justify-between items-center"><span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">차감 합계</span><span className="text-xs font-black font-mono text-stone-700 group-hover:text-blue-600 transition-colors">{formatCurrency(stat.deductedAmount)}</span></div>
             </div>
           </div>
         ))}
         {stats.length === 0 && (<div className="col-span-full text-center py-12 text-stone-400 border border-dashed border-stone-300 rounded-xl">수선 데이터가 없습니다.</div>)}
       </div>
    </div>
  )
});
