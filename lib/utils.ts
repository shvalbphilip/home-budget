import { Item, Category } from './types';

export const fmt = (n: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);

export const pct = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 100);

export function getCategoryStats(items: Item[], categories: Category[]) {
  return categories.map((cat) => {
    const catItems = items.filter((i) => i.categoryId === cat.id);
    const spent = catItems
      .filter((i) => i.status === 'נרכש' || i.status === 'בבעלותי')
      .reduce((sum, i) => sum + i.actualPrice * i.quantity, 0);
    const total = catItems.length;
    const done = catItems.filter((i) => i.status === 'נרכש' || i.status === 'בבעלותי').length;
    const missing = catItems.filter((i) => i.status === 'חסר' || i.status === 'לרכישה').length;
    const completion = total === 0 ? 0 : pct(done, total);
    const budgetUsed = pct(spent, cat.plannedBudget);
    const isOverBudget = cat.plannedBudget > 0 && spent > cat.plannedBudget;
    const noBudget = cat.plannedBudget === 0 && total > 0;
    return { ...cat, spent, total, done, missing, completion, budgetUsed, isOverBudget, noBudget };
  });
}

export function getDashboardStats(items: Item[], totalBudget: number, categories: Category[]) {
  const totalSpent = items
    .filter((i) => i.status === 'נרכש' || i.status === 'בבעלותי')
    .reduce((s, i) => s + i.actualPrice * i.quantity, 0);
  const totalMissing = items.filter((i) => i.status === 'חסר' || i.status === 'לרכישה').length;
  const totalPurchased = items.filter((i) => i.status === 'נרכש').length;
  const totalOwned = items.filter((i) => i.status === 'בבעלותי').length;
  const remaining = totalBudget - totalSpent;
  const budgetUsedPct = pct(totalSpent, totalBudget);
  const criticalMissing = items.filter(
    (i) => (i.status === 'חסר' || i.status === 'לרכישה') && i.isEssential && i.priority === 'גבוהה'
  ).length;
  const overBudgetCats = categories.filter((cat) => {
    const spent = items
      .filter((i) => (i.status === 'נרכש' || i.status === 'בבעלותי') && i.categoryId === cat.id)
      .reduce((s, i) => s + i.actualPrice * i.quantity, 0);
    return cat.plannedBudget > 0 && spent > cat.plannedBudget;
  });
  const noBudgetCats = categories.filter((cat) => {
    const hasItems = items.some((i) => i.categoryId === cat.id);
    return cat.plannedBudget === 0 && hasItems;
  });
  return {
    totalSpent, totalMissing, totalPurchased, totalOwned,
    remaining, budgetUsedPct, criticalMissing, overBudgetCats, noBudgetCats,
  };
}
