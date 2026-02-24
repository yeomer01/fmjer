import React, { useState, useEffect } from 'react';
import { X, Lock, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function PasswordChangeModal({ isOpen, onClose, loggedInUser, onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { if (isOpen) { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setError(''); setSuccess(''); } }, [isOpen]);
  const handleSubmit = (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    const savedPasswords = JSON.parse(localStorage.getItem('er_user_passwords') || '{}');
    const targetId = loggedInUser.id || loggedInUser.userId;
    const actualPassword = savedPasswords[targetId] || loggedInUser.password;
    if (currentPassword !== actualPassword) { setError('현재 비밀번호가 일치하지 않습니다.'); return; }
    if (newPassword.length < 4) { setError('새 비밀번호는 4자리 이상이어야 합니다.'); return; }
    if (newPassword !== confirmPassword) { setError('새 비밀번호가 일치하지 않습니다.'); return; }
    if (currentPassword === newPassword) { setError('현재 비밀번호와 다른 비밀번호를 입력해주세요.'); return; }
    setIsLoading(true);
    setTimeout(() => {
      const passwords = JSON.parse(localStorage.getItem('er_user_passwords') || '{}');
      passwords[targetId] = newPassword;
      localStorage.setItem('er_user_passwords', JSON.stringify(passwords));
      setSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setIsLoading(false);
      setTimeout(() => { onPasswordChanged && onPasswordChanged(); onClose(); }, 1500);
    }, 500);
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white border border-stone-200 shadow-2xl rounded-sm w-full max-w-md">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center"><h3 className="text-lg font-bold text-stone-800 flex items-center gap-2"><Lock size={20} className="text-stone-500" /> 비밀번호 변경</h3><button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-sm transition-colors"><X size={20} className="text-stone-400" /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-stone-50 px-4 py-3 rounded-sm border border-stone-100 mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center"><User size={18} className="text-white" /></div><div><p className="font-bold text-stone-800">{loggedInUser?.name}</p><p className="text-xs text-stone-500">{loggedInUser?.id || loggedInUser?.userId}@fairplay142.com</p></div></div></div>
          <div><label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-2">현재 비밀번호</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="현재 비밀번호 입력" className="w-full px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 border border-stone-300 rounded-sm outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400 transition-all text-center" /></div>
          <div><label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-2">새 비밀번호</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="새 비밀번호 입력 (4자리 이상)" className="w-full px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 border border-stone-300 rounded-sm outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400 transition-all text-center" /></div>
          <div><label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-2">새 비밀번호 확인</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="새 비밀번호 다시 입력" className="w-full px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 border border-stone-300 rounded-sm outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400 transition-all text-center" /></div>
          {error && <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 px-4 py-3 rounded-sm border border-rose-100 justify-center"><AlertCircle size={16} /><span>{error}</span></div>}
          {success && <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-3 rounded-sm border border-emerald-100 justify-center"><CheckCircle2 size={16} /><span>{success}</span></div>}
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 py-3 text-stone-600 font-bold rounded-sm border border-stone-200 hover:bg-stone-50 transition-all">취소</button><button type="submit" disabled={isLoading || !currentPassword || !newPassword || !confirmPassword} className="flex-1 py-3 bg-stone-800 text-white font-bold rounded-sm hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">{isLoading ? <><Loader2 size={16} className="animate-spin" /><span>변경 중...</span></> : <span>비밀번호 변경</span>}</button></div>
        </form>
      </div>
    </div>
  );
}
