import React, { useState, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Search, Send } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const DeductionRequestSection = forwardRef(({ items, selectedRowIds, toggleRowSelection, toggleAllRows, onProcess, onCancelRequest }, ref) => {
  const [localSearch, setLocalSearch] = useState('');
  const containerRef = useRef(null);
  useImperativeHandle(ref, () => ({ scrollIntoView: () => { if (containerRef.current) { containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } } }));
  const handleManagerUpdate = async (item, newManager) => {
    try { const auth = getAuth(); const user = auth.currentUser; if (!user) return; const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'defects', item.id); await updateDoc(docRef, { manager: newManager }); } catch (error) { console.error("Error updating manager:", error); }
  };
  const filteredItems = useMemo(() => {
    let result = [...items]; result.sort((a, b) => new Date(a.checkDate) - new Date(b.checkDate));
    if (localSearch) { const lowerQuery = localSearch.toLowerCase(); result = result.filter(item => (item.vendor && String(item.vendor).toLowerCase().includes(lowerQuery)) || (item.productName && String(item.productName).toLowerCase().includes(lowerQuery)) || (item.defectContent && String(item.defectContent).toLowerCase().includes(lowerQuery))); }
    return result;
  }, [items, localSearch]);
  const totalAmount = useMemo(() => { return filteredItems.reduce((acc, item) => acc + (Number(item.cost || 0) * Number(item.quantity || 0)), 0); }, [filteredItems]);

  return (
    <div ref={containerRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-2xl p-6 text-white shadow-lg flex justify-between items-end">
            <div><h3 className="text-xl font-black flex items-center gap-2"><Send size={24} /> 차감 요청 내역</h3><p className="text-sm text-white/80 mt-1 font-medium">차감 처리를 요청받은 항목들입니다. 차감 확정 후 '처리 완료' 탭으로 이동됩니다.</p></div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30 text-right"><div className="text-2xl font-black">{items.length}건</div><div className="text-[10px] opacity-80 font-bold uppercase tracking-wide">요청 대기중</div></div>
        </div>
        <div className="bg-white border-x border-b border-stone-200 rounded-b-2xl shadow-sm overflow-hidden">
           <div className="px-6 py-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
             <div className="flex gap-2 items-center"><span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">처리 대기</span></div>
             <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" /><input type="text" placeholder="요청 내역 검색..." className="block w-full pl-9 pr-3 py-1.5 border border-stone-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-stone-800" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} /></div>
           </div>
           <div className="overflow-x-auto max-h-[600px] custom-scrollbar bg-white">
            <table className="w-full text-xs text-center">
              <thead className="bg-white text-stone-500 font-bold border-b border-stone-200 sticky top-0 z-10 shadow-sm">
                <tr><th className="w-8 text-center px-5 py-3 bg-white"><input type="checkbox" checked={filteredItems.length > 0 && filteredItems.every(item => selectedRowIds.has(item.id))} onChange={() => toggleAllRows && toggleAllRows(filteredItems)} className="rounded-sm border-stone-300 text-purple-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer" /></th><th className="px-5 py-3 w-28 text-center">불량확인일</th><th className="px-5 py-3 w-32">업체명</th><th className="px-5 py-3">상품명</th><th className="px-5 py-3 w-20">색상</th><th className="px-5 py-3 w-16 text-center">사이즈</th><th className="px-5 py-3 text-right">금액</th><th className="px-5 py-3 w-16 text-center">수량</th><th className="px-5 py-3">불량내용</th><th className="px-5 py-3 text-center w-24">처리자</th><th className="px-5 py-3 text-center w-36">관리</th></tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.length === 0 ? (<tr><td colSpan="11" className="px-5 py-12 text-center text-stone-400 font-medium">{localSearch ? '검색 결과가 없습니다.' : '현재 차감 요청된 항목이 없습니다.'}</td></tr>) : (
                  filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-purple-50/20 transition-colors group">
                        <td className="px-5 py-3 text-center"><input type="checkbox" checked={selectedRowIds.has(item.id)} onChange={() => toggleRowSelection(item.id)} className="rounded-sm border-stone-300 text-purple-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer" /></td>
                        <td className="px-5 py-3 text-stone-600 font-mono font-medium text-center">{formatDate(item.checkDate)}</td>
                        <td className="px-5 py-3 font-bold text-stone-800">{String(item.vendor || '')}</td>
                        <td className="px-5 py-3 text-stone-700">{String(item.productName || '')}</td>
                        <td className="px-5 py-3 text-stone-600">{String(item.color || '')}</td>
                        <td className="px-5 py-3 text-stone-600 text-center">{String(item.size || '')}</td>
                        <td className="px-5 py-3 text-right text-stone-600 font-mono">{formatCurrency(Number(item.cost || 0) * Number(item.quantity || 1))}</td>
                        <td className="px-5 py-3 text-center font-bold text-stone-800">{item.quantity}</td>
                        <td className="px-5 py-3 text-stone-500 truncate max-w-[200px]" title={String(item.defectContent || '')}>
                            {String(item.defectContent || '')}
                            {item.isReverted && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-200">↩️ 되돌림</span>}
                        </td>
                        <td className="px-5 py-3 text-center"><input type="text" key={`${item.id}-${item.manager}`} defaultValue={item.manager || ''} onBlur={(e) => handleManagerUpdate(item, e.target.value)} placeholder="-" className="w-full text-center bg-transparent border-b border-transparent hover:border-stone-300 focus:border-purple-500 focus:outline-none text-xs p-1 transition-colors" /></td>
                        <td className="px-5 py-3 text-center flex gap-2 justify-center"><button onClick={() => onProcess(item)} className="px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-700 rounded-md text-[11px] font-bold transition-all shadow-sm">차감 확정</button><button onClick={() => onCancelRequest(item)} className="px-3 py-1.5 bg-white text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-300 rounded-md text-[11px] font-bold transition-all">취소</button></td>
                      </tr>
                    ))
                )}
              </tbody>
              {filteredItems.length > 0 && (<tfoot className="bg-stone-50 border-t border-stone-200 font-bold sticky bottom-0 z-20"><tr><td colSpan="6" className="px-5 py-3 text-right text-stone-500 text-[11px] uppercase tracking-wider">Total Requested Amount:</td><td className="px-5 py-3 text-right text-purple-700 font-mono text-sm bg-purple-50/50">{formatCurrency(totalAmount)}</td><td colSpan="4"></td></tr></tfoot>)}
            </table>
           </div>
        </div>
    </div>
  )
});
