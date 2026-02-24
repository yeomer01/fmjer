import React, { useState } from 'react';
import { X, UserPlus, UserMinus, ShieldAlert, Users, Loader2, Plus, Trash2 } from 'lucide-react';
import { useAppUsers } from '../../hooks/useAppUsers';
import { db, appId, USER_ACCOUNTS } from '../../config/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';

export function UserManagementModal({ isOpen, onClose, onConfirm, onToast }) {
  const { appUsers } = useAppUsers();
  const [newUser, setNewUser] = useState({ userId: '', password: '', name: '', role: 'staff' });
  const [isAdding, setIsAdding] = useState(false);
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.userId || !newUser.password || !newUser.name) { onToast("모든 필드를 입력해주세요.", 'error'); return; }
    const allIds = [...USER_ACCOUNTS.map(u => u.id), ...appUsers.map(u => u.userId)];
    if (allIds.includes(newUser.userId)) { onToast("이미 존재하는 아이디입니다.", 'error'); return; }
    setIsAdding(true);
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'), { userId: newUser.userId, password: newUser.password, name: newUser.name, role: newUser.role, createdAt: new Date().toISOString() });
        setNewUser({ userId: '', password: '', name: '', role: 'staff' });
        onToast("사용자가 추가되었습니다.");
    } catch (error) { console.error("Add user error:", error); onToast("사용자 추가 실패", 'error'); } finally { setIsAdding(false); }
  };
  const handleDeleteUser = (docId, userName) => {
      onConfirm(`'${userName}' 사용자를 삭제하시겠습니까?`, async () => {
          try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', docId)); onToast("사용자가 삭제되었습니다."); }
          catch (e) { console.error(e); onToast("삭제 실패", 'error'); }
      });
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white shadow-2xl w-full max-w-2xl rounded-xl border border-stone-200 flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50"><h3 className="text-lg font-bold text-stone-800 flex items-center gap-2"><Users className="text-stone-500" size={20} /> 사용자 계정 관리</h3><button onClick={onClose}><X size={20} className="text-stone-400 hover:text-stone-900" /></button></div>
        <div className="flex-1 overflow-y-auto p-6 bg-white">
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-6"><h4 className="text-sm font-bold text-stone-700 mb-3 flex items-center justify-center gap-2"><UserPlus size={16}/> 새 사용자 등록</h4><form onSubmit={handleAddUser} className="grid grid-cols-2 md:grid-cols-4 gap-3"><input type="text" placeholder="아이디" className="px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 text-center" value={newUser.userId} onChange={e => setNewUser({...newUser, userId: e.target.value})} /><input type="text" placeholder="이름" className="px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 text-center" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} /><input type="text" placeholder="비밀번호" className="px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 text-center" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /><div className="flex gap-2"><select className="px-2 py-2 border rounded text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-stone-400 cursor-pointer text-center" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}><option value="staff">일반</option><option value="manager">관리자</option></select><button type="submit" disabled={isAdding} className="bg-stone-800 text-white px-3 py-2 rounded text-sm font-bold hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center">{isAdding ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}</button></div></form></div>
            <div className="space-y-4"><h4 className="text-sm font-bold text-stone-700 mb-2 flex items-center justify-center gap-2"><ShieldAlert size={16}/> 등록된 사용자 목록</h4>
                <div className="space-y-2 mb-4"><p className="text-xs font-bold text-stone-400 uppercase tracking-wide px-1 text-center">System Accounts (기본)</p>{USER_ACCOUNTS.map(user => (<div key={user.id} className="flex items-center justify-between p-3 bg-stone-100 rounded-lg border border-stone-200 opacity-70"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center text-stone-500 font-bold text-xs">SYS</div><div><div className="text-sm font-bold text-stone-700 text-center">{user.name} ({user.id})</div><div className="text-xs text-stone-400 text-center">관리자 (불변)</div></div></div><span className="text-xs text-stone-400 font-medium bg-stone-200 px-2 py-1 rounded text-center">수정불가</span></div>))}</div>
                <div className="space-y-2"><p className="text-xs font-bold text-stone-400 uppercase tracking-wide px-1 text-center">Custom Accounts (추가됨)</p>{appUsers.length === 0 ? (<div className="p-4 text-center text-stone-400 text-sm border border-dashed border-stone-200 rounded-lg">추가된 사용자가 없습니다.</div>) : (appUsers.map(user => (<div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-stone-200 hover:border-blue-300 transition-colors shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${user.role === 'manager' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>{user.role === 'manager' ? 'M' : 'S'}</div><div><div className="text-sm font-bold text-stone-800 text-center">{user.name} ({user.userId})</div><div className="text-xs text-stone-400 flex items-center gap-2 justify-center"><span>{user.role === 'manager' ? '관리자' : '스태프'}</span><span className="w-1 h-1 bg-stone-300 rounded-full"></span><span className="font-mono">PW: {user.password}</span></div></div></div><button onClick={() => handleDeleteUser(user.id, user.name)} className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="삭제"><Trash2 size={16} /></button></div>)))}</div>
            </div>
        </div>
      </div>
    </div>
  );
}
