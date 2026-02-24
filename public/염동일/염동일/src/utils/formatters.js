export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '0';
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Number(amount));
}

export function formatDate(value) {
  if (!value || value === 'X' || value === '') return '';
  if (typeof value === 'object' && value.toDate) {
    const date = value.toDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value === 'object') return '';
  let strVal = String(value).trim();
  if (/^\d{8}$/.test(strVal)) {
      const year = strVal.substring(0, 4);
      const month = strVal.substring(4, 6);
      const day = strVal.substring(6, 8);
      return `${year}-${month}-${day}`;
  }
  const fullDateMatch = strVal.match(/^(\d{4})[\.\-\/\s년]+(\d{1,2})[\.\-\/\s월]+(\d{1,2})[\s일]*$/) || strVal.match(/^(\d{4})[\.\-\/\s]+(\d{1,2})[\.\-\/\s]+(\d{1,2})/);
  if (fullDateMatch) {
      const year = fullDateMatch[1];
      const month = fullDateMatch[2].padStart(2, '0');
      const day = fullDateMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
  }
  const monthDayMatch = strVal.match(/^(\d{1,2})[\.\-\/\s월]+(\d{1,2})[\s일]*$/);
  if (monthDayMatch) {
      let year = new Date().getFullYear();
      const month = monthDayMatch[1].padStart(2, '0');
      const day = monthDayMatch[2].padStart(2, '0');
      const today = new Date();
      const inputDate = new Date(year, parseInt(month) - 1, parseInt(day));
      if (inputDate > today) { year = year - 1; }
      return `${year}-${month}-${day}`;
  }
  return strVal;
}

export function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
