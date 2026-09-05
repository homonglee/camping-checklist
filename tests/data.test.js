import test from 'node:test';
import assert from 'node:assert/strict';
import { MASTER_ITEMS, CATEGORIES, CAMPING_TYPES } from '../src/data.js';

test('Master DB는 150~200개의 고유 품목을 10개 카테고리에 제공한다', () => {
  assert.ok(MASTER_ITEMS.length >= 150 && MASTER_ITEMS.length <= 200, `품목 수: ${MASTER_ITEMS.length}`);
  assert.equal(new Set(MASTER_ITEMS.map(item => item.id)).size, MASTER_ITEMS.length);
  assert.equal(CATEGORIES.length, 10);
  assert.equal(CAMPING_TYPES.length, 5);
  for (const item of MASTER_ITEMS) {
    assert.ok(item.id && item.name && item.category);
    assert.ok(CATEGORIES.some(category => category.id === item.category));
    assert.ok(item.relevance && typeof item.relevance === 'object');
    assert.ok(['fixed', 'person', 'personDay', 'day'].includes(item.quantityRule));
  }
});

test('대표 장비는 캠핑 유형별로 서로 다르게 정의된다', () => {
  const byId = Object.fromEntries(MASTER_ITEMS.map(item => [item.id, item]));
  assert.equal(byId['light-tent'].relevance.backpacking, 'required');
  assert.equal(byId['tent'].relevance.motorhome, 'excluded');
  assert.equal(byId['leveling-block'].relevance.motorhome, 'required');
  assert.equal(byId['car-window-screen'].relevance.car, 'recommended');
});
