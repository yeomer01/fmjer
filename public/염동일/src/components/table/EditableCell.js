import React, { useState, useEffect } from 'react';

export function EditableCell({ value, rowId, field, onUpdate, type = 'text', className = '', placeholder = '', formatter = null }) {
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => { setLocalValue(value); }, [value]);
  const handleChange = (e) => { setLocalValue(e.target.value); };
  const handleBlur = () => { setIsEditing(false); const safeValue = (typeof value === 'object' && value !== null) ? '' : value; if (String(localValue) !== String(safeValue)) { onUpdate(rowId, field, localValue); } };
  const handleKeyDown = (e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } };
  const displayValue = (typeof value === 'object' && value !== null) ? '' : value;
  const safeLocalValue = (typeof localValue === 'object' && localValue !== null) ? '' : localValue;
  if (formatter && !isEditing) {
    return (
      <div onClick={() => setIsEditing(true)} className={`w-full h-full min-h-[24px] flex items-center justify-center cursor-pointer bg-transparent hover:bg-stone-100 border border-transparent rounded-sm px-1.5 py-1 text-stone-800 text-xs transition-all text-center ${className}`} title={formatter(displayValue)}>{formatter(displayValue)}</div>
    );
  }
  return (
    <input type={type} value={safeLocalValue || ''} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDown} placeholder={placeholder} title={safeLocalValue} autoFocus={isEditing} className={`w-full bg-transparent hover:bg-stone-100 focus:bg-white focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 border border-transparent rounded-sm px-1.5 py-1 text-stone-800 transition-all text-xs placeholder:text-stone-300 text-center ${className}`} />
  );
}
