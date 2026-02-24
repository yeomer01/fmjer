import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Calculator } from 'lucide-react';
import { FactoryCard } from '../cards/FactoryCard';
import { formatCurrency } from '../../utils/formatters';

export const BottomDeductionSection = forwardRef(({ groupedData, defaultOpen, selectedRowIds, toggleRowSelection }, ref) => {
  const [isMainOpen, setIsMainOpen] = useState(defaultOpen || false);
  const containerRef = useRef(null);
  useEffect(() => { if(defaultOpen) setIsMainOpen(true); }, [defaultOpen]);
  const totalVendors = Object.keys(groupedData).length;
  const totalAmount = Object.values(groupedData).flat().reduce((sum, item) => sum + (Number(item.cost || 0) * Number(item.quantity || 0)), 0);
  useImperativeHandle(ref, () => ({ open: () => setIsMainOpen(true), scrollIntoView: () => { if (containerRef.current) { containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } } }));
  return (
    <div ref={containerRef} className="space-y-4">
      <div className="bg-white border border-stone-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-stone-700 to-stone-800 text-white flex justify-between items-center">
           <div><h3 className="text-lg font-bold flex items-center gap-2"><Calculator size={20} className="text-stone-300"/> 공장별 차감 완료 통계</h3><p className="text-xs text-stone-300 mt-1 opacity-80">차감 처리가 완료된 건들을 공장별로 집계합니다.</p></div>
           <div className="text-right"><div className="text-2xl font-black tracking-tight">{formatCurrency(totalAmount)}</div><div className="text-xs text-stone-400 font-medium">총 {totalVendors}개 업체 합계</div></div>
        </div>
        <div className="p-6 bg-stone-50 min-h-[300px] max-h-[600px] overflow-y-auto">
          {totalVendors === 0 ? (<div className="text-center py-12 text-stone-400 border border-dashed border-stone-300 rounded-lg">차감 완료된 내역이 없습니다.</div>) : (
            <div className="space-y-3">{Object.entries(groupedData).map(([vendor, items]) => (<FactoryCard key={vendor} vendor={vendor} items={items} selectedRowIds={selectedRowIds} toggleRowSelection={toggleRowSelection} />))}</div>
          )}
        </div>
      </div>
    </div>
  );
});
