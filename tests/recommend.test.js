import test from 'node:test';
import assert from 'node:assert/strict';
import { generateChecklist, formatTripDuration } from '../src/recommend.js';

test('2명 2박3일 오토캠핑 목록의 기간·인원 수량을 계산한다', () => {
  const list = generateChecklist({ type: 'auto', nights: 2, people: 2, categories: ['food','clothing','tools'] });
  assert.equal(list.find(item => item.id === 'water').quantity, 6);
  assert.equal(list.find(item => item.id === 'underwear').quantity, 6);
  assert.equal(list.find(item => item.id === 'trash-bag').quantity, 3);
  assert.equal(formatTripDuration(2), '2박 3일');
});

test('모터홈에서는 텐트를 제외하고 전용 필수 장비를 추천한다', () => {
  const list = generateChecklist({ type: 'motorhome', nights: 1, people: 2, categories: ['shelter','tools','power'] });
  assert.equal(list.some(item => item.id === 'tent'), false);
  assert.equal(list.find(item => item.id === 'leveling-block').importance, 'required');
  assert.equal(list.find(item => item.id === 'fresh-water-hose').importance, 'required');
  assert.equal(list.find(item => item.id === 'site-power-cable').importance, 'required');
});

test('일반 추천은 Master DB 전체가 아니라 실제 사용 가능한 분량으로 압축한다', () => {
  const list = generateChecklist({ type: 'auto', nights: 2, people: 2, categories: ['shelter','sleep','cooking','food','clothing','hygiene','safety','power','tools','leisure'] });
  assert.ok(list.length >= 40 && list.length <= 80, `생성 품목 수: ${list.length}`);
  assert.ok(list.some(item => item.id === 'tent'));
  assert.ok(list.some(item => item.id === 'water'));
});

test('선택 품목은 기본 제외하고 설정 시 포함하며 모든 생성 항목은 편집 가능한 사본이다', () => {
  const base = { type: 'backpacking', nights: 0, people: 1, categories: ['leisure'] };
  const normal = generateChecklist(base);
  const expanded = generateChecklist({ ...base, includeOptional: true });
  assert.ok(expanded.length > normal.length);
  assert.ok(expanded.every(item => item.checked === false && item.memo === ''));
  expanded[0].name = '변경';
  assert.notEqual(normal[0]?.name, '변경');
});
