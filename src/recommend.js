import { MASTER_ITEMS, CATEGORIES } from './data.js';

export function formatTripDuration(nights) {
  const value = Math.max(0, Number(nights) || 0);
  return value === 0 ? '당일' : `${value}박 ${value + 1}일`;
}

export function calculateQuantity(rule, nights, people) {
  const days = Math.max(1, Number(nights) + 1);
  const campers = Math.max(1, Number(people) || 1);
  if (rule === 'person') return campers;
  if (rule === 'personDay') return campers * days;
  if (rule === 'day') return days;
  return 1;
}

export function generateChecklist({ type, nights = 1, people = 1, categories = CATEGORIES.map(c => c.id), includeOptional = false }) {
  const enabled = new Set(categories);
  const rank = { required: 0, recommended: 1, optional: 2 };
  let candidates = MASTER_ITEMS
    .filter(item => enabled.has(item.category))
    .filter(item => item.relevance[type] && item.relevance[type] !== 'excluded');

  if (!includeOptional) {
    candidates = CATEGORIES.flatMap(category => {
      const group = candidates.filter(item => item.category === category.id);
      const required = group.filter(item => item.relevance[type] === 'required');
      const recommended = group.filter(item => item.relevance[type] === 'recommended');
      return [...required, ...recommended.slice(0, Math.max(0, 6 - required.length))];
    });
  }

  return candidates
    .map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      importance: item.relevance[type],
      quantity: calculateQuantity(item.quantityRule, nights, people),
      checked: true,
      memo: '',
      custom: false,
    }))
    .sort((a, b) => rank[a.importance] - rank[b.importance] || a.category.localeCompare(b.category));
}

export function checklistProgress(items) {
  const total = items.length;
  const done = items.filter(item => item.checked).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}
