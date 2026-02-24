import React, { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Search, CheckCircle2, Wrench, DollarSign, RotateCcw, CreditCard } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { ResizableHeader } from '../table/ResizableHeader';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const SplitProcessedSection = forwardRef(({ repairItems, deductionItems, deductionRepairItems, repaymentItems, defaultOpen, selectedRowIds, toggleRowSelection, toggleAllRows, onRevert, onRepayment, onRepairAfterDeduction }, ref) => {
  const [isOpen, setIsOpen] = useState(defaultOpen || false);
  const [localSearch, setLocalSearch] = useState('');
  const [activeTab, setActiveTab] = useState('repair');
  const [columnWidths, setColumnWidths] = useState({ date: 100, vendor: 120, productName: 150, color: 80, size: 60, quantity: 60, cost: 100, defectContent: 200, note: 120, manager: 80 });
  const containerRef = useRef(null);
  useEffect(() => { if(defaultOpen) setIsOpen(true); }, [defaultOpen]);

  // Expose activeTab via ref for parent to access
  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    scrollIntoView: () => { if (containerRef.current) { containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } },
    activeTab: activeTab // Expose active tab state
  }));

  // Notify parent of tab changes
  useEffect(() => {
    if (ref && typeof ref === 'function') {
        ref({ activeTab });
    } else if (ref && ref.current) {
        ref.current.activeTab = activeTab;
    }
    // Dispatch custom event for parent to listen
    const event = new CustomEvent('subTabChange', { detail: activeTab });
    window.dispatchEvent(event);
  }, [activeTab, ref]);

  const handleResizeStart = (e, key) => {
    e.preventDefault(); const startX = e.clientX; const startWidth = columnWidths[key] || 100;
    const onMouseMove = (moveEvent) => { const currentWidth = startWidth + (moveEvent.clientX - startX); setColumnWidths(prev => ({ ...prev, [key]: Math.max(40, currentWidth) })); };
    const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
  };
  const totalDeductionAmount = useMemo(() => { return deductionItems.reduce((sum, item) => {
      if (item.isRepaid) return sum;
      return sum + (Number(item.cost || 0) * Number(item.quantity || 0));
  }, 0); }, [deductionItems]);
  const totalRepaymentAmount = useMemo(() => { return repaymentItems ? repaymentItems.reduce((sum, item) => sum + (Number(item.cost || 0) * Number(item.quantity || 0)), 0) : 0; }, [repaymentItems]);

  const handleManagerUpdate = async (item, newManager) => { try { const auth = getAuth(); const user = auth.currentUser; if (!user) return; const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'defects', item.id); await updateDoc(docRef, { manager: newManager }); } catch (error) { console.error("Error updating manager:", error); } };

  const filterAndSort = (items) => {
    let result = [...items];
    result.sort((a, b) => {
        const dateA = a.repairDate || a.deductionDate || a.checkDate || '';
        const dateB = b.repairDate || b.deductionDate || b.checkDate || '';
        return dateA.localeCompare(dateB);
    });
    if (localSearch) {
        const lowerQuery = localSearch.toLowerCase();
        result = result.filter(item => (item.vendor && String(item.vendor).toLowerCase().includes(lowerQuery)) || (item.productName && String(item.productName).toLowerCase().includes(lowerQuery)) || (item.defectContent && String(item.defectContent).toLowerCase().includes(lowerQuery)) || (item.note && String(item.note).toLowerCase().includes(lowerQuery)) || (item.manager && String(item.manager).toLowerCase().includes(lowerQuery)));
    }
    return result;
  };

  const filteredRepairs = useMemo(() => filterAndSort(repairItems), [repairItems, localSearch]);
  const filteredDeductions = useMemo(() => filterAndSort(deductionItems), [deductionItems, localSearch]);
  const filteredRepayments = useMemo(() => filterAndSort(repaymentItems || []), [repaymentItems, localSearch]);

  const renderTable = (items, type) => (
    <div className="flex-1 overflow-auto custom-scrollbar p-0">
        <table className="w-full text-xs text-center relative border-collapse table-fixed">
            <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 sticky top-0 z-10 whitespace-nowrap">
                <tr>
                    <th className="w-8 text-center px-2 py-3 bg-stone-50" style={{ width: '40px' }}><input type="checkbox" checked={items.length > 0 && items.every(item => selectedRowIds.has(item.id))} onChange={() => toggleAllRows && toggleAllRows(items)} className="rounded-sm border-stone-300 text-stone-800 focus:ring-0 w-3.5 h-3.5 cursor-pointer" /></th>
                    <ResizableHeader label={type === 'repair' ? "수선일" : "차감일"} width={columnWidths.date} columnKey="date" onResize={handleResizeStart} />
                    <ResizableHeader label="업체명" width={columnWidths.vendor} columnKey="vendor" onResize={handleResizeStart} />
                    <ResizableHeader label="상품명" width={columnWidths.productName} columnKey="productName" onResize={handleResizeStart} />
                    <ResizableHeader label="색상" width={columnWidths.color} columnKey="color" onResize={handleResizeStart} />
                    <ResizableHeader label="사이즈" width={columnWidths.size} columnKey="size" onResize={handleResizeStart} align="center" />
                    <ResizableHeader label="수량" width={columnWidths.quantity} columnKey="quantity" onResize={handleResizeStart} align="center" />
                    <ResizableHeader label="원가" width={columnWidths.cost} columnKey="cost" onResize={handleResizeStart} align="right" />
                    <ResizableHeader label="불량내용" width={columnWidths.defectContent} columnKey="defectContent" onResize={handleResizeStart} />
                    <ResizableHeader label="비고" width={columnWidths.note} columnKey="note" onResize={handleResizeStart} />
                    <ResizableHeader label="담당자" width={columnWidths.manager} columnKey="manager" onResize={handleResizeStart} align="center" />
                    {/* 차감완료 탭과 재결제 탭에서만 관리 컬럼 표시 */}
                    {(type === 'deduction' || type === 'repayment') && <th className="px-5 py-3 text-center w-28 font-bold text-stone-500 uppercase tracking-wider">관리</th>}
                </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
                {items.length === 0 ? (<tr><td colSpan="12" className="p-12 text-center text-stone-400">내역이 없습니다.</td></tr>) : (
                    items.map(item => (
                        <tr key={item.id} className={`hover:bg-stone-50 transition-colors group ${item.isRepaid ? 'bg-green-50/30' : ''}`}>
                            <td className="px-2 py-2 text-center border-r border-stone-50 whitespace-nowrap overflow-hidden"><input type="checkbox" checked={selectedRowIds.has(item.id)} onChange={() => toggleRowSelection(item.id)} className="rounded-sm border-stone-300 text-stone-800 focus:ring-0 w-3.5 h-3.5 cursor-pointer" /></td>
                            <td className="px-1.5 py-1.5 font-mono text-stone-500 whitespace-nowrap overflow-hidden text-ellipsis text-center">{formatDate(type === 'repair' ? (item.repairDate || item.checkDate) : item.deductionDate)}</td>
                            <td className="px-1.5 py-1.5 font-bold text-stone-800 overflow-hidden text-ellipsis whitespace-nowrap text-center" title={item.vendor}>{item.vendor}</td>
                            <td className="px-1.5 py-1.5 text-stone-600 overflow-hidden text-ellipsis whitespace-nowrap text-center" title={item.productName}>{item.productName}</td>
                            <td className="px-1.5 py-1.5 text-stone-500 overflow-hidden text-ellipsis whitespace-nowrap text-center" title={item.color}>{item.color}</td>
                            <td className="px-1.5 py-1.5 text-center text-stone-500 overflow-hidden text-ellipsis whitespace-nowrap text-center">{item.size}</td>
                            <td className="px-1.5 py-1.5 text-center font-bold text-stone-800 overflow-hidden text-ellipsis whitespace-nowrap text-center">{item.quantity}</td>
                            <td className={`px-1.5 py-1.5 text-right font-mono overflow-hidden text-ellipsis whitespace-nowrap text-center ${item.isRepaid ? 'line-through text-stone-400' : 'text-stone-600'}`}>{formatCurrency(Number(item.cost || 0) * Number(item.quantity || 1))}</td>
                            <td className="px-1.5 py-1.5 text-stone-500 overflow-hidden text-ellipsis whitespace-nowrap text-center" title={item.defectContent}>{item.defectContent}</td>
                            <td className={`px-1.5 py-1.5 overflow-hidden text-ellipsis whitespace-nowrap text-center ${String(item.note || '').includes('차감') ? 'text-rose-600 font-bold' : 'text-stone-400'}`} title={item.note}>{item.note}</td>
                            <td className="px-1.5 py-1.5 text-center overflow-hidden"><input type="text" key={`${item.id}-${item.manager}`} defaultValue={item.manager || ''} onBlur={(e) => handleManagerUpdate(item, e.target.value)} placeholder="-" className="w-full text-center bg-transparent border-none focus:ring-0 text-xs p-0" /></td>
                            {(type === 'deduction' || type === 'repayment') && (
                                <td className="px-5 py-2 text-center flex gap-1 justify-center">
                                    <button
                                        onClick={() => onRevert && onRevert(item)}
                                        className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                                        title={type === 'repayment' ? "차감 완료 상태로 되돌리기" : "차감 취소 (요청 상태로 되돌리기)"}
                                    >
                                        <RotateCcw size={14} />
                                    </button>
                                    {!item.isRepaid && (
                                        <button
                                        onClick={() => onRepayment && onRepayment(item)}
                                        className="p-1.5 text-stone-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                        title="재결제 (환불) 처리 - 차감 후 재결제로 이동"
                                        >
                                            <CreditCard size={14} />
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
  );

  return (
    <div ref={containerRef} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-2">
          <div><h3 className="text-xl font-black text-stone-800 tracking-tight flex items-center gap-2"><CheckCircle2 className="text-stone-600" size={24} /> 처리 완료 내역</h3><p className="text-sm text-stone-500 mt-1 font-medium">수선 및 비용 차감이 완료된 건들을 확인하고 관리합니다.</p></div>
          <div className="relative w-full md:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" /><input type="text" placeholder="내역 검색 (업체, 상품, 담당자)" className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all shadow-sm text-stone-800" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} /></div>
       </div>
       <div className="bg-stone-100 p-1.5 rounded-xl inline-flex items-center gap-1 border border-stone-200 shadow-inner">
          <button onClick={() => { setActiveTab('repair'); window.dispatchEvent(new CustomEvent('subTabChange', { detail: 'repair' })); }} className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ease-out ${activeTab === 'repair' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'}`}><Wrench size={16} className={activeTab === 'repair' ? 'text-blue-600' : 'text-stone-400'} strokeWidth={2.5} /><span>수선 완료</span><span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-all ${activeTab === 'repair' ? 'bg-blue-100 text-blue-600' : 'bg-stone-200 text-stone-400'}`}>{filteredRepairs.length}</span></button>
          <button onClick={() => { setActiveTab('deduction'); window.dispatchEvent(new CustomEvent('subTabChange', { detail: 'deduction' })); }} className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ease-out ${activeTab === 'deduction' ? 'bg-white text-purple-700 shadow-sm ring-1 ring-black/5' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'}`}><DollarSign size={16} className={activeTab === 'deduction' ? 'text-purple-600' : 'text-stone-400'} strokeWidth={2.5} /><span>차감 완료</span><span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-all ${activeTab === 'deduction' ? 'bg-purple-100 text-purple-600' : 'bg-stone-200 text-stone-400'}`}>{filteredDeductions.length}</span></button>
          <button onClick={() => { setActiveTab('repayment'); window.dispatchEvent(new CustomEvent('subTabChange', { detail: 'repayment' })); }} className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ease-out ${activeTab === 'repayment' ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'}`}><CreditCard size={16} className={activeTab === 'repayment' ? 'text-green-600' : 'text-stone-400'} strokeWidth={2.5} /><span>차감 후 재결제</span><span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-all ${activeTab === 'repayment' ? 'bg-green-100 text-green-600' : 'bg-stone-200 text-stone-400'}`}>{filteredRepayments.length}</span></button>
       </div>
       <div className="h-[600px] bg-white border border-stone-200 rounded-2xl shadow-lg overflow-hidden relative">
          {activeTab === 'repair' ? (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-400 to-stone-600"></div>
               <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/30"><div className="flex items-center gap-2"><div className="bg-stone-100 p-1.5 rounded-lg text-stone-600"><Wrench size={16} /></div><h4 className="font-bold text-stone-800 text-sm">수선 완료 목록</h4></div></div>
               {renderTable(filteredRepairs, 'repair')}
            </div>
          ) : activeTab === 'deduction' ? (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-500 to-stone-700"></div>
               <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/30"><div className="flex items-center gap-2"><div className="bg-stone-100 p-1.5 rounded-lg text-stone-600"><DollarSign size={16} /></div><h4 className="font-bold text-stone-800 text-sm">차감 완료 목록</h4></div><div className="flex items-center gap-2"><span className="text-xl font-black text-stone-800">총 {formatCurrency(totalDeductionAmount)}</span></div></div>
               {renderTable(filteredDeductions, 'deduction')}
            </div>
          ) : (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
               <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/30"><div className="flex items-center gap-2"><div className="bg-stone-100 p-1.5 rounded-lg text-stone-600"><CreditCard size={16} /></div><h4 className="font-bold text-stone-800 text-sm">차감 후 재결제 목록</h4></div><div className="flex items-center gap-2"><span className="text-xl font-black text-stone-800">총 {formatCurrency(totalRepaymentAmount)}</span></div></div>
               {renderTable(filteredRepayments, 'repayment')}
            </div>
          )}
       </div>
    </div>
  );
});
