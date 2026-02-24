export function parseAndValidateCSV(text) {
  const arr = [];
  let quote = false;
  let col = 0, row = 0;

  for (let c = 0; c < text.length; c++) {
    let cc = text[c], nc = text[c+1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col] || '';
    if (cc === '"') {
      if (quote && nc === '"') { arr[row][col] += cc; ++c; }
      else { quote = !quote; }
      continue;
    }
    if (cc === ',' && !quote) { ++col; continue; }
    if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }
    if (cc === '\n' && !quote) { ++row; col = 0; continue; }
    if (cc === '\r' && !quote) { ++row; col = 0; continue; }
    arr[row][col] += cc;
  }

  const parsedRows = arr;
  let skipCounts = {
    total: parsedRows.length,
    header: 0,
    empty: 0,
    separator: 0,
    repeatedHeader: 0,
    missingData: 0,
    merged: 0
  };

  let skippedItemsList = [];
  let finalItems = [];

  if (parsedRows.length > 0) skipCounts.header++;

  parsedRows.slice(1).forEach((cols, index) => {
    const rowNumber = index + 2;
    const cleanCols = cols.map(c => c.trim());
    const rowString = cleanCols.join(', ');

    if (cleanCols.every(c => c === '')) {
      skipCounts.empty++;
      return;
    }

    const separators = ['날짜구분선', '날짜 구분선', '-----', '₩01ER'];
    if (separators.some(sep => rowString.includes(sep))) {
      skipCounts.separator++;
      skippedItemsList.push({ line: rowNumber, reason: '구분선/메타데이터', content: rowString });
      return;
    }

    const headerKeywords = ['담당팀', '불량확인일', '바코드', '불량내용', '제품원가', '상품명', '(경리팀작성)', '수선여부'];
    let headerMatchCount = 0;
    headerKeywords.forEach(kw => { if (rowString.includes(kw)) headerMatchCount++; });
    if (headerMatchCount >= 2) {
      skipCounts.repeatedHeader++;
      skippedItemsList.push({ line: rowNumber, reason: '중복된 헤더', content: rowString });
      return;
    }

    const vendor = cleanCols[3] || '';
    const defectContent = cleanCols[4] || '';

    const noteContent = cleanCols[16] || '';
    const manager = cleanCols[17] || '';

    const hasImportantNote =
      noteContent.includes('수선') || noteContent.includes('차감') ||
      noteContent.includes('불가') || noteContent.includes('확정') || noteContent.includes('폐기');
    const hasBasicData = vendor || defectContent;

    if (!hasBasicData && !hasImportantNote) {
       const looseText = cleanCols.filter(c => c.length > 0).join(' ');
       if (looseText.length > 0 && finalItems.length > 0) {
         const prevItem = finalItems[finalItems.length - 1];
         prevItem.note = (prevItem.note ? prevItem.note + ' ' : '') + looseText;
         skipCounts.merged++;
         skippedItemsList.push({ line: rowNumber, reason: '이전 행 비고에 병합됨 (Smart Merge)', content: looseText });
         return;
       } else {
         skipCounts.missingData++;
         skippedItemsList.push({ line: rowNumber, reason: '필수 데이터 미비', content: rowString });
         return;
       }
    }

    let dateString = cleanCols[1] || '';

    const fullDateMatch = dateString.match(/(\d{4})[\-\.\년\s/]+\s*(\d{1,2})[\-\.\월\s/]+\s*(\d{1,2})/);

    if (fullDateMatch) {
       const year = fullDateMatch[1];
       const month = fullDateMatch[2].padStart(2, '0');
       const day = fullDateMatch[3].padStart(2, '0');
       dateString = `${year}-${month}-${day}`;
    } else if (dateString.includes('월') && dateString.includes('일')) {
       const parts = dateString.match(/(\d+)월\s*(\d+)일/);
       if (parts) {
         const year = new Date().getFullYear().toString();
         const month = parts[1].padStart(2, '0');
         const day = parts[2].padStart(2, '0');
         dateString = `${year}-${month}-${day}`;
       }
    }

    finalItems.push({
      checkDate: dateString,
      barcodeDate: cleanCols[2] || 'X',
      vendor: vendor,
      defectContent: defectContent,
      cost: parseFloat((cleanCols[5] || '0').replace(/[^0-9.-]+/g,"")) || 0,
      productName: cleanCols[6] || '',
      color: cleanCols[7] || '',
      size: cleanCols[8] || '',
      quantity: parseInt(cleanCols[9] || '1', 10) || 1,
      source: cleanCols[10] || 'ER',
      releaseDate: cleanCols[11] || '',
      repairDate: cleanCols[12] || '',
      deductionDate: cleanCols[13] || '',
      returnDate: cleanCols[14] || '',
      hubDate: cleanCols[15] || '',
      note: noteContent,
      manager: manager
    });
  });

  return { finalItems, skippedItemsList, skipCounts };
}
