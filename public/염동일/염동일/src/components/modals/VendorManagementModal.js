import React, { useState } from 'react';
import { X, Building2, Check, Building, Settings, Search, Lock } from 'lucide-react';
import { FIXED_TERMINATED_VENDORS } from '../../config/firebase';

export function VendorManagementModal({ isOpen, onClose, vendors, vendorConfig, onUpdateStatus }) {
  const [searchTerm, setSearchTerm] = useState('');
  if (!isOpen) return null;
  const filteredVendors = vendors.filter(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4 animate-in fade-in duration-200">
      <div className="bg-white shadow-2xl w-full max-w-lg rounded-xl border border-stone-200 max-h-[80vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2"><Settings size={20} className="text-stone-500" />공장 상태 관리</h2>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-md transition-colors"><X size={20} className="text-stone-400" /></button>
        </div>
        <div className="px-6 py-3 border-b border-stone-100 bg-stone-50">
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-stone-400" /></div><input type="text" placeholder="공장명 검색..." className="block w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400 transition-all bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {filteredVendors.length === 0 ? (<div className="p-8 text-center text-stone-500 text-sm">검색 결과가 없습니다.</div>) : (
            <div className="space-y-1">
              {filteredVendors.map(vendor => {
                const isFixed = FIXED_TERMINATED_VENDORS.includes(vendor);
                const status = isFixed ? 'terminated' : (vendorConfig[vendor] || 'active');
                const isTerminated = status === 'terminated';
                return (
                  <div key={vendor} className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg transition-colors border border-transparent hover:border-stone-100">
                    <div className="flex items-center gap-3"><div className={`p-2 rounded-md ${isTerminated ? 'bg-stone-100 text-stone-400' : 'bg-white border border-stone-200 text-stone-600'}`}>{isTerminated ? <Building size={16} /> : <Building2 size={16} />}</div><div className="flex flex-col"><span className={`text-sm font-bold ${isTerminated ? 'text-stone-400 decoration-stone-400' : 'text-stone-800'}`}>{vendor}</span>{isFixed && <span className="text-[10px] text-stone-400 font-bold flex items-center gap-1"><Lock size={8}/> 고정된 공장</span>}</div></div>
                    <button onClick={() => !isFixed && onUpdateStatus(vendor, isTerminated ? 'active' : 'terminated')} disabled={isFixed} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${isFixed ? 'bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed' : isTerminated ? 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'}`}>{isFixed ? '시스템 종료' : (isTerminated ? '거래종료' : '운영중')}</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 rounded-none flex justify-end"><button onClick={onClose} className="px-4 py-2 bg-stone-800 text-white text-sm font-bold rounded-lg hover:bg-stone-700 transition-colors shadow-sm">닫기</button></div>
      </div>
    </div>
  );
}
