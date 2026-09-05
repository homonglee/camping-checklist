import { strToU8, zipSync } from 'fflate';

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]+/g;

export function getCheckedExportRows(items, categories, importance) {
  const categoryNames = new Map(categories.map(category => [category.id, category.name]));
  return items
    .filter(item => item.checked)
    .map(item => ({
      포함: '예',
      카테고리: categoryNames.get(item.category) || item.category,
      품목명: item.name,
      수량: item.quantity,
      중요도: importance[item.importance]?.label || item.importance,
      메모: item.memo || '',
    }));
}

export function createExportFilename(tripName, extension) {
  const safeName = String(tripName || '')
    .trim()
    .replace(INVALID_FILENAME_CHARS, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || '캠핑-체크리스트';
  return `${safeName}-준비목록.${extension}`;
}

const xmlEscape = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const textCell = (ref, value, style = 0) => `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
const numberCell = (ref, value, style = 0) => `<c r="${ref}" s="${style}"><v>${Number(value) || 0}</v></c>`;

export function createXlsxBytes({ tripName, typeName, duration, people, rows }) {
  const headers = ['포함', '카테고리', '품목명', '수량', '중요도', '메모'];
  const sheetRows = [
    `<row r="1" ht="28" customHeight="1">${textCell('A1', tripName || '캠핑 체크리스트', 1)}</row>`,
    `<row r="2">${textCell('A2', '캠핑 유형', 2)}${textCell('B2', typeName)}${textCell('C2', '일정', 2)}${textCell('D2', duration)}${textCell('E2', '인원', 2)}${textCell('F2', `${people}명`)}</row>`,
    '<row r="3"></row>',
    `<row r="4">${headers.map((header, index) => textCell(`${String.fromCharCode(65 + index)}4`, header, 3)).join('')}</row>`,
    ...rows.map((row, index) => {
      const rowNumber = index + 5;
      return `<row r="${rowNumber}">${textCell(`A${rowNumber}`, row.포함, 4)}${textCell(`B${rowNumber}`, row.카테고리, 4)}${textCell(`C${rowNumber}`, row.품목명, 4)}${numberCell(`D${rowNumber}`, row.수량, 4)}${textCell(`E${rowNumber}`, row.중요도, 4)}${textCell(`F${rowNumber}`, row.메모, 4)}</row>`;
    }),
  ].join('');
  const lastRow = Math.max(4, rows.length + 4);
  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="10" customWidth="1"/><col min="2" max="2" width="14" customWidth="1"/><col min="3" max="3" width="28" customWidth="1"/><col min="4" max="4" width="10" customWidth="1"/><col min="5" max="5" width="12" customWidth="1"/><col min="6" max="6" width="38" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData><mergeCells count="1"><mergeCell ref="A1:F1"/></mergeCells><autoFilter ref="A4:F${lastRow}"/></worksheet>`;
  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
    'docProps/core.xml': `<?xml version="1.0" encoding="UTF-8"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${xmlEscape(tripName || '캠핑 체크리스트')}</dc:title><dc:creator>Camping Checklist</dc:creator></cp:coreProperties>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="준비목록" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF173F35"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFD9DED6"/></left><right style="thin"><color rgb="FFD9DED6"/></right><top style="thin"><color rgb="FFD9DED6"/></top><bottom style="thin"><color rgb="FFD9DED6"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    'xl/worksheets/sheet1.xml': worksheet,
  };
  return zipSync(Object.fromEntries(Object.entries(files).map(([path, xml]) => [path, strToU8(xml)])), { level: 6 });
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCheckedXlsx(context) {
  const bytes = createXlsxBytes(context);
  saveBlob(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), createExportFilename(context.tripName, 'xlsx'));
}

export function paginatePdfRows(rows, pageSize = 16) {
  const pages = [];
  for (let index = 0; index < rows.length; index += pageSize) pages.push(rows.slice(index, index + pageSize));
  return pages;
}

function fitCanvasLines(ctx, value, maxWidth, maxLines = 2) {
  const characters = [...String(value ?? '')];
  const lines = [];
  let line = '';
  for (const character of characters) {
    const candidate = line + character;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = character;
      if (lines.length === maxLines) break;
    } else {
      line = candidate;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  const consumed = lines.join('').length;
  if (consumed < characters.length && lines.length) {
    let last = lines.at(-1);
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

function drawPdfPage(context, rows, pageNumber, pageCount) {
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('PDF canvas context unavailable');

  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#5e766d';
  ctx.font = '700 22px "Noto Sans KR", Arial, sans-serif';
  ctx.fillText('CAMPING CHECKLIST · SELECTED ITEMS', 70, 82);
  ctx.fillStyle = '#182b25';
  ctx.font = '800 48px "Noto Sans KR", Arial, sans-serif';
  fitCanvasLines(ctx, context.tripName || '캠핑 체크리스트', 1100, 1).forEach((line, index) => ctx.fillText(line, 70, 155 + index * 58));
  ctx.fillStyle = '#4d625a';
  ctx.font = '500 24px "Noto Sans KR", Arial, sans-serif';
  ctx.fillText(`${context.typeName} · ${context.duration} · ${context.people}명 · 선택 품목 ${context.rows.length}개`, 70, 215);

  const left = 70;
  const top = 270;
  const headerHeight = 58;
  const rowHeight = 76;
  const widths = [180, 310, 100, 140, 370];
  const headers = ['카테고리', '품목명', '수량', '중요도', '메모'];
  ctx.fillStyle = '#173f35';
  ctx.fillRect(left, top, widths.reduce((sum, width) => sum + width, 0), headerHeight);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 22px "Noto Sans KR", Arial, sans-serif';
  let x = left;
  headers.forEach((header, index) => {
    ctx.fillText(header, x + 14, top + 37);
    x += widths[index];
  });

  ctx.font = '500 20px "Noto Sans KR", Arial, sans-serif';
  rows.forEach((row, rowIndex) => {
    const y = top + headerHeight + rowIndex * rowHeight;
    ctx.fillStyle = rowIndex % 2 ? '#f4f5ef' : '#ffffff';
    ctx.fillRect(left, y, 1100, rowHeight);
    const values = [row.카테고리, row.품목명, row.수량, row.중요도, row.메모 || ''];
    x = left;
    values.forEach((value, columnIndex) => {
      ctx.strokeStyle = '#d9ded6';
      ctx.strokeRect(x, y, widths[columnIndex], rowHeight);
      ctx.fillStyle = '#182b25';
      const lines = fitCanvasLines(ctx, value, widths[columnIndex] - 28, 2);
      const firstY = y + (lines.length > 1 ? 27 : 44);
      lines.forEach((line, lineIndex) => ctx.fillText(line, x + 14, firstY + lineIndex * 27));
      x += widths[columnIndex];
    });
  });

  ctx.fillStyle = '#738078';
  ctx.font = '500 18px "Noto Sans KR", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${pageNumber} / ${pageCount} · Camping Checklist`, 1170, 1655);
  ctx.textAlign = 'left';
  return canvas;
}

export async function downloadCheckedPdf(context) {
  const { jsPDF } = await import('jspdf');
  if (document.fonts?.ready) await document.fonts.ready;
  const pages = paginatePdfRows(context.rows);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  pages.forEach((rows, index) => {
    const canvas = drawPdfPage(context, rows, index + 1, pages.length);
    if (index > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 8, 8, 194, 274.3, undefined, 'FAST');
    canvas.width = 1;
    canvas.height = 1;
  });
  pdf.save(createExportFilename(context.tripName, 'pdf'));
}
