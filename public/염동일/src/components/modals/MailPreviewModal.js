import React, { useState, useEffect, useMemo } from 'react';
import { X, Send, Copy, Mail, ExternalLink, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export function MailPreviewModal({ isOpen, onClose, data }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templateKey, setTemplateKey] = useState('reply');
  const templates = {
    reply: "안녕하세요 ER팀 입니다.\n\n불량 내역을 정리하여 전달해 드립니다.\n첨부된 내용을 확인해 주시고, 특이사항이 있다면 회신 부탁드립니다.\n\n감사합니다.\n\n--------------------------------------------------\n\n",
    share: "안녕하세요 ER팀 입니다.\n\n전달드린 내역 중 미차감된 건들이 확인되어 차감 요청드립니다.\n내용 확인하시고 특이사항 없으시면 차감 진행 부탁드립니다.\n\n감사합니다.\n\n--------------------------------------------------\n\n"
  };
  useEffect(() => {
    if (isOpen && data) {
      setSubject(data.subject);
      if (data.content) setBody(templates[templateKey] + data.content);
      else setBody(data.body);
    }
  }, [isOpen, data, templateKey]);
  const mailtoUrlLength = useMemo(() => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    return 20 + encodedSubject.length + encodedBody.length;
  }, [subject, body]);
  const isTooLong = mailtoUrlLength > 2000;
  const handleTemplateChange = (e) => {
    const newKey = e.target.value;
    setTemplateKey(newKey);
    if (data && data.content) setBody(templates[newKey] + data.content);
  };
  if (!isOpen) return null;
  const handleCopy = async () => {
    const textContent = `제목: ${subject}\n\n${body}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(textContent); alert("메일 내용이 클립보드에 복사되었습니다.\n메일 앱에 붙여넣으세요."); return; }
      const textArea = document.createElement("textarea");
      textArea.value = textContent; textArea.style.position = "fixed"; textArea.style.left = "-9999px";
      document.body.appendChild(textArea); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea);
      alert("메일 내용이 클립보드에 복사되었습니다.\n메일 앱에 붙여넣으세요.");
    } catch (err) { alert("복사에 실패했습니다. 직접 선택하여 복사해주세요."); }
  };
  const handleOpenMailApp = () => {
     if (isTooLong) { alert("내용이 너무 길어 메일 앱을 바로 실행할 수 없습니다.\n'전체 복사' 기능을 이용해주세요."); return; }
     const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
     const link = document.createElement('a'); link.href = mailtoLink; link.target = '_blank';
     document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white shadow-2xl w-full max-w-2xl rounded-xl border border-stone-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2"><Mail className="text-stone-500" size={24} /> 메일 내용 미리보기 (편집 가능)</h3>
            <button onClick={onClose}><X size={24} className="text-stone-400 hover:text-stone-900" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-stone-50">
            <div className="mb-4"><label className="block text-xs font-bold text-stone-500 uppercase mb-1">제목</label><input type="text" className="w-full bg-white p-3 border border-stone-200 rounded-lg text-sm font-bold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-200" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div className="mb-4"><label className="block text-xs font-bold text-stone-500 uppercase mb-1">인사말 템플릿 선택</label><select value={templateKey} onChange={handleTemplateChange} className="w-full bg-white p-3 border border-stone-200 rounded-lg text-sm font-medium text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-200 cursor-pointer"><option value="reply">{"\u{1F4CC}"} 회신 요청 (특이사항 확인용)</option><option value="share">{"\u{1F4B0}"} 미차감 처리 지연</option></select></div>
            <div><div className="flex justify-between items-end mb-1"><label className="block text-xs font-bold text-stone-500 uppercase">본문</label>{isTooLong && (<span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 animate-pulse"><AlertTriangle size={10} /> 내용이 너무 길어 '메일 앱 열기'가 제한됩니다.</span>)}</div><textarea className={`w-full h-80 p-3 border rounded-lg text-sm font-mono text-stone-700 bg-white focus:outline-none focus:ring-2 resize-none shadow-sm leading-relaxed ${isTooLong ? 'border-rose-300 ring-rose-100' : 'border-stone-200 focus:ring-stone-200'}`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="내용을 입력하세요..." /></div>
        </div>
        <div className="px-6 py-4 border-t border-stone-100 bg-white rounded-b-xl flex flex-col sm:flex-row justify-end gap-3 items-center">
             {isTooLong && (<span className="text-xs text-rose-500 font-medium mr-auto text-left w-full sm:w-auto mb-2 sm:mb-0">※ 한글 포함 약 2000자 초과 시 브라우저 제한으로 앱 연동이 불가합니다. <br className="hidden sm:block"/><strong>전체 복사</strong> 기능을 이용해주세요.</span>)}
             <div className="flex gap-3 w-full sm:w-auto"><button onClick={handleCopy} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 rounded-lg text-sm font-bold transition-all border border-stone-200 shadow-sm"><Copy size={16} /> 전체 복사</button><button onClick={handleOpenMailApp} disabled={isTooLong} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${isTooLong ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-stone-800 text-white hover:bg-stone-900'}`}><ExternalLink size={16} /> 메일 앱 열기</button></div>
        </div>
      </div>
    </div>
  );
}
