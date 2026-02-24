import { useMemo } from 'react';

export function useDefectStats(data) {
  return useMemo(() => {
    const totalDefects = data.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
    const totalCost = data.reduce((acc, curr) => acc + (Number(curr.cost || 0) * Number(curr.quantity || 0)), 0);

    const allDeductionItems = data.filter(item => {
      const hasDate = item.deductionDate && item.deductionDate !== 'X' && item.deductionDate.trim() !== '';
      const note = String(item.note || '');
      const defect = String(item.defectContent || '');
      const combined = (note + defect).trim();
      const hasText = combined.includes('차감') && !combined.includes('미차감');
      return hasDate || hasText;
    });

    const repaymentItems = allDeductionItems.filter(item => item.isRepaid);
    const pureDeductionItems = allDeductionItems.filter(item => !item.isRepaid);

    const deductionRepairItems = allDeductionItems.filter(item => {
        return (item.repairDate && item.repairDate !== 'X' && item.repairDate.trim() !== '') ||
               (item.note && String(item.note).includes('차감후수선')) ||
               item.isRepaid;
    });

    const deductionCompleted = pureDeductionItems.length;
    const deductionTotalAmount = pureDeductionItems.reduce((acc, curr) => {
      return acc + (Number(curr.cost || 0) * Number(curr.quantity || 0));
    }, 0);

    const repaymentTotalAmount = repaymentItems.reduce((acc, curr) => {
      return acc + (Number(curr.cost || 0) * Number(curr.quantity || 0));
    }, 0);

    const otherProcessingKeywords = ['수선완료', '자체수선', '수선불가', '폐기', '거래종료', '반품', '교환', '매입', '인수', '수선X', '차감확정'];

    const repairProcessedItems = data.filter(item => {
      if (allDeductionItems.includes(item)) return false;
      const hasDate = (item.repairDate && item.repairDate !== 'X') ||
                      (item.returnDate && item.returnDate !== 'X') ||
                      (item.hubDate && item.hubDate !== 'X');
      const note = String(item.note || '');
      const defect = String(item.defectContent || '');
      const combined = (note + defect).trim();
      const hasKeyword = otherProcessingKeywords.some(kw => combined.includes(kw));
      return hasDate || hasKeyword;
    });

    const processedItems = [...allDeductionItems, ...repairProcessedItems];
    const processedQuantity = processedItems.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
    const processedIdSet = new Set(processedItems.map(i => i.id));

    const deductionRequestedItems = data.filter(item => {
        if (!item.isDeductionRequested) return false;
        if (processedIdSet.has(item.id)) return false;
        return true;
    });
    const deductionRequestedQuantity = deductionRequestedItems.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
    const pendingItems = data.filter(item => {
        if (item.isDeductionRequested) return false;
        return !processedIdSet.has(item.id);
    });
    const pendingQuantity = pendingItems.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
    const undeductedRepairQuantity = repairProcessedItems.filter(item => {
       const text = (item.note || '') + (item.defectContent || '');
       return text.includes('미차감');
    }).reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
    const selfRepairQuantity = repairProcessedItems.filter(item => {
       const text = (item.note || '') + (item.defectContent || '');
       return text.includes('자체수선');
    }).reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
    const overdueItems = pendingItems.filter(item => {
        if (item.isDeductionRequested) return false;
        if (!item.checkDate || item.checkDate === 'X') return false;
        if (typeof item.checkDate !== 'string' && !(typeof item.checkDate === 'object' && item.checkDate.toDate)) return false;
        const check = new Date(item.checkDate);
        if (isNaN(check.getTime())) return false;
        const today = new Date();
        const diffTime = today.getTime() - check.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 30;
    });
    const overdueItemsCount = overdueItems.length;
    const totalCount = data.length;
    const strictRepairCount = data.filter(item => (item.repairDate && item.repairDate.trim() !== '') || (item.note && typeof item.note === 'string' && item.note.includes('수선완료'))).length;
    const totalRepairRate = totalCount === 0 ? 0 : Math.round((strictRepairCount / totalCount) * 100);

    return {
        totalDefects,
        totalCost,
        processedQuantity,
        pendingQuantity,
        deductionCompleted,
        deductionTotalAmount,
        overdueItemsCount,
        overdueItems,
        deductionRequestedItems,
        deductionRequestedQuantity,
        undeductedRepairQuantity,
        selfRepairQuantity,
        processedItems,
        repairProcessedItems,
        deductionProcessedItems: pureDeductionItems,
        repaymentItems,
        repaymentTotalAmount,
        deductionRepairItems,
        totalRepairRate
    };
  }, [data]);
}
