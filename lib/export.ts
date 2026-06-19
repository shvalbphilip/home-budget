import * as XLSX from 'xlsx';
import { Item, Category, ExportedState } from './types';
import { getCategoryStats } from './utils';

const shekelFmt = '₪#,##0';

function autoWidth(ws: XLSX.WorkSheet, data: unknown[][]) {
  const colWidths = (data[0] as unknown[])?.map((_, ci) =>
    Math.max(...data.map((row) => String((row as unknown[])[ci] ?? '').length), 10)
  ) ?? [];
  ws['!cols'] = colWidths.map((w) => ({ wch: Math.min(w + 4, 40) }));
}

// ── Excel export ────────────────────────────────────────────────────────────
export function exportToExcel(items: Item[], totalBudget: number, categories: Category[]) {
  const wb = XLSX.utils.book_new();
  const catStats = getCategoryStats(items, categories);

  // Sheet 1: Full Inventory
  const invHeaders = ['שם פריט', 'קטגוריה', 'סטטוס', 'עדיפות', 'כמות', 'מחיר משוער', 'מחיר בפועל', 'סה״כ משוער', 'סה״כ בפועל', 'חנות', 'חיוני', 'תאריך רכישה', 'קישור', 'הערות'];
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const invRows = items.map((i) => [
    i.name, catMap[i.categoryId] ?? '—', i.status, i.priority, i.quantity,
    i.estimatedPrice, i.actualPrice,
    i.estimatedPrice * i.quantity, i.actualPrice * i.quantity,
    i.store, i.isEssential ? 'כן' : 'לא',
    i.purchaseDate || '', i.link || '', i.notes || '',
  ]);
  const invData = [invHeaders, ...invRows];
  const ws1 = XLSX.utils.aoa_to_sheet(invData);
  autoWidth(ws1, invData);
  for (let r = 1; r <= invRows.length; r++) {
    ['F', 'G', 'H', 'I'].forEach((col) => {
      const ref = col + (r + 1);
      if (ws1[ref]) ws1[ref].z = shekelFmt;
    });
  }
  XLSX.utils.book_append_sheet(wb, ws1, 'מלאי מלא');

  // Sheet 2: Missing Items
  const missing = items.filter((i) => i.status === 'חסר' || i.status === 'לרכישה');
  const misHeaders = ['שם פריט', 'קטגוריה', 'סטטוס', 'עדיפות', 'כמות', 'מחיר משוער', 'סה״כ משוער', 'חיוני', 'חנות', 'הערות'];
  const misRows = missing.map((i) => [
    i.name, catMap[i.categoryId] ?? '—', i.status, i.priority, i.quantity,
    i.estimatedPrice, i.estimatedPrice * i.quantity,
    i.isEssential ? 'כן' : 'לא', i.store, i.notes,
  ]);
  const totalMisEst = missing.reduce((s, i) => s + i.estimatedPrice * i.quantity, 0);
  const misData = [misHeaders, ...misRows, ['', '', '', '', 'סה״כ', '', totalMisEst, '', '', '']];
  const ws2 = XLSX.utils.aoa_to_sheet(misData);
  autoWidth(ws2, misData);
  XLSX.utils.book_append_sheet(wb, ws2, 'פריטים חסרים');

  // Sheet 3: Budget Summary
  const spent = items.filter((i) => i.status === 'נרכש' || i.status === 'בבעלותי').reduce((s, i) => s + i.actualPrice * i.quantity, 0);
  const sumData: unknown[][] = [
    ['סיכום תקציב', '', ''],
    ['', '', ''],
    ['תקציב כולל', totalBudget, ''],
    ['הוצאה בפועל', spent, ''],
    ['נותר בתקציב', totalBudget - spent, ''],
    ['אחוז ניצול', totalBudget > 0 ? Math.round((spent / totalBudget) * 100) / 100 : 0, ''],
    ['', '', ''],
    ['פריטים שנרכשו', items.filter((i) => i.status === 'נרכש').length, ''],
    ['פריטים בבעלות', items.filter((i) => i.status === 'בבעלותי').length, ''],
    ['פריטים חסרים', items.filter((i) => i.status === 'חסר' || i.status === 'לרכישה').length, ''],
    ['פריטים אופציונליים', items.filter((i) => i.status === 'אופציונלי').length, ''],
    ['סה״כ פריטים', items.length, ''],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(sumData);
  if (ws3['B3']) ws3['B3'].z = shekelFmt;
  if (ws3['B4']) ws3['B4'].z = shekelFmt;
  if (ws3['B5']) ws3['B5'].z = shekelFmt;
  if (ws3['B6']) ws3['B6'].z = '0%';
  ws3['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'סיכום תקציב');

  // Sheet 4: Category Breakdown
  const catHeaders = ['קטגוריה', 'אמוג׳י', 'תקציב מתוכנן', 'הוצאה בפועל', 'תקציב שנותר', 'אחוז ניצול', 'סה״כ פריטים', 'נרכש', 'חסר', 'השלמת חדר'];
  const catRows = catStats.map((c) => [
    c.name, c.emoji, c.plannedBudget, c.spent, c.plannedBudget - c.spent,
    c.plannedBudget > 0 ? c.budgetUsed / 100 : '',
    c.total, c.done, c.missing, c.completion / 100,
  ]);
  const catData = [catHeaders, ...catRows];
  const ws4 = XLSX.utils.aoa_to_sheet(catData);
  for (let r = 1; r <= catRows.length; r++) {
    ['C', 'D', 'E'].forEach((col) => { const ref = col + (r + 1); if (ws4[ref]) ws4[ref].z = shekelFmt; });
    ['F', 'J'].forEach((col) => { const ref = col + (r + 1); if (ws4[ref] && ws4[ref].v !== '') ws4[ref].z = '0%'; });
  }
  autoWidth(ws4, catData);
  XLSX.utils.book_append_sheet(wb, ws4, 'פירוט קטגוריות');

  XLSX.writeFile(wb, `מעבר-דירה-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ── JSON backup ──────────────────────────────────────────────────────────────
export function exportToJSON(totalBudget: number, categories: Category[], items: Item[]): ExportedState {
  return {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    totalBudget,
    categories,
    items,
  };
}

export function downloadJSON(data: ExportedState) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `מעבר-דירה-גיבוי-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportedJSON(text: string): ExportedState {
  const data = JSON.parse(text);
  if (!data.version || !Array.isArray(data.categories) || !Array.isArray(data.items)) {
    throw new Error('קובץ הגיבוי אינו תקין');
  }
  return data as ExportedState;
}
