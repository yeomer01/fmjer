import React from 'react';

export function ResizableHeader({ label, width, onResize, columnKey, align = 'center' }) {
  return (
  <th className={`px-4 py-3 bg-white border-b border-stone-200 relative group/header select-none text-${align} text-center`} style={{ width: `${width}px`, minWidth: `${width}px` }}>
    <span className="font-bold text-[11px] uppercase tracking-wider text-stone-500">{label}</span>
    <div onMouseDown={(e) => onResize(e, columnKey)} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 group-hover/header:bg-stone-300 active:bg-blue-600 transition-colors z-20" onClick={(e) => e.stopPropagation()} />
  </th>
);
}
