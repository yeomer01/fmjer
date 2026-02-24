import React, { useState, useEffect } from 'react';
import { Lock, User, LogOut, AlertCircle, Loader2 } from 'lucide-react';
import { useAppUsers } from '../../hooks/useAppUsers';
import { USER_ACCOUNTS } from '../../config/firebase';

export function LoginScreen({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [saveId, setSaveId] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { appUsers } = useAppUsers();

  useEffect(() => {
    // Only init auth here if needed for potential pre-login checks,
    // but main auth flow is handled in DefectManagerApp for data access
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    if (saveId) localStorage.setItem('er_saved_user_id', userId); else localStorage.removeItem('er_saved_user_id');
    setTimeout(() => {
      const savedPasswords = JSON.parse(localStorage.getItem('er_user_passwords') || '{}');
      const mappedAppUsers = appUsers.map(u => ({ ...u, id: u.userId }));
      const allUsers = [...USER_ACCOUNTS, ...mappedAppUsers];
      const user = allUsers.find(u => u.id === userId);
      if (user) {
        const actualPassword = savedPasswords[userId] || user.password;
        if (password === actualPassword) onLogin(user); else setError('아이디 또는 비밀번호가 일치하지 않습니다.');
      } else { setError('아이디 또는 비밀번호가 일치하지 않습니다.'); }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-stone-200 shadow-lg rounded-sm p-8">
          <div className="text-center mb-8"><div className="inline-flex items-center justify-center bg-stone-800 w-14 h-14 rounded-sm shadow-md mb-4"><span className="text-white font-black text-xl tracking-tighter">ER</span></div><h1 className="text-xl font-black text-stone-800 tracking-tight">불량 통합 관리</h1><p className="text-sm text-stone-400 mt-1">품질 관리의 시작, 체계적인 불량 추적</p></div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><div className="flex items-center gap-2 mb-2 justify-center"><label className="block text-xs font-bold text-stone-600 uppercase tracking-wide">아이디</label><input type="checkbox" checked={saveId} onChange={(e) => setSaveId(e.target.checked)} className="w-3.5 h-3.5 rounded border-stone-300 text-stone-800 focus:ring-stone-400 focus:ring-offset-0 cursor-pointer" title="아이디 저장" /></div><div className="flex border border-stone-300 rounded-sm overflow-hidden focus-within:ring-2 focus-within:ring-stone-400 focus-within:border-stone-400 transition-all"><input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="아이디 입력" className="flex-1 px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 outline-none text-center" autoComplete="username" /><div className="bg-stone-50 px-4 py-3 text-sm text-stone-400 border-l border-stone-200 flex items-center">@fairplay142.com</div></div></div>
            <div><label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-2 text-center">비밀번호</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" className="w-full px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 border border-stone-300 rounded-sm outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400 transition-all text-center" autoComplete="current-password" /></div>
            {error && <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 px-4 py-3 rounded-sm border border-rose-100 justify-center"><AlertCircle size={16} /><span>{error}</span></div>}
            <button type="submit" disabled={isLoading || !userId || !password} className="w-full py-3.5 bg-stone-800 text-white font-bold rounded-sm hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">{isLoading ? <><Loader2 size={18} className="animate-spin" /><span>로그인 중...</span></> : <span>로그인</span>}</button>
          </form>
          <div className="mt-6 pt-6 border-t border-stone-100 text-center"><p className="text-xs text-stone-400">비밀번호를 잊으셨나요? 관리자에게 문의하세요.</p></div>
        </div>
        <div className="mt-6 text-center"><p className="text-xs text-stone-400">&copy; 2025 FMJ International. ER Management System</p></div>
      </div>
    </div>
  );
}
