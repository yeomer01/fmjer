import React from 'react';

export function QuickAddInput({ name, value, onChange, placeholder, type = "text", className = "", onEnter, suggestions = [] }) {
  const listId = `list-${name}`;
  return (
    <>
      <input type={type} name={name} value={value} onChange={onChange} onKeyDown={(e) => { if(e.key === 'Enter') onEnter(); }} placeholder={placeholder} list={suggestions.length > 0 ? listId : undefined} autoComplete="off" className={`w-full bg-white border border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 rounded-sm px-2 py-1.5 text-xs text-stone-800 placeholder:text-blue-200 transition-all text-center ${className}`} />
      {suggestions.length > 0 && (<datalist id={listId}>{suggestions.map((item, idx) => (<option key={`${name}-${idx}`} value={item} />))}</datalist>)}
    </>
  );
}
