import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Filter } from 'lucide-react';

export function FilterableHeaderCell({ label, columnKey, allData, filters, onFilterChange, width, onResize }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const uniqueValues = useMemo(() => {
    const values = allData.map(item => item[columnKey]);
    const unique = [...new Set(values)].filter(v => v !== null && v !== undefined && v !== '');
    return unique.sort((a, b) => { if (typeof a === 'number' && typeof b === 'number') return a - b; return String(a).localeCompare(String(b)); });
  }, [allData, columnKey]);
  const selectedValues = filters[columnKey] || [];
  const isFiltered = selectedValues.length > 0;
  useEffect(() => {
    const handleClickOutside = (event) => { if (containerRef.current && !containerRef.current.contains(event.target)) { setIsOpen(false); } };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const toggleValue = (val) => {
    const strVal = String(val);
    if (selectedValues.includes(strVal)) onFilterChange(columnKey, selectedValues.filter(v => v !== strVal));
    else onFilterChange(columnKey, [...selectedValues, strVal]);
  };
  const toggleAll = () => { if (selectedValues.length === uniqueValues.length) onFilterChange(columnKey, []); else onFilterChange(columnKey, uniqueValues.map(String)); };
  return (
    <th className={`px-4 py-3 bg-[#FAFAFA] border-b border-stone-200 relative group/header select-none text-center`} style={{ width: `${width}px`, minWidth: `${width}px` }} ref={containerRef}>
      <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <span className={isFiltered ? 'text-stone-900 font-bold' : 'text-stone-500 font-bold text-[11px] uppercase tracking-wider'}>{label}</span>
        <div className={`p-1 rounded-sm hover:bg-stone-200 transition-colors ${isFiltered ? 'bg-stone-200 text-stone-900' : 'text-stone-300 group-hover:text-stone-500'}`}><Filter size={10} fill={isFiltered ? "currentColor" : "none"} /></div>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-stone-200 shadow-xl rounded-lg z-50 flex flex-col max-h-60" onClick={e => e.stopPropagation()}>
           <div className="p-2 border-b border-stone-100 flex justify-between items-center bg-stone-50 rounded-t-lg"><span className="text-xs font-bold text-stone-500">필터 선택</span><button onClick={() => onFilterChange(columnKey, [])} className="text-[10px] text-stone-600 hover:underline">초기화</button></div>
           <div className="overflow-y-auto p-1 custom-scrollbar text-left">
              <label className="flex items-center px-2 py-1.5 hover:bg-stone-50 cursor-pointer"><input type="checkbox" checked={selectedValues.length === uniqueValues.length && uniqueValues.length > 0} onChange={toggleAll} className="rounded border-stone-300 text-stone-800 focus:ring-0 w-3 h-3 mr-2" /><span className="text-xs font-bold text-stone-700">전체 선택</span></label>
              <div className="h-px bg-stone-100 my-1 mx-2"></div>
              {uniqueValues.map((val, idx) => (<label key={idx} className="flex items-center px-2 py-1.5 hover:bg-stone-50 cursor-pointer"><input type="checkbox" checked={selectedValues.includes(String(val))} onChange={() => toggleValue(val)} className="rounded border-stone-300 text-stone-800 focus:ring-0 w-3 h-3 mr-2" /><span className="text-xs text-stone-600 truncate" title={String(val)}>{String(val)}</span></label>))}
              {uniqueValues.length === 0 && <div className="p-2 text-center text-xs text-stone-400">데이터 없음</div>}
           </div>
        </div>
      )}
      <div onMouseDown={(e) => onResize(e, columnKey)} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 group-hover/header:bg-stone-300 active:bg-blue-600 transition-colors z-20" onClick={(e) => e.stopPropagation()} />
    </th>
  );
}
