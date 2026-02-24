import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Printer, Camera, Mail, FileText, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function ReportPreviewModal({ isOpen, onClose, data }) {
  const [reportNote, setReportNote] = useState("위 내역에 대하여 확인 부탁드립니다.");
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;
  const totalQuantity = data.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalCost = data.reduce((sum, item) => sum + (Number(item.cost || 0) * Number(item.quantity || 0)), 0);

  const handlePrint = () => { window.print(); };
  const handleCopyForEmail = () => {
    const range = document.createRange();
    const selection = window.getSelection();
    const node = document.getElementById('report-content-body');
    if (!node) return;
    selection.removeAllRanges();
    range.selectNodeContents(node);
    selection.addRange(range);
    try {
      const successful = document.execCommand('copy');
      if (successful) alert("\u{1F4CB} 보고서 내용이 복사되었습니다.\n\n메일 작성 창으로 이동하여 '붙여넣기(Ctrl+V)' 하세요.\n(표 형식이 그대로 유지됩니다)");
      else alert("복사에 실패했습니다. 수동으로 드래그하여 복사해주세요.");
    } catch (err) { alert("이 브라우저에서는 지원하지 않는 기능입니다."); }
    selection.removeAllRanges();
  };

  const handleCapture = async () => {
    if (!window.html2canvas) { alert("캡쳐 도구를 불러오는 중입니다. 잠시 후 다시 시도해주세요."); return; }
    setIsCapturing(true);
    try {
      const element = document.getElementById('report-content-body');
      const canvas = await window.html2canvas(element, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true });
      const link = document.createElement('a');
      link.download = `불량내역서_${new Date().toLocaleDateString()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { console.error("Capture failed:", err); alert("이미지 저장 중 오류가 발생했습니다."); } finally { setIsCapturing(false); }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200 print:bg-white print:p-0 print:absolute print:inset-0 print:z-[200]">
      <div className="bg-white shadow-2xl w-full max-w-[1000px] max-h-[90vh] flex flex-col rounded-xl overflow-hidden print:shadow-none print:max-h-full print:max-w-none print:rounded-none print:h-full">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50 print:hidden">
           <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2"><FileText className="text-stone-600" size={20} /> 보고서 미리보기</h3>
           <div className="flex gap-2">
             <button onClick={handleCopyForEmail} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 text-stone-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 rounded-lg transition-all text-xs font-bold shadow-sm" title="메일 본문에 표 붙여넣기"><Copy size={14} /> <span>메일 복사</span></button>
             <button onClick={handleCapture} disabled={isCapturing} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 rounded-lg transition-all text-xs font-bold shadow-sm disabled:opacity-50" title="이미지로 저장">{isCapturing ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}<span>이미지 저장</span></button>
             <div className="w-px h-6 bg-stone-200 mx-1"></div>
             <button onClick={handlePrint} className="p-2 hover:bg-stone-200 rounded-full transition-colors" title="인쇄 / PDF 저장"><Printer size={20} className="text-stone-600" /></button>
             <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors"><X size={20} className="text-stone-400" /></button>
           </div>
        </div>
        <div id="print-area" className="p-8 overflow-y-auto bg-white flex-1 custom-scrollbar print:p-0 print:overflow-visible">
           <div id="report-content-body" className="bg-white p-4">
               <div className="border-b-2 border-stone-800 pb-6 mb-6 flex justify-between items-end">
                  <div><h1 className="text-3xl font-black text-stone-900 tracking-tight mb-2">불량 내역서</h1><p className="text-sm text-stone-500 font-medium">작성일: {new Date().toLocaleDateString()}</p></div>
                  <div className="text-right"><div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Total Amount</div><div className="text-2xl font-black text-stone-800">{formatCurrency(totalCost)}</div></div>
               </div>
               <div className="mb-8">
                 <table className="w-full text-xs text-center border-collapse table-fixed">
                   <thead className="bg-stone-100 text-stone-600 font-bold border-y border-stone-200 print:bg-stone-100 print:text-stone-800">
                     <tr><th className="py-2 px-2 border-b border-stone-200 text-center w-[40px]">No</th><th className="py-2 px-2 border-b border-stone-200 text-center w-[90px]">불량확인일</th><th className="py-2 px-2 border-b border-stone-200 w-[120px]">업체명</th><th className="py-2 px-2 border-b border-stone-200">상품명</th><th className="py-2 px-2 border-b border-stone-200 w-[80px]">색상</th><th className="py-2 px-2 border-b border-stone-200 text-center w-[60px]">사이즈</th><th className="py-2 px-2 border-b border-stone-200 w-[150px]">불량 내용</th><th className="py-2 px-2 text-center border-b border-stone-200 w-[60px]">수량</th><th className="py-2 px-2 text-right border-b border-stone-200 w-[100px]">금액</th></tr>
                   </thead>
                   <tbody className="divide-y divide-stone-100">
                     {data.map((item, idx) => (
                       <tr key={item.id} className="text-stone-700">
                         <td className="py-2 px-2 text-stone-400 font-mono text-center">{idx + 1}</td>
                         <td className="py-2 px-2 text-center font-mono text-stone-600">{formatDate(item.checkDate)}</td>
                         <td className="py-2 px-2 font-bold truncate text-center">{item.vendor}</td>
                         <td className="py-2 px-2 font-medium truncate text-center">{item.productName}</td>
                         <td className="py-2 px-2 text-stone-600 truncate text-center">{item.color}</td>
                         <td className="py-2 px-2 text-center text-stone-600">{item.size}</td>
                         <td className="py-2 px-2 text-stone-600 truncate text-center">{item.defectContent}</td>
                         <td className="py-2 px-2 text-center font-bold">{item.quantity}</td>
                         <td className="py-2 px-2 text-right font-mono">{formatCurrency(item.cost * item.quantity)}</td>
                       </tr>
                     ))}
                   </tbody>
                   <tfoot className="border-t-2 border-stone-800 bg-stone-50 print:bg-stone-50"><tr><td colSpan="7" className="py-3 px-4 text-right font-bold text-stone-600">합계</td><td className="py-3 px-2 text-center font-black text-stone-900">{totalQuantity}</td><td className="py-3 px-2 text-right font-black text-stone-900">{formatCurrency(totalCost)}</td></tr></tfoot>
                 </table>
               </div>
               <div className="border border-stone-200 rounded-lg p-6 bg-stone-50/50 print:bg-white print:border-stone-300">
                  <h4 className="font-bold text-stone-800 mb-2 text-sm uppercase">비고 / 특이사항</h4>
                  <div contentEditable suppressContentEditableWarning className="text-sm text-stone-600 leading-relaxed min-h-[60px] whitespace-pre-wrap outline-none p-2 -ml-2 rounded hover:bg-stone-100/50 focus:bg-stone-100 transition-colors" onBlur={(e) => setReportNote(e.target.innerText)}>{reportNote}</div>
               </div>
           </div>
           <div className="mt-12 text-center text-xs text-stone-400 print:mt-20"><p>이 문서는 ER 불량 통합 관리 시스템에서 생성되었습니다.</p></div>
        </div>
      </div>
      <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; } }`}</style>
    </div>
  );
}
