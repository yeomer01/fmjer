import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';

export function ConfirmModal({ isOpen, message, detail, skippedItems, onConfirm, onCancel }) {
  const [showSkipped, setShowSkipped] = useState(false);
  useEffect(() => { if (isOpen) setShowSkipped(false); }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white shadow-2xl max-w-lg w-full p-0 border border-stone-200 animate-in zoom-in-95 duration-200 rounded-xl overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-bold text-stone-900 mb-3 flex items-center justify-center gap-2"><AlertCircle className="text-stone-600" size={24} />확인</h3>
          <p className="text-stone-600 mb-6 whitespace-pre-wrap leading-relaxed text-sm text-center">{String(message)}</p>
          {detail && (
            <div className="bg-stone-50 p-4 mb-6 text-sm text-stone-700 space-y-2 border border-stone-100 rounded-lg">
               {Array.isArray(detail) ? detail.map((line, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-stone-200/50 pb-1 last:border-0 last:pb-0">
                  <span className="text-stone-500 font-medium">{line.label}</span>
                  <span className="font-bold font-mono text-center">{String(line.value)}</span>
                </div>
              )) : (
                 <p className="text-stone-600 whitespace-pre-line text-center">{String(detail)}</p>
              )}
            </div>
          )}
          {skippedItems && skippedItems.length > 0 && (
            <div className="mb-6">
              <button onClick={() => setShowSkipped(!showSkipped)} className="flex items-center justify-between w-full text-sm font-bold text-amber-800 bg-amber-50 px-4 py-3 border border-amber-200 hover:bg-amber-100 transition-colors rounded-lg">
                <span className="flex items-center gap-2"><AlertTriangle size={16} />제외/병합된 항목 확인 ({skippedItems.length}건)</span>
                {showSkipped ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showSkipped && (
                <div className="mt-[-1px] bg-white border border-amber-200 border-t-0 max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-center">
                    <thead className="bg-amber-50 text-amber-800 font-bold sticky top-0">
                      <tr><th className="px-3 py-2 border-b border-amber-100 text-center">행</th><th className="px-3 py-2 border-b border-amber-100 text-center">사유</th><th className="px-3 py-2 border-b border-amber-100 text-center">내용</th></tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {skippedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/50">
                          <td className="px-3 py-2 font-mono text-amber-700 text-center">#{item.line}</td>
                          <td className="px-3 py-2 font-medium text-amber-700 text-center">{item.reason}</td>
                          <td className="px-3 py-2 text-stone-500 truncate max-w-[150px] text-center" title={item.content}>{String(item.content)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="bg-stone-50 px-6 py-4 flex justify-center gap-3 border-t border-stone-100">
          <button onClick={onCancel} className="px-5 py-2 text-stone-600 hover:bg-white hover:text-stone-900 border border-transparent hover:border-stone-300 text-sm font-bold transition-all rounded-lg">취소</button>
          <button onClick={onConfirm} className="px-5 py-2 bg-stone-800 text-white hover:bg-stone-700 text-sm font-bold transition-colors shadow-sm rounded-lg">확인</button>
        </div>
      </div>
    </div>
  );
}
