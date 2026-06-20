import * as XLSX from 'xlsx';
import { Room, PlanItem, StyleProfile, ApartmentPlan, CONTRACTOR_CATEGORIES } from './types';
import {
  getRoomStats, getPlanSummary, roomAreaM2,
  itemPlanned, itemActual, itemPaid, itemRemaining, itemPaymentStatus,
} from './geometry';

const shekelFmt = '₪#,##0';

function autoWidth(ws: XLSX.WorkSheet, data: unknown[][]) {
  const cols = (data[0] as unknown[])?.map((_, ci) =>
    Math.max(...data.map((row) => String((row as unknown[])[ci] ?? '').length), 10)
  ) ?? [];
  ws['!cols'] = cols.map((w) => ({ wch: Math.min(w + 4, 44) }));
}

function moneyCols(ws: XLSX.WorkSheet, rows: number, cols: string[]) {
  for (let r = 1; r <= rows; r++) {
    cols.forEach((c) => { const ref = c + (r + 1); if (ws[ref]) ws[ref].z = shekelFmt; });
  }
}

/** Export the apartment plan to a multi-sheet Excel workbook (full budget system). */
export function exportPlanToExcel(rooms: Room[], items: PlanItem[], style: StyleProfile) {
  const wb = XLSX.utils.book_new();
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? '—';
  const summary = getPlanSummary(rooms, items, style.budget);

  const itemRow = (i: PlanItem) => [
    i.name, roomName(i.roomId), i.category, i.status, i.priority, i.quantity,
    itemPlanned(i), itemActual(i), itemPaid(i), itemRemaining(i), itemPaymentStatus(i),
    i.supplier, i.store, i.link, i.notes,
  ];
  const itemHeaders = ['פריט', 'חדר', 'קטגוריה', 'סטטוס', 'עדיפות', 'כמות', 'מתוכנן', 'בפועל', 'שולם', 'נשאר', 'סטטוס תשלום', 'ספק', 'חנות', 'קישור', 'הערות'];
  const moneyAt = (ws: XLSX.WorkSheet, n: number, cols: string[]) => moneyCols(ws, n, cols);

  // Sheet 1: סיכום כללי
  const sumData: unknown[][] = [
    ['סיכום כללי', ''], ['', ''],
    ['סגנון', style.style || '—'],
    ['תקציב כולל (אופציונלי)', style.budget],
    ['עלות כוללת בפועל', summary.totalActual],
    ['  מתוכה ריהוט ומוצרים', summary.furnitureTotal],
    ['  מתוכה קבלן ושיפוץ', summary.contractorTotal],
    ['שולם עד כה', summary.totalPaid],
    ['נשאר לשלם', summary.totalRemaining],
    ['נותר בתקציב', summary.budgetDiff],
    ['ציון בריאות תקציב', summary.healthScore + ' / 100'],
    ['', ''],
    ['מספר חדרים', summary.totalRooms],
    ['שטח כולל (מ״ר)', summary.totalAreaM2],
    ['מספר פריטים', summary.totalItems],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(sumData);
  ['B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'].forEach((ref) => { if (ws1[ref]) ws1[ref].z = shekelFmt; });
  ws1['!cols'] = [{ wch: 26 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'סיכום כללי');

  // Sheet 2: תקציב לפי חדרים
  const roomData: unknown[][] = [
    ['חדר', 'עדיפות', 'תקציב מתוכנן', 'עלות בפועל', 'שולם', 'נשאר לשלם', 'הפרש', 'סטטוס', 'מ״ר', 'הערות'],
    ...rooms.map((r) => {
      const s = getRoomStats(r, items);
      return [r.name, r.priority, s.plannedBudget, s.actualCost, s.paid, s.remaining, s.diff, s.budgetStatus, roomAreaM2(r), r.notes];
    }),
    ['סה״כ', '', rooms.reduce((a, r) => a + (r.plannedBudget || 0), 0), summary.totalActual, summary.totalPaid, summary.totalRemaining, '', '', summary.totalAreaM2, ''],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(roomData);
  autoWidth(ws2, roomData);
  moneyAt(ws2, rooms.length + 1, ['C', 'D', 'E', 'F', 'G']);
  XLSX.utils.book_append_sheet(wb, ws2, 'תקציב לפי חדרים');

  // Sheet 3: מוצרים וריהוט (non-contractor)
  const furniture = items.filter((i) => !CONTRACTOR_CATEGORIES.has(i.category));
  const furnData = [itemHeaders, ...furniture.map(itemRow)];
  const ws3 = XLSX.utils.aoa_to_sheet(furnData);
  autoWidth(ws3, furnData);
  moneyAt(ws3, furniture.length, ['G', 'H', 'I', 'J']);
  XLSX.utils.book_append_sheet(wb, ws3, 'מוצרים וריהוט');

  // Sheet 4: עלויות קבלן ושיפוץ
  const contractor = items.filter((i) => CONTRACTOR_CATEGORIES.has(i.category));
  const conData = [itemHeaders, ...contractor.map(itemRow)];
  const ws4 = XLSX.utils.aoa_to_sheet(conData);
  autoWidth(ws4, conData);
  moneyAt(ws4, contractor.length, ['G', 'H', 'I', 'J']);
  XLSX.utils.book_append_sheet(wb, ws4, 'עלויות קבלן ושיפוץ');

  // Sheet 5: חומרי גלם
  const raw = items.filter((i) => i.category === 'חומרי גלם');
  const rawData = [itemHeaders, ...raw.map(itemRow)];
  const ws5 = XLSX.utils.aoa_to_sheet(rawData);
  autoWidth(ws5, rawData);
  moneyAt(ws5, raw.length, ['G', 'H', 'I', 'J']);
  XLSX.utils.book_append_sheet(wb, ws5, 'חומרי גלם');

  // Sheet 6: חסרים
  const missing = items.filter((i) => i.status === 'חסר' || i.status === 'צריך לקנות');
  const misData = [itemHeaders, ...missing.map(itemRow),
    ['סה״כ', '', '', '', '', '', '', missing.reduce((s, i) => s + itemActual(i), 0), '', '', '', '', '', '', '']];
  const ws6 = XLSX.utils.aoa_to_sheet(misData);
  autoWidth(ws6, misData);
  moneyAt(ws6, missing.length + 1, ['G', 'H', 'I', 'J']);
  XLSX.utils.book_append_sheet(wb, ws6, 'חסרים');

  // Sheet 7: שולם / נשאר לתשלום
  const payData = [
    ['פריט', 'חדר', 'ספק', 'עלות בפועל', 'שולם', 'נשאר', 'סטטוס תשלום'],
    ...items.filter((i) => itemActual(i) > 0).map((i) => [
      i.name, roomName(i.roomId), i.supplier, itemActual(i), itemPaid(i), itemRemaining(i), itemPaymentStatus(i),
    ]),
    ['סה״כ', '', '', summary.totalActual, summary.totalPaid, summary.totalRemaining, ''],
  ];
  const ws7 = XLSX.utils.aoa_to_sheet(payData);
  autoWidth(ws7, payData);
  moneyAt(ws7, payData.length - 1, ['D', 'E', 'F']);
  XLSX.utils.book_append_sheet(wb, ws7, 'שולם ונשאר לתשלום');

  XLSX.writeFile(wb, `תכנון-דירה-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ── JSON backup / restore for the plan ───────────────────────────────────────
export function downloadPlanJSON(plan: ApartmentPlan) {
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `תכנון-דירה-גיבוי-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parsePlanJSON(text: string): ApartmentPlan {
  const data = JSON.parse(text);
  if (!Array.isArray(data.rooms) || !Array.isArray(data.items)) {
    throw new Error('קובץ התכנון אינו תקין');
  }
  return data as ApartmentPlan;
}
