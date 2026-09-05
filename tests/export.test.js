import test from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { createExportFilename, createXlsxBytes, getCheckedExportRows, paginatePdfRows } from '../src/export.js';

const categories = [{ id: 'shelter', name: '주거' }, { id: 'food', name: '식재료' }];
const importance = {
  required: { label: '필수' },
  recommended: { label: '추천' },
};

test('내보내기에는 선택한 항목만 사용자 표시값으로 포함한다', () => {
  const rows = getCheckedExportRows([
    { name: '텐트', category: 'shelter', quantity: 1, importance: 'required', memo: '폴대 확인', checked: true },
    { name: '생수', category: 'food', quantity: 6, importance: 'recommended', memo: '', checked: false },
  ], categories, importance);

  assert.deepEqual(rows, [{ 포함: '예', 카테고리: '주거', 품목명: '텐트', 수량: 1, 중요도: '필수', 메모: '폴대 확인' }]);
});

test('파일명은 위험한 문자를 제거하고 확장자를 붙인다', () => {
  assert.equal(createExportFilename('평창/가족:캠핑', 'xlsx'), '평창-가족-캠핑-준비목록.xlsx');
  assert.equal(createExportFilename('  ', 'pdf'), '캠핑-체크리스트-준비목록.pdf');
});

test('PDF 행은 모바일 브라우저 메모리를 제한하도록 페이지별로 나눈다', () => {
  const rows = Array.from({ length: 33 }, (_, index) => ({ 품목명: `품목 ${index + 1}` }));
  const pages = paginatePdfRows(rows, 16);

  assert.deepEqual(pages.map(page => page.length), [16, 16, 1]);
  assert.equal(pages[0][0].품목명, '품목 1');
  assert.equal(pages[2][0].품목명, '품목 33');
});

test('XLSX 바이트는 메타데이터와 선택 항목을 담은 유효한 워크북 구조다', () => {
  const bytes = createXlsxBytes({
    tripName: '평창 가족 캠핑',
    typeName: '오토캠핑',
    duration: '2박 3일',
    people: 3,
    rows: [{ 포함: '예', 카테고리: '주거', 품목명: '텐트', 수량: 1, 중요도: '필수', 메모: '폴대 확인' }],
  });
  const files = unzipSync(bytes);
  const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);
  const styles = strFromU8(files['xl/styles.xml']);
  const workbook = strFromU8(files['xl/workbook.xml']);

  assert.ok(files['[Content_Types].xml']);
  assert.match(workbook, /name="준비목록"/);
  assert.match(styles, /<cellStyle name="Normal"/);
  assert.match(sheet, /평창 가족 캠핑/);
  assert.match(sheet, /오토캠핑/);
  assert.match(sheet, /텐트/);
  assert.match(sheet, /폴대 확인/);
});
