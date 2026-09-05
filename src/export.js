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

function appendText(parent, tag, text, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function buildPdfPage(context, rows, pageNumber, pageCount) {
  const page = document.createElement('section');
  page.setAttribute('aria-hidden', 'true');
  Object.assign(page.style, {
    position: 'fixed', left: '-10000px', top: '0', width: '760px', minHeight: '1040px',
    padding: '44px', background: '#fffdf7', color: '#182b25', fontFamily: 'Arial, "Noto Sans KR", sans-serif',
  });
  const eyebrow = appendText(page, 'p', 'CAMPING CHECKLIST · SELECTED ITEMS');
  Object.assign(eyebrow.style, { margin: '0 0 10px', color: '#5e766d', fontSize: '12px', fontWeight: '700', letterSpacing: '1.8px' });
  const heading = appendText(page, 'h1', context.tripName || '캠핑 체크리스트');
  Object.assign(heading.style, { margin: '0 0 8px', fontSize: '30px', lineHeight: '1.25' });
  const meta = appendText(page, 'p', `${context.typeName} · ${context.duration} · ${context.people}명 · 선택 품목 ${context.rows.length}개`);
  Object.assign(meta.style, { margin: '0 0 28px', color: '#4d625a', fontSize: '14px' });
  const table = document.createElement('table');
  Object.assign(table.style, { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '13px' });
  const colgroup = document.createElement('colgroup');
  ['16%', '31%', '9%', '14%', '30%'].forEach(width => { const col = document.createElement('col'); col.style.width = width; colgroup.appendChild(col); });
  table.appendChild(colgroup);
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['카테고리', '품목명', '수량', '중요도', '메모'].forEach(label => {
    const cell = appendText(headerRow, 'th', label);
    Object.assign(cell.style, { padding: '10px 8px', color: '#fff', background: '#173f35', border: '1px solid #173f35', textAlign: 'left' });
  });
  thead.appendChild(headerRow); table.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    [row.카테고리, row.품목명, row.수량, row.중요도, row.메모 || ''].forEach(value => {
      const cell = appendText(tr, 'td', value);
      Object.assign(cell.style, { padding: '9px 8px', border: '1px solid #d9ded6', background: index % 2 ? '#f4f5ef' : '#ffffff', verticalAlign: 'top', wordBreak: 'break-word' });
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody); page.appendChild(table);
  const footer = appendText(page, 'p', `${pageNumber} / ${pageCount} · Camping Checklist`);
  Object.assign(footer.style, { margin: '24px 0 0', color: '#738078', fontSize: '11px', textAlign: 'right' });
  document.body.appendChild(page);
  return page;
}

export async function downloadCheckedPdf(context) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  if (document.fonts?.ready) await document.fonts.ready;
  const chunks = [];
  for (let index = 0; index < context.rows.length; index += 16) chunks.push(context.rows.slice(index, index + 16));
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  for (let index = 0; index < chunks.length; index += 1) {
    const page = buildPdfPage(context, chunks[index], index + 1, chunks.length);
    try {
      const canvas = await html2canvas(page, { scale: 2, backgroundColor: '#fffdf7', logging: false, useCORS: true });
      const maxWidth = 194;
      const maxHeight = 281;
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      if (index > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 8, 8, canvas.width * ratio, canvas.height * ratio, undefined, 'FAST');
    } finally {
      page.remove();
    }
  }
  pdf.save(createExportFilename(context.tripName, 'pdf'));
}
