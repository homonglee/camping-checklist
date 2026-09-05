import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { strFromU8, unzipSync } from 'fflate';
import { CATEGORIES } from '../src/data.js';

const executablePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, executablePath });
const errors = [];
try {
  const requestedAssets = [];
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('request', request => requestedAssets.push(request.url()));
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const response = await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  assert.match(await page.title(), /캠핑 체크리스트/);
  assert.equal(await page.locator('[data-testid="camp-type"]').count(), 5);
  await page.getByRole('button', { name: /오토캠핑/ }).click();
  await page.getByRole('button', { name: '숙박 늘리기' }).click();
  await page.getByRole('button', { name: '인원 늘리기' }).click();
  await page.getByRole('button', { name: /다음/ }).click();
  assert.match(await page.getByRole('heading', { level: 1 }).textContent(), /무엇을/);
  await page.getByRole('button', { name: /맞춤 체크리스트 만들기/ }).click();
  assert.ok(await page.locator('[data-testid="check-item"]').count() > 30);
  const checklistItems = page.locator('[data-testid="check-item"]');
  const totalItems = await checklistItems.count();
  const excludedName = await checklistItems.first().locator('.item-main strong').textContent();
  const includedName = await checklistItems.nth(1).locator('.item-main strong').textContent();
  assert.equal(await checklistItems.locator('input[type="checkbox"]:checked').count(), totalItems);
  assert.match(await page.getByTestId('progress-copy').textContent(), new RegExp(`${totalItems} \\/ ${totalItems}`));
  await checklistItems.first().locator('input[type="checkbox"]').uncheck();
  assert.match(await checklistItems.first().getAttribute('class'), /excluded/);
  assert.match(await page.getByTestId('progress-copy').textContent(), new RegExp(`${totalItems - 1} \\/ ${totalItems}`));
  const xlsxPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /XLSX/ }).click();
  const xlsxDownload = await xlsxPromise;
  assert.match(xlsxDownload.suggestedFilename(), /준비목록\.xlsx$/);
  await xlsxDownload.saveAs('artifacts/e2e-checked.xlsx');
  const xlsxFiles = unzipSync(await readFile('artifacts/e2e-checked.xlsx'));
  const sheetXml = strFromU8(xlsxFiles['xl/worksheets/sheet1.xml']);
  assert.match(sheetXml, /포함/);
  assert.ok(sheetXml.includes(`>${includedName}</t>`));
  assert.equal(sheetXml.includes(`>${excludedName}</t>`), false);

  const pdfPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /PDF/ }).click();
  const pdfDownload = await pdfPromise;
  assert.match(pdfDownload.suggestedFilename(), /준비목록\.pdf$/);
  await pdfDownload.saveAs('artifacts/e2e-checked.pdf');
  const pdfBytes = await readFile('artifacts/e2e-checked.pdf');
  assert.equal(pdfBytes.subarray(0, 5).toString(), '%PDF-');
  assert.ok(pdfBytes.length > 10000);
  assert.equal(requestedAssets.some(url => /html2canvas/i.test(url)), false, 'PDF 생성 중 html2canvas를 불러오면 안 됩니다');

  const categoryBlocks = page.locator('.category-block');
  assert.equal(await page.getByTestId('category-add').count(), await categoryBlocks.count());
  for (const category of CATEGORIES) {
    await page.getByRole('button', { name: `${category.name} 준비물 추가` }).click();
    assert.equal(await page.getByRole('dialog').locator('select').inputValue(), category.id);
    await page.getByRole('button', { name: '닫기' }).click();
  }
  await page.getByRole('button', { name: '여가·기타 준비물 추가' }).click();
  assert.equal(await page.getByRole('dialog').locator('select').inputValue(), 'leisure');
  await page.getByLabel('품목명').fill('별 관측 망원경');
  await page.getByLabel('수량').fill('2');
  await page.getByRole('button', { name: '추가하기' }).click();
  const customItem = page.locator('[data-testid="check-item"]').filter({ hasText: '별 관측 망원경' });
  assert.equal(await customItem.locator('input[type="checkbox"]').isChecked(), true);
  await page.getByText('별 관측 망원경').click();
  await page.getByLabel('메모').fill('삼각대 포함');
  await page.getByRole('button', { name: '변경사항 저장' }).click();
  assert.ok(await page.getByText('삼각대 포함').isVisible());
  await page.getByRole('button', { name: /체크리스트 저장/ }).click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.ok(await page.getByText('별 관측 망원경').isVisible());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  desktop.on('pageerror', e => errors.push(String(e)));
  desktop.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await desktop.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await desktop.getByRole('button', { name: /오토캠핑/ }).click();
  await desktop.getByRole('button', { name: /다음/ }).click();
  await desktop.getByRole('button', { name: /맞춤 체크리스트 만들기/ }).click();
  const desktopItems = desktop.locator('[data-testid="check-item"]');
  assert.equal(await desktopItems.locator('input[type="checkbox"]:checked').count(), await desktopItems.count());
  assert.ok(await desktop.getByRole('region', { name: '선택한 준비물 파일 저장' }).isVisible());
  assert.equal(
    await desktop.locator('.bottom-actions').evaluate(element => Boolean(element.querySelector('.footer-export'))),
    true,
    'PDF/XLSX 저장 영역은 체크리스트 저장 버튼 바로 아래에 있어야 합니다',
  );
  assert.equal(await desktop.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: 'artifacts/mobile-checklist.png', fullPage: true });
  await desktop.screenshot({ path: 'artifacts/desktop-checklist.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('E2E_OK: 생성, 기본 전체 선택, 불필요 항목 해제, 10개 카테고리별 준비물 추가, PDF/XLSX 내보내기, 편집, 저장, 새로고침, 모바일/데스크톱 반응형 검증 완료');
} finally {
  await browser.close();
}
