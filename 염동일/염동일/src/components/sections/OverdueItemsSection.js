import React, { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Search, AlertOctagon } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const OverdueItemsSection = forwardRef(({ items, defaultOpen, onEdit, selectedRowIds, toggleRowSelection, toggleAllRows, onRequestDeduction }, ref) => {
  const [isOpen, setIsOpen] = useState(defaultOpen || false);
  const [localSearch, setLocalSearch] = useState('');
  const containerRef = useRef(null);
  useEffect(() => { if(defaultOpen) setIsOpen(true); }, [defaultOpen]);
  useImperativeHandle(ref, () => ({ open: () => setIsOpen(true), scrollIntoView: () => { if (containerRef.current) { containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } } }));
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items]; result.sort((a, b) => new Date(a.checkDate) - new Date(b.checkDate));
    if (localSearch) { const lowerQuery = localSearch.toLowerCase(); result = result.filter(item => (item.vendor && String(item.vendor).toLowerCase().includes(lowerQuery)) || (item.productName && String(item.productName).toLowerCase().includes(lowerQuery)) || (item.defectContent && String(item.defectContent).toLowerCase().includes(lowerQuery))); }
    return result;
  }, [items, localSearch]);
  const totalOverdueAmount = useMemo(() => { return filteredAndSortedItems.reduce((acc, item) => acc + (Number(item.cost || 0) * Number(item.quantity || 0)), 0); }, [filteredAndSortedItems]);

  return (
    <div ref={containerRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-t-2xl p-6 text-white shadow-lg flex justify-between items-end">
            <div><h3 className="text-xl font-black flex items-center gap-2"><AlertOctagon size={24} /> 장기 미처리 내역</h3><p className="text-sm text-white/80 mt-1 font-medium">30일 이상 경과된 건들입니다. 신속한 처리가 필요합니다.</p></div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30 text-right"><div className="text-2xl font-black">{items.length}건</div><div className="text-[10px] opacity-80 font-bold uppercase tracking-wide">지연 발생</div></div>
        </div>
        <div className="bg-white border-x border-b border-stone-200 rounded-b-2xl shadow-sm overflow-hidden">
           <div className="px-6 py-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
             <div className="flex gap-2"><span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">우선순위 높음</span></div>
             <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" /><input type="text" placeholder="지연 내역 검색..." className="block w-full pl-9 pr-3 py-1.5 border border-stone-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-stone-800" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} /></div>
           </div>
           <div className="overflow-x-auto max-h-[600px] custom-scrollbar bg-white">
            <table className="w-full text-xs text-center">
              <thead className="bg-white text-stone-500 font-bold border-b border-stone-200 sticky top-0 z-10 shadow-sm">
                <tr><th className="w-8 text-center px-5 py-3 bg-white"><input type="checkbox" checked={filteredAndSortedItems.length > 0 && filteredAndSortedItems.every(item => selectedRowIds.has(item.id))} onChange={() => toggleAllRows && toggleAllRows(filteredAndSortedItems)} className="rounded-sm border-stone-300 text-amber-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer" /></th><th className="px-5 py-3 w-28 text-center">불량확인일</th><th className="px-5 py-3 w-32">업체명</th><th className="px-5 py-3">상품명</th><th className="px-5 py-3 w-20">색상</th><th className="px-5 py-3 w-16 text-center">사이즈</th><th className="px-5 py-3 text-right">제품원가</th><th className="px-5 py-3 w-16 text-center">수량</th><th className="px-5 py-3">불량내용</th><th className="px-5 py-3 text-center w-24">지연일수</th><th className="px-5 py-3 text-center w-28">관리</th></tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredAndSortedItems.length === 0 ? (<tr><td colSpan="11" className="px-5 py-12 text-center text-stone-400 font-medium">{localSearch ? '검색 결과가 없습니다.' : '현재 지연된 항목이 없습니다.'}</td></tr>) : (
                  filteredAndSortedItems.map(item => {
                    const check = new Date(item.checkDate); const today = new Date(); const diffTime = Math.abs(today.getTime() - check.getTime()); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={item.id} className="hover:bg-amber-50/20 transition-colors group">
                        <td className="px-5 py-3 text-center"><input type="checkbox" checked={selectedRowIds.has(item.id)} onChange={() => toggleRowSelection(item.id)} className="rounded-sm border-stone-300 text-amber-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer" /></td>
                        <td className="px-5 py-3 text-stone-600 font-mono font-medium text-center">{formatDate(item.checkDate)}</td>
                        <td className="px-5 py-3 font-bold text-stone-800">{String(item.vendor || '')}</td>
                        <td className="px-5 py-3 text-stone-700">{String(item.productName || '')}</td>
                        <td className="px-5 py-3 text-stone-600">{String(item.color || '')}</td>
                        <td className="px-5 py-3 text-stone-600 text-center">{String(item.size || '')}</td>
                        <td className="px-5 py-3 text-right text-stone-600 font-mono">{formatCurrency(Number(item.cost || 0) * Number(item.quantity || 1))}</td>
                        <td className="px-5 py-3 text-center font-bold text-stone-800">{item.quantity}</td>
                        <td className="px-5 py-3 text-stone-500 truncate max-w-[200px]" title={String(item.defectContent || '')}>{String(item.defectContent || '')}</td>
                        <td className="px-5 py-3 text-center"><span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-bold border border-red-100 shadow-sm text-[11px]">+{diffDays}일</span></td>
                        <td className="px-5 py-3 text-center grid gap-1"><button onClick={() => onRequestDeduction(item)} className="w-full px-2 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-bold transition-all shadow-sm">차감요청</button><button onClick={() => onEdit(item)} className="w-full px-2 py-1.5 bg-white text-stone-600 hover:text-blue-600 hover:border-blue-300 border border-stone-200 rounded-md text-[11px] font-bold transition-all shadow-sm">처리하기</button></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredAndSortedItems.length > 0 && (<tfoot className="bg-stone-50 border-t border-stone-200 font-bold sticky bottom-0 z-20"><tr><td colSpan="6" className="px-5 py-3 text-right text-stone-500 text-[11px] uppercase tracking-wider">Total Delayed Amount:</td><td className="px-5 py-3 text-right text-amber-700 font-mono text-sm bg-amber-50/50">{formatCurrency(totalOverdueAmount)}</td><td colSpan="4"></td></tr></tfoot>)}
            </table>
           </div>
        </div>
    </div>
  )
});
