export function isOverdue(checkDate, repairDate, deductionDate, returnDate, note) {
  if (!checkDate || checkDate === 'X') return false;
  if (repairDate || deductionDate || returnDate) return false;
  if (note && (typeof note === 'string' && (note.includes('완료') || note.includes('불가') || note.includes('폐기')))) return false;
  let checkTime;
  if (typeof checkDate === 'object' && checkDate.toDate) { checkTime = checkDate.toDate().getTime(); }
  else if (typeof checkDate === 'string') { checkTime = new Date(checkDate).getTime(); }
  else { return false; }
  const today = new Date().getTime();
  if (checkTime > today) return false;
  const diffTime = today - checkTime;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 30;
}
