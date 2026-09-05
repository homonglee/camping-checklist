import test from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { createExportFilename, createXlsxBytes, getCheckedExportRows } from '../src/export.js';

const categories = [{ id: 'shelter', name: '주거' }, { id: 'food', name: '식재료' }];
const importance = {
  required: { label: '필수' },
  recommended: { label: '추천' },
};

test('내보내기에는 체크 완료한 항목만 사용자 표시값으로 포함한다', () => {
  const rows = getCheckedExportRows([
    { name: '텐트', category: 'shelter', quantity: 1, importance: 'required', memo: '폴대 확인', checked: true },
    { name: '생수', category: 'food', quantity: 6, importance: 'recommended', memo: '', checked: false },
  ], categories, importance);

  assert.deepEqual(rows, [{ 완료: '완료', 카테고리: '주거', 품목명: '텐트', 수량: 1, 중요도: '필수', 메모: '폴대 확인' }]);
});

test('파일명은 위험한 문자를 제거하고 확장자를 붙인다', () => {
  assert.equal(createExportFilename('평창/가족:캠핑', 'xlsx'), '평창-가족-캠핑-체크완료.xlsx');
  assert.equal(createExportFilename('  ', 'pdf'), '캠핑-체크리스트-체크완료.pdf');
});

test('XLSX 바이트는 메타데이터와 체크 항목을 담은 유효한 워크북 구조다', () => {
  const bytes = createXlsxBytes({
    tripName: '평창 가족 캠핑',
    typeName: '오토캠핑',
    duration: '2박 3일',
    people: 3,
    rows: [{ 완료: '완료', 카테고리: '주거', 품목명: '텐트', 수량: 1, 중요도: '필수', 메모: '폴대 확인' }],
  });
  const files = unzipSync(bytes);
  const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);
  const styles = strFromU8(files['xl/styles.xml']);

  assert.ok(files['[Content_Types].xml']);
  assert.match(styles, /<cellStyle name="Normal"/);
  assert.match(sheet, /평창 가족 캠핑/);
  assert.match(sheet, /오토캠핑/);
  assert.match(sheet, /텐트/);
  assert.match(sheet, /폴대 확인/);
});
