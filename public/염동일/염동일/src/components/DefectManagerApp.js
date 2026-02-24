import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Plus, Search, Download, Trash2, Edit2, AlertCircle, CheckCircle2, Calendar,
  DollarSign, Package, Upload, RotateCcw, XCircle, Wrench, X, Save, Loader2,
  RefreshCw, FileText, ChevronDown, ChevronUp, AlertTriangle, Merge,
  LayoutDashboard, ClipboardList, CheckSquare, Calculator, ChevronRight,
  Percent, ArrowDown, ArrowRight, Check, Clock, AlertOctagon, Factory,
  ChevronsLeft, ChevronLeft, ChevronsRight, Building2, Building, Settings,
  Briefcase, Lock, Filter, ListFilter, User, Palette, PlusCircle, Menu,
  PieChart, ExternalLink, Mail, Copy, Printer, Image as ImageIcon, Send,
  Camera, LogOut, History, Activity, Users, UserPlus, UserMinus, ShieldAlert,
  CreditCard, Hammer
} from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, writeBatch, updateDoc, addDoc } from "firebase/firestore";
import { db, appId } from '../config/firebase';

import { useDefects } from '../hooks/useDefects';
import { useVendorSettings } from '../hooks/useVendorSettings';
import { useDefectStats } from '../hooks/useDefectStats';

import { formatCurrency, formatDate } from '../utils/formatters';
import { isOverdue } from '../utils/validators';
import { parseAndValidateCSV } from '../utils/csvParser';

import { Toast } from './modals/Toast';
import { ConfirmModal } from './modals/ConfirmModal';
import { VendorManagementModal } from './modals/VendorManagementModal';
import { DefectModal } from './modals/DefectModal';
import { MailPreviewModal } from './modals/MailPreviewModal';
import { ReportPreviewModal } from './modals/ReportPreviewModal';
import { ActivityLogModal } from './modals/ActivityLogModal';
import { PasswordChangeModal } from './modals/PasswordChangeModal';
import { UserManagementModal } from './modals/UserManagementModal';

import { EditableCell } from './table/EditableCell';
import { QuickAddInput } from './table/QuickAddInput';
import { FilterableHeaderCell } from './table/FilterableHeaderCell';
import { ResizableHeader } from './table/ResizableHeader';
import { StatCard } from './cards/StatCard';
import { ActionCard } from './cards/ActionCard';

import { DeductionRequestSection } from './sections/DeductionRequestSection';
import { SplitProcessedSection } from './sections/SplitProcessedSection';
import { BottomDeductionSection } from './sections/BottomDeductionSection';
import { OverdueItemsSection } from './sections/OverdueItemsSection';
import { FactoryRepairRateSection } from './sections/FactoryRepairRateSection';

