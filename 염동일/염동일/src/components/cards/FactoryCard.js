import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function FactoryCard({ vendor, items, selectedRowIds, toggleRowSelection }) {
  const [isOpen, setIsOpen] = useState(false);
  const totalCost = items.reduce((sum, item) => sum + (Number(item.cost || 0) * Number(item.quantity || 0)), 0);
  return (
    <div className="bg-white border border-stone-200 mb-[-1px] first:rounded-none last:rounded-none overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full px-5 py-3 flex items-center justify-between transition-colors ${isOpen ? 'bg-stone-50 text-stone-800' : 'bg-white hover:bg-stone-50'}`}>
        <div className="flex items-center gap-4"><div className={`p-1 transition-transform duration-200 ${isOpen ? 'rotate-90 text-stone-600' : 'text-stone-400'}`}><ChevronRight size={16} /></div><div className="text-left flex items-center gap-3"><h4 className="text-sm font-bold text-stone-800">{vendor}</h4><span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 border border-stone-200 rounded-sm">{items.length}건</span></div></div>
        <div className="text-right"><span className="text-sm font-bold text-stone-900 font-mono">{formatCurrency(totalCost)}</span></div>
      </button>
      {isOpen && (
        <div className="border-t border-stone-200 bg-stone-50">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center whitespace-nowrap">
              <thead className="bg-stone-100 text-stone-500 font-bold border-b border-stone-200"><tr><th className="w-8 text-center px-4 py-2">✓</th><th className="px-5 py-2 w-28">차감일</th><th className="px-5 py-2">상품명</th><th className="px-5 py-2">색상</th><th className="px-5 py-2 text-center">사이즈</th><th className="px-5 py-2 text-center">수량</th><th className="px-5 py-2">불량내용</th><th className="px-5 py-2 text-right">금액</th><th className="px-5 py-2 w-48">비고</th></tr></thead>
              <tbody className="divide-y divide-stone-200">
                {items.map(item => (
                  <tr key={item.id} className={`hover:bg-stone-100/50 transition-colors ${item.isRepaid ? 'bg-green-50/60' : ''}`}>
                    <td className="px-4 py-2 text-center"><input type="checkbox" checked={selectedRowIds.has(item.id)} onChange={() => toggleRowSelection(item.id)} onClick={(e) => e.stopPropagation()} className="rounded-sm border-stone-300 text-stone-800 focus:ring-0 w-3.5 h-3.5 cursor-pointer" /></td>
                    <td className="px-5 py-2 text-stone-600 font-mono whitespace-nowrap">{formatDate(item.deductionDate)}</td>
                    <td className="px-5 py-2 font-medium text-stone-800 truncate max-w-[150px]" title={item.productName}>{String(item.productName || '')}</td>
                    <td className="px-5 py-2 text-stone-500 truncate max-w-[80px]" title={item.color}>{String(item.color || '')}</td>
                    <td className="px-5 py-2 text-stone-500 text-center">{String(item.size || '')}</td>
                    <td className="px-5 py-2 text-stone-800 font-bold text-center">{item.quantity}</td>
                    <td className="px-5 py-2 text-stone-500 truncate max-w-[200px]" title={item.defectContent}>{String(item.defectContent || '')}</td>
                    <td className={`px-5 py-2 text-right font-mono font-medium ${item.isRepaid ? 'line-through text-stone-400' : 'text-stone-800'}`}>{formatCurrency(Number(item.cost || 0) * Number(item.quantity || 1))}</td>
                    <td className={`px-5 py-2 truncate max-w-[200px] ${String(item.note || '').includes('차감') ? 'text-rose-600 font-bold' : 'text-stone-400'}`} title={item.note}>{String(item.note || '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
