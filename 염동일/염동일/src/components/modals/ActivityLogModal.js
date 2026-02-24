import React from 'react';
import { X, Activity, Edit2, Plus, Trash2, Upload, Send, RotateCcw, History, Loader2, PlusCircle, CheckCircle2, CreditCard, Hammer } from 'lucide-react';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import { formatTimeAgo } from '../../utils/formatters';

export function ActivityLogModal({ isOpen, onClose, user }) {
  const { logs, loading } = useActivityLogs(user);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-[90] p-4 animate-in fade-in duration-200">
      <div className="bg-white shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl overflow-hidden border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2"><History size={20} className="text-stone-500" />활동 기록 (로그)</h3>
          <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded-full transition-colors"><X size={20} className="text-stone-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-white">
          {loading ? (
            <div className="p-10 text-center"><Loader2 className="w-8 h-8 text-stone-300 animate-spin mx-auto mb-2" /><p className="text-xs text-stone-400">기록을 불러오는 중...</p></div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center text-stone-400 text-sm"><Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />아직 활동 기록이 없습니다.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {logs.map((log) => {
                let icon = Activity;
                let colorClass = "text-stone-400 bg-stone-100";
                if (log.action === '등록' || log.action === '빠른 등록') { icon = PlusCircle; colorClass = "text-blue-600 bg-blue-50"; }
                else if (log.action === '수정' || log.action === '수정 (인라인)') { icon = Edit2; colorClass = "text-amber-600 bg-amber-50"; }
                else if (log.action === '삭제') { icon = Trash2; colorClass = "text-rose-600 bg-rose-50"; }
                else if (log.action === 'CSV 업로드') { icon = Upload; colorClass = "text-emerald-600 bg-emerald-50"; }
                else if (log.action === '차감 확정' || log.action === '차감 요청') { icon = CheckCircle2; colorClass = "text-purple-600 bg-purple-50"; }
                else if (log.action === '차감 취소' || log.action === '요청 취소') { icon = RotateCcw; colorClass = "text-orange-600 bg-orange-50"; }
                else if (log.action === '재결제') { icon = CreditCard; colorClass = "text-green-600 bg-green-50"; }
                else if (log.action === '차감후수선') { icon = Hammer; colorClass = "text-indigo-600 bg-indigo-50"; }
                else if (log.action === '일괄 재결제') { icon = CreditCard; colorClass = "text-green-600 bg-green-50"; }
                const IconComp = icon;
                return (
                  <div key={log.id} className="p-4 hover:bg-stone-50 transition-colors flex gap-3 items-start">
                    <div className={`p-2 rounded-lg ${colorClass} mt-0.5 flex-shrink-0`}><IconComp size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-stone-800">{log.summary}</span>
                        <span className="text-[10px] text-stone-400 font-mono whitespace-nowrap ml-2">{formatTimeAgo(log.timestamp)}</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-2 text-center">{log.details}</p>
                      <div className="flex items-center gap-2 mt-2 justify-center">
                        <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-500 font-bold border border-stone-200">{log.user}</span>
                        <span className="text-[10px] text-stone-300">|</span>
                        <span className="text-[10px] text-stone-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