export default function DefectManagerApp({ loggedInUser, onLogout }) {
  const { user, data, loading, setData } = useDefects();
  const { vendorConfig, updateVendorStatus } = useVendorSettings(user);

  // -- 상태를 상위에서 관리하여 하단 액션바 렌더링에 사용 --
  const [processedSubTab, setProcessedSubTab] = useState('repair');
  const splitProcessedRef = useRef(null);

  // Sync sub-tab state when SplitProcessedSection changes tabs
  useEffect(() => {
    const handleSubTabChange = (e) => {
      setProcessedSubTab(e.detail);
    };
    window.addEventListener('subTabChange', handleSubTabChange);
    return () => window.removeEventListener('subTabChange', handleSubTabChange);
  }, []);

  const getItemStatus = useCallback((item) => {
    const note = String(item.note || '');
    const defect = String(item.defectContent || '');
    const combined = (note + defect).trim();
    if (item.isRepaid) return { label: '재결제됨', className: 'bg-green-100 text-green-700' };
    if ((item.deductionDate && item.deductionDate !== 'X') || (combined.includes('차감') && !combined.includes('미차감')))
      return { label: '차감완료', className: 'bg-purple-100 text-purple-700' };
    const completedKeywords = ['수선완료', '자체수선', '수선불가', '폐기', '반품', '교환', '매입', '인수'];
    if ((item.repairDate && item.repairDate !== 'X') || completedKeywords.some(k => combined.includes(k)))
      return { label: '수선완료', className: 'bg-blue-100 text-blue-700' };
    if (item.isDeductionRequested)
      return { label: '차감요청', className: 'bg-indigo-100 text-indigo-700 font-extrabold' };
    if (isOverdue(item.checkDate, item.repairDate, item.deductionDate, item.returnDate, item.note))
      return { label: '지연', className: 'bg-amber-100 text-amber-700 animate-pulse' };
    return { label: '대기', className: 'bg-stone-100 text-stone-500' };
  }, []);

  const dataWithDerivedStatus = useMemo(() => {
    return data.map(item => ({ ...item, status: getItemStatus(item).label }));
  }, [data, getItemStatus]);

  const uniqueValues = useMemo(() => {
    const extractUnique = (key) => {
      const values = dataWithDerivedStatus.map(d => d[key]).filter(v => v !== null && v !== undefined && v !== '');
      return [...new Set(values)].sort();
    };
    return {
      vendor: extractUnique('vendor'),
      productName: extractUnique('productName'),
      color: extractUnique('color'),
      size: extractUnique('size'),
      defectContent: extractUnique('defectContent'),
      note: extractUnique('note'),
      status: extractUnique('status')
    };
  }, [dataWithDerivedStatus]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isUserMgmtModalOpen, setIsUserMgmtModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [columnFilters, setColumnFilters] = useState({});

  const getInitialQuickAddState = useCallback(() => ({
    checkDate: new Date().toISOString().split('T')[0],
    vendor: '', productName: '', color: '', size: '',
    quantity: 1, cost: 0, defectContent: '', note: '',
    barcodeDate: '', source: 'ER', releaseDate: '',
    repairDate: '', deductionDate: '', returnDate: '',
    hubDate: '', manager: ''
  }), []);

  const [quickAddData, setQuickAddData] = useState(getInitialQuickAddState);
  const handleQuickAddChange = (e) => {
    const { name, value } = e.target;
    setQuickAddData(prev => ({ ...prev, [name]: value }));
  };

  const logAction = async (actionType, summary, detailedChange = '') => {
    if (!user) return;
    try {
      const logRef = collection(db, 'artifacts', appId, 'public', 'data', 'logs');
      await addDoc(logRef, {
        action: actionType,
        summary: summary,
        details: detailedChange,
        user: loggedInUser?.name || 'Unknown',
        userId: loggedInUser?.id || loggedInUser?.userId || 'unknown',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Logging failed", e);
    }
  };

  const handleQuickAddSubmit = async () => {
    if (!user) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }
    if (!quickAddData.vendor) {
      showToast('업체명을 입력해주세요.', 'error');
      return;
    }
    try {
      const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'defects');
      const docRef = doc(collectionRef);
      let finalData = { ...quickAddData };
      if (!finalData.manager && loggedInUser?.name) finalData.manager = loggedInUser.name;
      const combinedText = (String(finalData.note || '') + String(finalData.defectContent || '')).trim();
      const isDeductionText = combinedText.includes('차감') && !combinedText.includes('미차감');
      if (isDeductionText && (!finalData.deductionDate || finalData.deductionDate.trim() === ''))
        finalData.deductionDate = new Date().toISOString().split('T')[0];
      await setDoc(docRef, { ...finalData, id: docRef.id });
      logAction('빠른 등록', `${finalData.vendor} - ${finalData.productName}`,
        `수량: ${finalData.quantity}, 원가: ${finalData.cost}, 내용: ${finalData.defectContent}`);
      showToast('빠른 등록 완료');
      setQuickAddData(prev => ({ ...getInitialQuickAddState(), checkDate: prev.checkDate }));
    } catch (error) {
      console.error("Quick add error:", error);
      showToast('등록 실패', 'error');
    }
  };

  const [columnWidths, setColumnWidths] = useState({
    no: 40, checkDate: 100, vendor: 120, productName: 150, color: 80,
    size: 60, quantity: 60, cost: 100, defectContent: 200, status: 100,
    note: 120, manager: 80
  });
  const [visibleColumns, setVisibleColumns] = useState({
    checkDate: true, vendor: true, productName: true, color: true,
    size: true, quantity: true, cost: true, defectContent: true,
    status: true, note: true, manager: true
  });
  const handleResizeStart = (e, key) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[key] || 100;
    const onMouseMove = (moveEvent) => {
      const currentWidth = startWidth + (moveEvent.clientX - startX);
      setColumnWidths(prev => ({ ...prev, [key]: Math.max(40, currentWidth) }));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [mailData, setMailData] = useState({ subject: '', body: '' });
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setIsColumnMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (key) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [vendorFilterTab, setVendorFilterTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 60;
  const fileInputRef = useRef(null);
  const bottomSectionRef = useRef(null);
  const repairRateSectionRef = useRef(null);
  const overdueSectionRef = useRef(null);
  const splitProcessedSectionRef = useRef(null);
  const deductionRequestSectionRef = useRef(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false, message: '', detail: null, skippedItems: [], onConfirm: null
  });
  const [cardStyle, setCardStyle] = useState('clean');
  const toggleCardStyle = () => {
    if (cardStyle === 'clean') setCardStyle('vibrant');
    else if (cardStyle === 'vibrant') setCardStyle('analytical');
    else setCardStyle('clean');
  };

  const filteredForStats = useMemo(() => {
    return dataWithDerivedStatus.filter(item => {
      const matchesSearch = Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchesSearch) return false;
      for (const [key, selectedValues] of Object.entries(columnFilters)) {
        if (selectedValues.length > 0) {
          const itemValue = String(item[key] || '');
          if (!selectedValues.includes(itemValue)) return false;
        }
      }
      const normalizedCheckDate = formatDate(item.checkDate);
      if (dateRange.start && normalizedCheckDate && normalizedCheckDate < dateRange.start) return false;
      if (dateRange.end && normalizedCheckDate && normalizedCheckDate > dateRange.end) return false;
      return true;
    });
  }, [dataWithDerivedStatus, searchTerm, columnFilters, dateRange]);

  const stats = useDefectStats(data);
  const showToast = (message, type = 'success') => { setToast({ message, type }); };
  const closeToast = useCallback(() => { setToast({ message: '', type: '' }); }, []);

  const showConfirm = (message, arg1, arg2, arg3) => {
    let detail = null; let skippedItems = []; let onConfirm = null;
    if (typeof arg1 === 'function') onConfirm = arg1;
    else if (typeof arg2 === 'function') { detail = arg1; onConfirm = arg2; }
    else { detail = arg1; skippedItems = arg2; onConfirm = arg3; }
    setConfirmDialog({
      isOpen: true, message, detail, skippedItems: skippedItems || [],
      onConfirm: () => {
        if (onConfirm && typeof onConfirm === 'function') onConfirm();
        setConfirmDialog({ isOpen: false, message: '', detail: null, skippedItems: [], onConfirm: null });
      }
    });
  };

  const handleInlineUpdate = async (id, field, value) => {
    if (!user) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }
    try {
      const item = data.find(d => d.id === id);
      const oldValue = item ? item[field] : 'unknown';
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'defects', id);
      await updateDoc(docRef, { [field]: value });
      logAction('수정 (인라인)', `${item?.vendor || 'Unknown'} 항목 수정`, `${field}: ${oldValue} -> ${value}`);
    } catch (error) {
      console.error("Update error:", error);
      showToast('수정 실패', 'error');
    }
  };

  const filteredData = useMemo(() => {
    return [...filteredForStats].sort((a, b) => {
      const dateA = a.checkDate || '';
      const dateB = b.checkDate || '';
      return dateA.localeCompare(dateB);
    });
  }, [filteredForStats]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));

  const groupedDeductionData = useMemo(() => {
    const deductionItems = data.filter(item => {
      const hasDate = item.deductionDate && item.deductionDate.trim() !== '' && item.deductionDate !== 'X';
      const isExcluded = item.note && (typeof item.note === 'string' &&
        (item.note.includes('미차감') || item.note.includes('자체수선')));
      return hasDate && !isExcluded;
    });
    return deductionItems.reduce((acc, item) => {
      const vendor = item.vendor || '미지정';
      if (!acc[vendor]) acc[vendor] = [];
      acc[vendor].push(item);
      return acc;
    }, {});
  }, [data]);

  const getUniqueValues = (key) => {
    const values = data.map(item => item[key]);
    const unique = [...new Set(values)];
    return unique.sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    });
  };

  const handleColumnFilterChange = (key, values) => {
    setColumnFilters(prev => ({ ...prev, [key]: values }));
    setCurrentPage(1);
  };

  const toggleVendorFilter = (vendorName) => {
    const currentVendors = columnFilters['vendor'] || [];
    let newVendors;
    if (currentVendors.includes(vendorName))
      newVendors = currentVendors.filter(v => v !== vendorName);
    else
      newVendors = [...currentVendors, vendorName];
    handleColumnFilterChange('vendor', newVendors);
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  const handleDownload = () => {
    if (filteredData.length === 0) {
      showToast('다운로드할 데이터가 없습니다.', 'error');
      return;
    }
    const headers = ['불량확인일', '바코드 날짜', '업체', '불량 내용', '제품원가', '상품명', '색상', '사이즈', '수량', '불량 출처', '불량 출고일', '수선 확인일', '차감 적용일', '반환 적용일', '허브 출고일', '비고', '담당자'];
    const csvRows = [headers.join(','), ...filteredData.map(item => {
      return [
        `"${item.checkDate || ''}"`, `"${item.barcodeDate || ''}"`, `"${item.vendor || ''}"`,
        `"${(item.defectContent || '').replace(/"/g, '""')}"`, item.cost || 0,
        `"${(item.productName || '').replace(/"/g, '""')}"`, `"${item.color || ''}"`,
        `"${item.size || ''}"`, item.quantity || 0, `"${item.source || ''}"`,
        `"${item.releaseDate || ''}"`, `"${item.repairDate || ''}"`,
        `"${item.deductionDate || ''}"`, `"${item.returnDate || ''}"`,
        `"${item.hubDate || ''}"`, `"${(item.note || '').replace(/"/g, '""')}"`,
        `"${(item.manager || '').replace(/"/g, '""')}"`
      ].join(',');
    })];
    const csvString = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `불량관리내역_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('파일이 다운로드되었습니다.');
  };

  const handleSave = async (formData, keepOpen = false) => {
    if (!user) {
      showToast('로그인이 필요합니다.', 'error');
      return false;
    }
    setIsSaving(true);
    try {
      const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'defects');
      let finalData = { ...formData };
      delete finalData.status;
      if (finalData.id) delete finalData.id;
      const combinedText = (String(finalData.note || '') + String(finalData.defectContent || '')).trim();
      const isDeductionText = combinedText.includes('차감') && !combinedText.includes('미차감');
      if (isDeductionText && (!finalData.deductionDate || finalData.deductionDate.trim() === ''))
        finalData.deductionDate = new Date().toISOString().split('T')[0];
      if (editingItem && !keepOpen) {
        const docRef = doc(collectionRef, editingItem.id);
        await updateDoc(docRef, finalData);
        logAction('수정', `${finalData.vendor} 항목 수정`, `${finalData.productName} (${finalData.defectContent})`);
      } else {
        const docRef = doc(collectionRef);
        await setDoc(docRef, { ...finalData, id: docRef.id });
        logAction('등록', `${finalData.vendor} 항목 등록`, `${finalData.productName} (${finalData.defectContent})`);
      }
      showToast(editingItem && !keepOpen ? '수정되었습니다.' : '저장되었습니다.');
      if (!keepOpen) { setIsModalOpen(false); setEditingItem(null); }
      return true;
    } catch (error) {
      console.error("Save error:", error);
      showToast('저장에 실패했습니다.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm('정말 이 항목을 삭제하시겠습니까?', null, [], async () => {
      if (!user) return;
      try {
        const item = data.find(d => d.id === id);
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'defects', id));
        logAction('삭제', `${item?.vendor || 'Unknown'} 항목 삭제`, `${item?.productName} - ${item?.defectContent}`);
        showToast('삭제되었습니다.');
      } catch (error) {
        console.error("Delete error:", error);
        showToast('삭제 실패', 'error');
      }
    });
  };

  const handleEdit = (item) => { setEditingItem(item); setIsModalOpen(true); };
  const openNewModal = () => { setEditingItem(null); setIsModalOpen(true); };

  const handleResetData = () => {
    showConfirm(
      '현재 등록된 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 목록이 빈 상태로 초기화됩니다.',
      null, [],
      async () => {
        if (!user) return;
        setIsSaving(true);
        try {
          const chunkSize = 400;
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            chunk.forEach(item => {
              const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'defects', item.id);
              batch.delete(docRef);
            });
            await batch.commit();
          }
          logAction('전체 초기화', '모든 데이터 삭제', `총 ${data.length}건 삭제됨`);
          showToast('모든 데이터가 삭제되었습니다.');
        } catch (error) {
          console.error("Reset error:", error);
          showToast('초기화 중 오류가 발생했습니다.', 'error');
        } finally {
          setIsSaving(false);
        }
      }
    );
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { finalItems, skippedItemsList, skipCounts } = parseAndValidateCSV(text);
      const detailMsg = [
        { label: '전체 행 (CSV Row)', value: `${skipCounts.total}행` },
        { label: '업로드 예정', value: `${finalItems.length}건` },
        { label: '제외됨 (Skipped)', value: `${skipCounts.total - finalItems.length}건` },
        { label: '└ 자동 병합 (Smart Merge)', value: `${skipCounts.merged}건 (성공)` },
        { label: '└ 데이터 미비', value: `${skipCounts.missingData + skipCounts.header + skipCounts.repeatedHeader + skipCounts.empty + skipCounts.separator}건` }
      ];
      if (finalItems.length > 0) {
        showConfirm(
          `${finalItems.length}개의 유효한 데이터를 찾았습니다. 저장하시겠습니까?`,
          detailMsg, skippedItemsList,
          async () => {
            if (!user) return;
            setIsSaving(true);
            try {
              const chunkSize = 400;
              for (let i = 0; i < finalItems.length; i += chunkSize) {
                const chunk = finalItems.slice(i, i + chunkSize);
                const batch = writeBatch(db);
                chunk.forEach(item => {
                  const docRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'defects'));
                  batch.set(docRef, { ...item, id: docRef.id });
                });
                await batch.commit();
              }
              logAction('CSV 업로드', `${finalItems.length}건 데이터 업로드`, `파일명: ${file.name}`);
              showToast(`${finalItems.length}건 저장 완료`);
            } catch (error) {
              console.error(error);
              showToast('저장 중 오류가 발생했습니다.', 'error');
            } finally {
              setIsSaving(false);
            }
          }
        );
      } else {
        showToast('유효한 데이터가 없습니다.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const triggerFileUpload = () => { fileInputRef.current.click(); };

  const allVendorsList = useMemo(() => {
    const values = data.map(item => item.vendor);
    const unique = [...new Set(values)].filter(v => v !== null && v !== undefined && v !== '');
    return unique.sort((a, b) => String(a).localeCompare(String(b)));
  }, [data]);

  const toggleRowSelection = (id) => {
    const newSet = new Set(selectedRowIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRowIds(newSet);
  };

  const toggleAllRows = (items) => {
    if (items.every(item => selectedRowIds.has(item.id))) {
      const newSet = new Set(selectedRowIds);
      items.forEach(item => newSet.delete(item.id));
      setSelectedRowIds(newSet);
    } else {
      const newSet = new Set(selectedRowIds);
      items.forEach(item => newSet.add(item.id));
      setSelectedRowIds(newSet);
    }
  };

  const handleSendEmail = () => {
    const selectedData = data.filter(item => selectedRowIds.has(item.id));
    if (selectedData.length === 0) return;
    const subject = `[불량관리] 선택된 불량 내역 (${selectedData.length}건) 회신 부탁드립니다.`;
    const content = selectedData.map(item =>
      `■ ${item.vendor} | ${item.productName} (${item.color}/${item.size})` +
      `\n- 불량내용: ${item.defectContent}` +
      `\n- 수량: ${item.quantity} / 원가: ${formatCurrency(item.cost)}` +
      `\n- 확인일: ${formatDate(item.checkDate)}` +
      (item.note ? `\n- 비고: ${item.note}` : '')
    ).join('\n\n');
    setMailData({ subject, content, body: '' });
    setIsMailModalOpen(true);
  };

  const handleOpenReport = () => {
    const selectedData = data.filter(item => selectedRowIds.has(item.id));
    if (selectedData.length === 0) return;
    setIsReportModalOpen(true);
  };

  const handleMoveToDeductionRequest = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      selectedRowIds.forEach(id => {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'defects', id);
        batch.update(docRef, { isDeductionRequested: true });
      });
      await batch.commit();
      logAction('차감 요청', `${selectedRowIds.size}건 차감 요청`, '선택된 항목 일괄 요청');
      showToast(`${selectedRowIds.size}건 차감 요청 내역으로 이동되었습니다.`);
      setSelectedRowIds(new Set());
      setActiveTab('deduction_request');
    } catch (error) {
      console.error("Error moving to deduction request:", error);
      showToast('이동 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSingleDeductionRequest = async (item) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'defects', item.id);
      await updateDoc(docRef, { isDeductionRequested: true });
      logAction('차감 요청', `${item.vendor} 항목 차감 요청`, item.productName);
      showToast('차감 요청 내역으로 이동되었습니다.');
    } catch (error) {
      console.error("Error moving to deduction request:", error);
      showToast('이동 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleRevertDeduction = (item) => {
    const isRepaidItem = item.isRepaid;
    const confirmMessage = isRepaidItem
      ? `'${item.productName}'의 재결제를 취소하시겠습니까?`
      : `'${item.productName}'의 차감 처리를 취소하시겠습니까?`;
    const confirmDetail = isRepaidItem
      ? "확인 시 '차감 완료' 상태로 되돌아갑니다."
      : "확인 시 '차감 요청' 목록으로 이동됩니다.";
    showConfirm(
      confirmMessage,
      confirmDetail,
      async () => {
        if (!user) return;
        try {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'defects', item.id);
          if (isRepaidItem) {
            let newNote = item.note ? String(item.note).replaceAll('(재결제)', '').replaceAll('재결제', '').trim() : '';
            await updateDoc(docRef, {
              isRepaid: false,
              note: newNote
            });
            logAction('재결제 취소', `${item.vendor} 재결제 취소`, `${item.productName} -> 차감 완료 상태로 복원`);
            showToast('재결제가 취소되었습니다.');
          } else {
            let newNote = item.note ? String(item.note).replaceAll('차감완료', '').trim() : '';
            await updateDoc(docRef, {
              deductionDate: '',
              isDeductionRequested: true,
              note: newNote,
              isReverted: true
            });
            logAction('차감 취소', `${item.vendor} 차감 취소`, `${item.productName} -> 요청 목록 이동`);
            showToast('차감 처리가 취소되었습니다.');
          }
        } catch (error) {
          console.error("Revert error:", error);
          showToast('취소 실패', 'error');
        }
      }
    );
  };

  const handleBatchRepayment = async () => {
    if (!user || selectedRowIds.size === 0) return;
    const itemsToRepay = data.filter(item => selectedRowIds.has(item.id) && item.deductionDate && !item.isRepaid);

    if (itemsToRepay.length === 0) {
      showToast("재결제 가능한 항목이 선택되지 않았습니다.", 'error');
      return;
    }

    showConfirm(
      `선택한 ${itemsToRepay.length}건을 일괄 재결제(환불) 처리하시겠습니까?`,
      "차감 내역은 유지되지만 합계에서 제외되며 '재결제됨'으로 표시됩니다.",
      async () => {
        try {
          const batch = writeBatch(db);
          itemsToRepay.forEach(item => {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'defects', item.id);
            const currentNote = item.note || '';
            const newNote = currentNote.includes('재결제') ? currentNote : (currentNote ? `${currentNote} (재결제)` : '재결제');
            batch.update(docRef, { isRepaid: true, note: newNote });
          });
          await batch.commit();
          logAction('일괄 재결제', `${itemsToRepay.length}건 재결제 처리`, '선택 항목 일괄 처리');
          showToast(`${itemsToRepay.length}건 재결제 처리가 완료되었습니다.`);
          setSelectedRowIds(new Set());
        } catch (e) {
          console.error(e);
          showToast('처리 실패', 'error');
        }
      }
    );
  };

  const handleSingleRepayment = (item) => {
    if (!user) return;
    showConfirm(
      `'${item.productName}' 건을 재결제(환불) 처리하시겠습니까?`,
      "확인 시 '차감 후 재결제' 목록으로 이동됩니다.",
      async () => {
        try {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'defects', item.id);
          const currentNote = item.note || '';
          const newNote = currentNote.includes('재결제') ? currentNote : (currentNote ? `${currentNote} (재결제)` : '재결제');
          await updateDoc(docRef, {
            isRepaid: true,
            note: newNote
          });
          logAction('재결제', `${item.vendor} 항목 재결제 처리`, item.productName);
          showToast('재결제 처리가 완료되었습니다.');
        } catch (e) {
          console.error(e);
          showToast('처리 실패', 'error');
        }
      }
    );
  };

  const handleProcessRequest = async (item) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'defects', item.id);
      const currentNote = item.note ? String(item.note) : '';
      const newNote = currentNote.includes('차감완료') ? currentNote : (currentNote ? `${currentNote} 차감완료` : '차감완료');
      await updateDoc(docRef, {
        deductionDate: new Date().toISOString().split('T')[0],
        isDeductionRequested: false,
        note: newNote,
        manager: loggedInUser.name,
        isReverted: false,
        isRepaid: false
      });
      logAction('차감 확정', `${item.vendor} 항목 차감 확정`,
        `${item.productName} (${item.quantity}개) - 담당자: ${loggedInUser.name}`);
      showToast('차감 확정 처리되었습니다.');
    } catch (error) {
      console.error("Error processing deduction:", error);
      showToast('처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleCancelRequest = async (item) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'defects', item.id);
      await updateDoc(docRef, { isDeductionRequested: false });
      logAction('요청 취소', `${item.vendor} 차감 요청 취소`, item.productName);
      showToast('요청이 취소되었습니다.');
    } catch (error) {
      console.error("Error canceling request:", error);
      showToast('취소 중 오류가 발생했습니다.', 'error');
    }
  };

  const selectedVendors = columnFilters['vendor'] || [];

  if (loading) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-stone-400 animate-spin mx-auto mb-4" />
        <p className="text-stone-500 font-medium">데이터를 불러오는 중...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-stone-900 flex flex-col relative pb-20">
      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      <ConfirmModal isOpen={confirmDialog.isOpen} message={confirmDialog.message} detail={confirmDialog.detail} skippedItems={confirmDialog.skippedItems} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ isOpen: false, message: '', detail: null, skippedItems: [], onConfirm: null })} />
      <VendorManagementModal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} vendors={getUniqueValues('vendor')} vendorConfig={vendorConfig} onUpdateStatus={updateVendorStatus} />
      <DefectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingItem} isSaving={isSaving} loggedInUser={loggedInUser} />
      <MailPreviewModal isOpen={isMailModalOpen} onClose={() => setIsMailModalOpen(false)} data={mailData} />
      <ReportPreviewModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} data={data.filter(item => selectedRowIds.has(item.id))} />
      <ActivityLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} user={user} />
      <PasswordChangeModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} loggedInUser={loggedInUser} onPasswordChanged={() => showToast('비밀번호가 변경되었습니다.')} />
      <UserManagementModal isOpen={isUserMgmtModalOpen} onClose={() => setIsUserMgmtModalOpen(false)} onConfirm={showConfirm} onToast={showToast} />

      {/* Floating Action Bar */}
      {selectedRowIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 flex shadow-2xl">
          <button onClick={handleSendEmail} className="flex items-center gap-3 px-6 py-4 bg-stone-800 text-white rounded-l-md hover:bg-stone-700 transition-all font-bold border-r border-stone-600 hover:scale-105 active:scale-95 text-lg"><Mail size={20} strokeWidth={2.5} /><span>메일 발송</span></button>
          <button onClick={handleOpenReport} className="flex items-center gap-3 px-6 py-4 bg-stone-100 text-stone-800 hover:bg-stone-200 transition-all font-bold border-r border-stone-300 hover:scale-105 active:scale-95 text-lg"><ImageIcon size={20} strokeWidth={2.5} /><span>보고서/이미지</span></button>
          {(activeTab === 'list' || activeTab === 'overdue') && (
            <button onClick={handleMoveToDeductionRequest} className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-bold border-r border-indigo-500 hover:scale-105 active:scale-95 text-lg"><Send size={20} strokeWidth={2.5} /><span>차감 요청 등록</span></button>
          )}
          {(activeTab === 'processed' && processedSubTab === 'deduction') && (
            <button onClick={handleBatchRepayment} className="flex items-center gap-3 px-6 py-4 bg-green-600 text-white hover:bg-green-700 transition-all font-bold border-r border-green-500 hover:scale-105 active:scale-95 text-lg"><CreditCard size={20} strokeWidth={2.5} /><span>선택 항목 재결제</span></button>
          )}
          <button onClick={() => setSelectedRowIds(new Set())} className="flex items-center justify-center px-5 py-4 bg-stone-800 text-stone-400 hover:text-white hover:bg-rose-600 rounded-r-md transition-all font-bold hover:scale-105 active:scale-95" title="선택 모두 해제"><X size={24} strokeWidth={3} /></button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 border-b border-stone-200 sticky top-0 z-30 px-6 py-3 flex justify-between items-center shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-stone-800 w-8 h-8 flex items-center justify-center shadow-md shadow-stone-200 rounded-sm">
              <span className="text-white font-black text-xs tracking-tighter">ER</span>
            </div>
            <h2 className="text-lg font-black text-stone-800 tracking-tight">불량 통합 관리</h2>
          </div>
          <div className="h-6 w-px bg-stone-200 mx-2"></div>
          <button onClick={toggleCardStyle} className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-all text-xs font-bold border border-stone-200 shadow-sm">
            <Palette size={14} />
            <span className="hidden md:inline">스타일: {cardStyle === 'clean' ? '깔끔형' : cardStyle === 'vibrant' ? '강조형' : '분석형'}</span>
          </button>

          {/* Date Range Picker in Header */}
          <div className="hidden md:flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-1.5 shadow-sm ml-2 transition-all hover:border-stone-300">
            <span className="text-xs text-stone-500 font-bold flex items-center gap-1.5 whitespace-nowrap">
              <Calendar size={14} className="text-stone-400"/> 기간:
            </span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => { setDateRange({...dateRange, start: e.target.value}); setCurrentPage(1); }}
              className="text-xs border-none focus:ring-0 text-stone-600 p-0 w-24 bg-transparent cursor-pointer font-mono outline-none"
            />
            <span className="text-stone-300">~</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => { setDateRange({...dateRange, end: e.target.value}); setCurrentPage(1); }}
              className="text-xs border-none focus:ring-0 text-stone-600 p-0 w-24 bg-transparent cursor-pointer font-mono outline-none"
            />
            {(dateRange.start || dateRange.end) && (
              <button
                onClick={() => setDateRange({start: '', end: ''})}
                className="ml-1 text-stone-400 hover:text-rose-500 transition-colors p-0.5 rounded-full hover:bg-rose-50"
                title="기간 초기화"
              >
                <XCircle size={14}/>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-stone-600 font-bold animate-pulse flex items-center mr-4">
              <Save size={14} className="mr-1.5" /> 저장 중...
            </span>
          )}
          <div className="h-4 w-px bg-stone-200 mx-1"></div>
          <button onClick={handleResetData} className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-all rounded-sm" title="데이터 초기화"><RotateCcw size={18} strokeWidth={2.5} /></button>
          <button onClick={triggerFileUpload} className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-all rounded-sm" title="CSV 업로드"><Upload size={18} strokeWidth={2.5} /></button>
          <button onClick={handleDownload} className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-all rounded-sm" title="엑셀 다운로드"><Download size={18} strokeWidth={2.5} /></button>
          <button onClick={openNewModal} className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-stone-200 transition-all active:scale-95 ml-2 rounded-sm"><Plus size={16} strokeWidth={3} /> 신규 등록</button>
          <div className="h-6 w-px bg-stone-200 mx-2"></div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-sm border border-stone-200">
              <div className="w-6 h-6 bg-stone-800 rounded-full flex items-center justify-center">
                <User size={12} className="text-white" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-stone-800">{loggedInUser?.name}</span>
                <span className="text-stone-400 ml-1">({loggedInUser?.id || loggedInUser?.userId})</span>
              </div>
            </div>
            {loggedInUser?.role === 'manager' && (
              <button onClick={() => setIsUserMgmtModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-sm transition-all text-xs font-bold border border-transparent hover:border-stone-200" title="사용자 계정 관리">
                <Users size={14} /><span className="hidden md:inline">계정관리</span>
              </button>
            )}
            <button onClick={() => setIsLogModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-sm transition-all text-xs font-bold border border-transparent hover:border-stone-200" title="활동 기록">
              <History size={14} /><span className="hidden md:inline">기록</span>
            </button>
            <button onClick={() => setIsPasswordModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-sm transition-all text-xs font-bold border border-transparent hover:border-stone-200" title="비밀번호 변경">
              <Lock size={14} /><span className="hidden md:inline">비번변경</span>
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all text-xs font-bold border border-transparent hover:border-rose-200" title="로그아웃">
              <LogOut size={14} /><span className="hidden md:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-[1920px] mx-auto w-full space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="총 불량 수량" value={`${stats.totalDefects} 개`} icon={AlertCircle} colorClass="text-stone-600 bg-stone-600" borderColor="border-t-stone-500" variant={cardStyle} progressValue={100} />
          <StatCard title="미처리 수량" value={`${stats.pendingQuantity} 개`} subText="현재 대기 중인 물량" icon={AlertOctagon} colorClass="text-amber-600 bg-amber-600" borderColor="border-t-amber-500" highlightText={stats.overdueItemsCount > 0 ? `${stats.overdueItemsCount}건 지연 (1달+)` : null} onHighlightClick={() => setActiveTab('overdue')} variant={cardStyle} progressValue={stats.totalDefects > 0 ? (stats.pendingQuantity / stats.totalDefects) * 100 : 0} />
          <StatCard title="처리완료 수량" value={`${stats.processedQuantity} 개`} subText={<span className="flex flex-col gap-0.5"><span className="flex justify-between"><span>미차감 수선완료:</span><b className="text-stone-600">{stats.undeductedRepairQuantity}개</b></span><span className="flex justify-between"><span>자체수선:</span><b className="text-stone-600">{stats.selfRepairQuantity}개</b></span></span>} highlightText="상세 내역 보기" onHighlightClick={() => setActiveTab('processed')} icon={CheckCircle2} colorClass="text-blue-600 bg-blue-600" borderColor="border-t-blue-500" variant={cardStyle} progressValue={stats.totalDefects > 0 ? (stats.processedQuantity / stats.totalDefects) * 100 : 0} />
          <ActionCard title={<span className="text-rose-600 font-bold">차감 완료</span>} value={<div className="flex flex-col"><span>{stats.deductionCompleted} 건</span><span className="text-lg font-bold opacity-100 mt-1 text-stone-800">{formatCurrency(stats.deductionTotalAmount)}</span></div>} icon={Calculator} bgClass="bg-[#FDFBF7]" onClick={() => setActiveTab('stats')} variant={cardStyle} />
          <ActionCard title="수선 진행률" value={`${stats.totalRepairRate}%`} icon={Percent} bgClass="bg-[#FDFBF7]" onClick={() => setActiveTab('stats')} variant={cardStyle} />
        </div>

        {/* Vendor Filter */}
        <div className="bg-white border border-stone-200 shadow-sm rounded-none p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-stone-800 flex items-center gap-2 text-sm">
              <Factory size={16} className="text-stone-500" /> 공장별 필터 (빠른 선택)
            </h3>
            {selectedVendors.length > 0 && (
              <button onClick={() => handleColumnFilterChange('vendor', [])} className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold">
                <XCircle size={12} /> 전체 해제 ({selectedVendors.length}개 선택됨)
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
            <button onClick={() => handleColumnFilterChange('vendor', [])} className={`px-3 py-1.5 rounded-sm text-xs font-bold border transition-all ${selectedVendors.length === 0 ? 'bg-stone-800 text-white border-stone-800 shadow-sm' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}>전체</button>
            {allVendorsList.map(v => (
              <button key={v} onClick={() => toggleVendorFilter(v)} className={`px-3 py-1.5 rounded-sm text-xs font-bold border transition-all ${selectedVendors.includes(v) ? 'bg-stone-600 text-white border-stone-600 shadow-md transform scale-105' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-800'}`}>{v}</button>
            ))}
            {allVendorsList.length === 0 && <span className="text-xs text-stone-400 p-1">등록된 공장 정보가 없습니다.</span>}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 px-1">
          <nav className="flex flex-wrap gap-3 p-1.5 bg-stone-200/40 rounded-2xl" aria-label="Tabs">
            {[
              { id: 'list', label: '전체 내역 관리', icon: ClipboardList, activeClass: 'bg-[#FDFBF7] text-blue-800 border border-blue-100 shadow-md ring-1 ring-blue-500/10', inactiveClass: 'text-stone-500 hover:text-stone-800 hover:bg-[#FDFBF7]/60' },
              { id: 'deduction_request', label: '차감 요청 내역', icon: Send, activeClass: 'bg-[#FDFBF7] text-indigo-800 border border-indigo-100 shadow-md ring-1 ring-indigo-500/10', inactiveClass: 'text-stone-500 hover:text-stone-800 hover:bg-[#FDFBF7]/60' },
              { id: 'processed', label: '처리 완료 내역', icon: CheckCircle2, activeClass: 'bg-[#FDFBF7] text-purple-800 border border-purple-100 shadow-md ring-1 ring-purple-500/10', inactiveClass: 'text-stone-500 hover:text-stone-800 hover:bg-[#FDFBF7]/60' },
              { id: 'overdue', label: '장기 미처리', icon: AlertOctagon, activeClass: 'bg-[#FDFBF7] text-amber-800 border border-amber-100 shadow-md ring-1 ring-amber-500/10', inactiveClass: 'text-stone-500 hover:text-stone-800 hover:bg-[#FDFBF7]/60' },
              { id: 'stats', label: '공장별 통계', icon: PieChart, activeClass: 'bg-[#FDFBF7] text-emerald-800 border border-emerald-100 shadow-md ring-1 ring-emerald-500/10', inactiveClass: 'text-stone-500 hover:text-stone-800 hover:bg-[#FDFBF7]/60' }
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedRowIds(new Set()); }} className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ease-in-out ${activeTab === tab.id ? tab.activeClass : tab.inactiveClass}`}>
                <tab.icon size={18} strokeWidth={2.5} className={activeTab === tab.id ? 'scale-110 transition-transform opacity-90' : 'opacity-60'} />
                <span>{tab.label}</span>
                {tab.id === 'overdue' && stats.overdueItemsCount > 0 && (
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'overdue' ? 'bg-amber-100 text-amber-800' : 'bg-stone-300 text-white'}`}>{stats.overdueItemsCount}</span>
                )}
                {tab.id === 'deduction_request' && stats.deductionRequestedItems.length > 0 && (
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'deduction_request' ? 'bg-indigo-100 text-indigo-800' : 'bg-stone-300 text-white'}`}>{stats.deductionRequestedItems.length}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* List Tab */}
        {activeTab === 'list' && (
          <div className="bg-white border border-stone-200 shadow-none rounded-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 h-[calc(100vh-140px)] min-h-[600px]">
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-white sticky top-0 z-30 gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="p-2 bg-stone-100 rounded-lg"><ClipboardList size={20} className="text-stone-700" /></div>
                <div>
                  <h3 className="font-bold text-stone-800 text-base">전체 내역 관리</h3>
                  <p className="text-xs text-stone-400 font-medium mt-0.5">총 <span className="font-bold text-stone-900">{filteredData.length}</span>건 조회됨</p>
                </div>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                {/* Search Bar */}
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-md px-2 py-1.5 shadow-sm mr-2">
                  <Search className="w-3.5 h-3.5 text-stone-400 mr-2" />
                  <input
                    type="text"
                    placeholder="통합 검색..."
                    className="bg-transparent border-none text-xs w-28 focus:ring-0 text-stone-700 placeholder:text-stone-400 outline-none"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  />
                  {(searchTerm) && (
                    <button onClick={() => { setSearchTerm(''); }} className="text-stone-400 hover:text-red-500 transition-colors ml-2" title="검색조건 초기화"><XCircle size={14}/></button>
                  )}
                </div>
                <button onClick={openNewModal} className="flex items-center gap-1.5 px-3 py-2 bg-white text-stone-700 border border-stone-300 rounded-sm text-xs font-bold hover:bg-stone-50 transition-all shadow-sm active:scale-95 whitespace-nowrap"><Plus size={14} strokeWidth={3} /> 내역 추가</button>
                <div className="relative" ref={columnMenuRef}>
                  <button onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)} className="p-2 bg-white border border-stone-200 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all" title="열 설정"><ListFilter size={18} /></button>
                  {isColumnMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-200 shadow-xl rounded-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-[10px] font-bold text-stone-400 mb-2 px-2 uppercase tracking-wider">표시할 항목 선택</div>
                      <div className="space-y-1">
                        {Object.entries({
                          checkDate: '불량확인일', vendor: '업체명', productName: '상품명',
                          color: '색상', size: '사이즈', quantity: '수량', cost: '원가',
                          defectContent: '불량내용', status: '진행상태', note: '비고', manager: '담당자'
                        }).map(([key, label]) => (
                          <label key={key} className="flex items-center px-2 py-1.5 hover:bg-stone-50 rounded-lg cursor-pointer group transition-colors">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors ${visibleColumns[key] ? 'bg-stone-800 border-stone-800' : 'bg-white border-stone-300 group-hover:border-stone-400'}`}>
                              {visibleColumns[key] && <Check size={10} className="text-white" strokeWidth={4} />}
                            </div>
                            <input type="checkbox" className="hidden" checked={visibleColumns[key]} onChange={() => toggleColumn(key)} />
                            <span className={`text-xs font-medium ${visibleColumns[key] ? 'text-stone-800' : 'text-stone-400'}`}>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {Object.keys(columnFilters).length > 0 && (
                  <button onClick={clearAllFilters} className="p-2 bg-white text-red-500 rounded-lg hover:bg-red-50 transition-all border border-transparent hover:border-red-100" title="필터 초기화"><XCircle size={18} /></button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto custom-scrollbar flex-1 bg-white">
              <table className="w-full text-xs text-center relative border-collapse table-fixed">
                <thead className="bg-white text-stone-500 font-bold border-b border-stone-200 sticky top-0 z-20 shadow-sm whitespace-nowrap">
                  <tr>
                    <th className="w-8 text-center px-2 py-2 bg-white border-r border-stone-100" style={{ width: '40px' }}>
                      <input type="checkbox" checked={paginatedData.length > 0 && paginatedData.every(item => selectedRowIds.has(item.id))} className="rounded border-stone-300 text-stone-800 focus:ring-0" onChange={() => toggleAllRows(paginatedData)} />
                    </th>
                    <ResizableHeader label="No" width={columnWidths.no} columnKey="no" onResize={handleResizeStart} />
                    {visibleColumns.checkDate && <FilterableHeaderCell label="불량확인일" columnKey="checkDate" allData={data} filters={columnFilters} onFilterChange={handleColumnFilterChange} width={columnWidths.checkDate} onResize={handleResizeStart} />}
                    {visibleColumns.vendor && <FilterableHeaderCell label="업체명" columnKey="vendor" allData={data} filters={columnFilters} onFilterChange={handleColumnFilterChange} width={columnWidths.vendor} onResize={handleResizeStart} />}
                    {visibleColumns.productName && <FilterableHeaderCell label="상품명" columnKey="productName" allData={data} filters={columnFilters} onFilterChange={handleColumnFilterChange} width={columnWidths.productName} onResize={handleResizeStart} />}
                    {visibleColumns.color && <FilterableHeaderCell label="색상" columnKey="color" allData={data} filters={columnFilters} onFilterChange={handleColumnFilterChange} width={columnWidths.color} onResize={handleResizeStart} />}
                    {visibleColumns.size && <FilterableHeaderCell label="사이즈" columnKey="size" allData={data} filters={columnFilters} onFilterChange={handleColumnFilterChange} width={columnWidths.size} onResize={handleResizeStart} />}
                    {visibleColumns.quantity && <ResizableHeader label="수량" width={columnWidths.quantity} columnKey="quantity" onResize={handleResizeStart} />}
                    {visibleColumns.cost && <ResizableHeader label="원가" width={columnWidths.cost} columnKey="cost" onResize={handleResizeStart} align="right" />}
                    {visibleColumns.defectContent && <FilterableHeaderCell label="불량내용" columnKey="defectContent" allData={data} filters={columnFilters} onFilterChange={handleColumnFilterChange} width={columnWidths.defectContent} onResize={handleResizeStart} />}
                    {visibleColumns.status && <FilterableHeaderCell label="상태" columnKey="status" allData={dataWithDerivedStatus} filters={columnFilters} onFilterChange={handleColumnFilterChange} width={columnWidths.status} onResize={handleResizeStart} />}
                    {visibleColumns.note && <FilterableHeaderCell label="비고" columnKey="note" allData={data} filters={columnFilters} onFilterChange={handleColumnFilterChange} width={columnWidths.note} onResize={handleResizeStart} />}
                    {visibleColumns.manager && <FilterableHeaderCell label="담당자" columnKey="manager" allData={data} filters={columnFilters} onFilterChange={handleColumnFilterChange} width={columnWidths.manager} onResize={handleResizeStart} />}
                    <th className="px-2 py-2 text-center sticky right-0 bg-white z-30 shadow-l-sm border-l border-stone-100 font-bold text-[11px] uppercase tracking-wider text-stone-500" style={{ width: '80px' }}>관리</th>
                  </tr>
                  {/* Quick Add Row */}
                  <tr className="bg-blue-50/40 border-b-2 border-blue-100/50 shadow-inner">
                    <td className="px-2 py-2 text-center border-r border-blue-100/50 bg-blue-50/20"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mx-auto"></div></td>
                    <td className="px-2 py-2 text-center font-bold text-[10px] text-blue-500 border-r border-blue-100/50 bg-blue-50/20">NEW</td>
                    {visibleColumns.checkDate && <td className="px-1.5 py-1.5"><QuickAddInput name="checkDate" type="date" value={quickAddData.checkDate} onChange={handleQuickAddChange} onEnter={handleQuickAddSubmit} /></td>}
                    {visibleColumns.vendor && <td className="px-1.5 py-1.5"><QuickAddInput name="vendor" value={quickAddData.vendor} onChange={handleQuickAddChange} onEnter={handleQuickAddSubmit} placeholder="업체명" suggestions={uniqueValues.vendor} /></td>}
                    {visibleColumns.productName && <td className="px-1.5 py-1.5"><QuickAddInput name="productName" value={quickAddData.productName} onChange={handleQuickAddChange} onEnter={handleQuickAddSubmit} placeholder="상품명" suggestions={uniqueValues.productName} /></td>}
                    {visibleColumns.color && <td className="px-1.5 py-1.5"><QuickAddInput name="color" value={quickAddData.color} onChange={handleQuickAddChange} onEnter={handleQuickAddSubmit} placeholder="색상" suggestions={uniqueValues.color} /></td>}
                    {visibleColumns.size && <td className="px-1.5 py-1.5"><QuickAddInput name="size" value={quickAddData.size} onChange={handleQuickAddChange} onEnter={handleQuickAddSubmit} placeholder="사이즈" className="text-center" suggestions={uniqueValues.size} /></td>}
                    {visibleColumns.quantity && <td className="px-1.5 py-1.5"><QuickAddInput name="quantity" type="number" value={quickAddData.quantity} onChange={handleQuickAddChange} onEnter={handleQuickAddSubmit} className="text-center font-bold" /></td>}
                    {visibleColumns.cost && <td className="px-1.5 py-1.5"><QuickAddInput name="cost" type="number" value={quickAddData.cost} onChange={handleQuickAddChange} onEnter={handleQuickAddSubmit} className="text-right font-mono" /></td>}
                    {visibleColumns.defectContent && <td className="px-1.5 py-1.5"><QuickAddInput name="defectContent" value={quickAddData.defectContent} onChange={handleQuickAddChange} onEnter={handleQuickAddSubmit} placeholder="불량내용" suggestions={uniqueValues.defectContent} /></td>}
                    {visibleColumns.status && <td className="px-1.5 py-1.5 text-center">{(() => { const status = getItemStatus(quickAddData); return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.className}`}>{status.label}</span>; })()}</td>}
                    {visibleColumns.note && <td className="px-1.5 py-1.5"><QuickAddInput name="note" value={quickAddData.note} onChange={handleQuickAddChange} onEnter={handleQuickAddSubmit} placeholder="비고" suggestions={uniqueValues.note} /></td>}
                    {visibleColumns.manager && <td className="px-1.5 py-1.5"><QuickAddInput name="manager" value={quickAddData.manager} onChange={handleQuickAddChange} onEnter={handleQuickAddSubmit} placeholder="담당자" className="text-center" /></td>}
                    <td className="px-2 py-2 text-center sticky right-0 bg-blue-50 border-l border-blue-100 shadow-sm z-30">
                      <button onClick={handleQuickAddSubmit} className="flex items-center justify-center w-full h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm active:scale-95" title="입력 저장 (Enter)"><Plus size={16} strokeWidth={3} /></button>
                    </td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan="100%" className="p-20 text-center text-stone-400 font-medium">데이터가 없습니다.</td></tr>
                  ) : (
                    paginatedData.map((item, index) => {
                      const isSelected = selectedRowIds.has(item.id);
                      const status = getItemStatus(item);
                      let statusColorClass = "border-l-4 border-l-transparent";
                      if (status.label === '차감완료') statusColorClass = "border-l-4 border-l-purple-500 bg-purple-50/10";
                      else if (status.label === '수선완료') statusColorClass = "border-l-4 border-l-blue-500 bg-blue-50/10";
                      else if (status.label === '지연') statusColorClass = "border-l-4 border-l-amber-500 bg-amber-50/20";
                      else if (status.label === '차감요청') statusColorClass = "border-l-4 border-l-indigo-500 bg-indigo-50/20";
                      else statusColorClass = "border-l-4 border-l-stone-200";
                      return (
                        <tr key={item.id} className={`hover:bg-stone-50 transition-colors group ${isSelected ? 'bg-stone-50' : ''} ${statusColorClass}`}>
                          <td className="px-2 py-2 text-center border-r border-stone-50 whitespace-nowrap overflow-hidden">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleRowSelection(item.id)} className="rounded border-stone-300 text-stone-800 focus:ring-0 w-3.5 h-3.5 cursor-pointer" />
                          </td>
                          <td className="px-2 py-2 text-center text-stone-400 font-mono text-[10px] border-r border-stone-50 whitespace-nowrap overflow-hidden text-ellipsis">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                          {visibleColumns.checkDate && <td className="px-1.5 py-1.5 whitespace-nowrap overflow-hidden"><EditableCell value={formatDate(item.checkDate)} rowId={item.id} field="checkDate" onUpdate={handleInlineUpdate} type="date" /></td>}
                          {visibleColumns.vendor && <td className="px-1.5 py-1.5 overflow-hidden"><EditableCell value={item.vendor} rowId={item.id} field="vendor" onUpdate={handleInlineUpdate} className="font-bold" /></td>}
                          {visibleColumns.productName && <td className="px-1.5 py-1.5 overflow-hidden"><EditableCell value={item.productName} rowId={item.id} field="productName" onUpdate={handleInlineUpdate} /></td>}
                          {visibleColumns.color && <td className="px-1.5 py-1.5 overflow-hidden"><EditableCell value={item.color} rowId={item.id} field="color" onUpdate={handleInlineUpdate} /></td>}
                          {visibleColumns.size && <td className="px-1.5 py-1.5 overflow-hidden"><EditableCell value={item.size} rowId={item.id} field="size" onUpdate={handleInlineUpdate} className="text-center" /></td>}
                          {visibleColumns.quantity && <td className="px-1.5 py-1.5 whitespace-nowrap overflow-hidden"><EditableCell value={item.quantity} rowId={item.id} field="quantity" onUpdate={handleInlineUpdate} type="number" className="text-center font-bold" /></td>}
                          {visibleColumns.cost && <td className="px-1.5 py-1.5 whitespace-nowrap overflow-hidden"><EditableCell value={item.cost} rowId={item.id} field="cost" onUpdate={handleInlineUpdate} type="number" className="text-right font-mono" formatter={formatCurrency} /></td>}
                          {visibleColumns.defectContent && <td className="px-1.5 py-1.5 overflow-hidden"><EditableCell value={item.defectContent} rowId={item.id} field="defectContent" onUpdate={handleInlineUpdate} /></td>}
                          {visibleColumns.status && <td className="px-2 py-2 text-center whitespace-nowrap overflow-hidden"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.className}`}>{status.label}</span></td>}
                          {visibleColumns.note && <td className="px-1.5 py-1.5 overflow-hidden"><EditableCell value={item.note} rowId={item.id} field="note" onUpdate={handleInlineUpdate} placeholder="-" /></td>}
                          {visibleColumns.manager && <td className="px-1.5 py-1.5 overflow-hidden"><EditableCell value={item.manager} rowId={item.id} field="manager" onUpdate={handleInlineUpdate} placeholder="-" className="text-center" /></td>}
                          <td className="px-2 py-2 text-center sticky right-0 z-20 bg-white group-hover:bg-stone-50 border-l border-stone-50 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.02)] whitespace-nowrap" style={{ width: '80px' }}>
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(item)} className="p-1.5 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit2 size={14} /></button>
                              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-3 border-t border-stone-100 bg-white flex justify-between items-center">
              <div className="text-xs text-stone-400">Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredData.length)} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="p-2 rounded-lg hover:bg-stone-100 disabled:opacity-30 text-stone-500 transition-all"><ChevronLeft size={16} /></button>
                <div className="flex items-center px-2">
                  <span className="text-xs font-bold text-stone-800">{currentPage}</span>
                  <span className="text-xs text-stone-400 mx-1">/</span>
                  <span className="text-xs text-stone-500">{totalPages}</span>
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="p-2 rounded-lg hover:bg-stone-100 disabled:opacity-30 text-stone-500 transition-all"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        )}

        {/* Other Tab Content */}
        {activeTab === 'deduction_request' && (
          <DeductionRequestSection ref={deductionRequestSectionRef} items={stats.deductionRequestedItems} selectedRowIds={selectedRowIds} toggleRowSelection={toggleRowSelection} toggleAllRows={toggleAllRows} onProcess={handleProcessRequest} onCancelRequest={handleCancelRequest} />
        )}
        {activeTab === 'processed' && (
          <SplitProcessedSection ref={splitProcessedSectionRef} repairItems={stats.repairProcessedItems} deductionItems={stats.deductionProcessedItems} deductionRepairItems={stats.deductionRepairItems} repaymentItems={stats.repaymentItems} defaultOpen={true} selectedRowIds={selectedRowIds} toggleRowSelection={toggleRowSelection} toggleAllRows={toggleAllRows} onRevert={handleRevertDeduction} onRepayment={handleSingleRepayment} />
        )}
        {activeTab === 'overdue' && (
          <OverdueItemsSection ref={overdueSectionRef} items={stats.overdueItems} defaultOpen={true} onEdit={handleEdit} selectedRowIds={selectedRowIds} toggleRowSelection={toggleRowSelection} toggleAllRows={toggleAllRows} onRequestDeduction={handleSingleDeductionRequest} />
        )}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <BottomDeductionSection ref={bottomSectionRef} groupedData={groupedDeductionData} defaultOpen={true} selectedRowIds={selectedRowIds} toggleRowSelection={toggleRowSelection} />
            <FactoryRepairRateSection ref={repairRateSectionRef} data={data} defaultOpen={true} />
          </div>
        )}

        {/* Footer Reset */}
        <div className="flex justify-end pt-12 pb-6 border-t border-stone-200 mt-12">
          <button onClick={handleResetData} className="flex items-center gap-2 px-4 py-2 bg-stone-200 text-stone-500 hover:bg-red-50 hover:text-red-600 rounded-sm text-xs font-bold transition-all">
            <Trash2 size={14} /> 데이터 전체 초기화 (Reset)
          </button>
        </div>
      </main>
    </div>
  );
}
