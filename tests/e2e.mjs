import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { strFromU8, unzipSync } from 'fflate';

const executablePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, executablePath });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
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
  await page.locator('[data-testid="check-item"] input[type="checkbox"]').first().check();
  assert.match(await page.getByTestId('progress-copy').textContent(), /1 \/ /);
  const xlsxPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /XLSX/ }).click();
  const xlsxDownload = await xlsxPromise;
  assert.match(xlsxDownload.suggestedFilename(), /체크완료\.xlsx$/);
  await xlsxDownload.saveAs('artifacts/e2e-checked.xlsx');
  const xlsxFiles = unzipSync(await readFile('artifacts/e2e-checked.xlsx'));
  const sheetXml = strFromU8(xlsxFiles['xl/worksheets/sheet1.xml']);
  assert.match(sheetXml, /완료/);
  assert.match(sheetXml, /텐트/);

  const pdfPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /PDF/ }).click();
  const pdfDownload = await pdfPromise;
  assert.match(pdfDownload.suggestedFilename(), /체크완료\.pdf$/);
  await pdfDownload.saveAs('artifacts/e2e-checked.pdf');
  const pdfBytes = await readFile('artifacts/e2e-checked.pdf');
  assert.equal(pdfBytes.subarray(0, 5).toString(), '%PDF-');
  assert.ok(pdfBytes.length > 10000);

  await page.getByRole('button', { name: /준비물 추가/ }).click();
  await page.getByLabel('품목명').fill('별 관측 망원경');
  await page.getByLabel('수량').fill('2');
  await page.getByRole('button', { name: '추가하기' }).click();
  await page.getByText('별 관측 망원경').click();
  await page.getByLabel('메모').fill('삼각대 포함');
  await page.getByRole('button', { name: '변경사항 저장' }).click();
  assert.ok(await page.getByText('삼각대 포함').isVisible());
  await page.getByRole('button', { name: /체크리스트 저장/ }).click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.ok(await page.getByText('별 관측 망원경').isVisible());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await desktop.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  assert.equal(await desktop.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: 'artifacts/mobile-checklist.png', fullPage: true });
  await desktop.screenshot({ path: 'artifacts/desktop-checklist.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('E2E_OK: 생성, 체크, 추가, 편집, 저장, 새로고침, 모바일/데스크톱 반응형 검증 완료');
} finally {
  await browser.close();
}
