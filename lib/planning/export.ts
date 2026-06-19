import * as XLSX from 'xlsx';
import { Room, PlanItem, StyleProfile, ApartmentPlan } from './types';
import { getRoomStats, getPlanSummary, itemTotal, roomAreaM2 } from './geometry';

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

/** Export the apartment plan to a multi-sheet Excel workbook. */
export function exportPlanToExcel(rooms: Room[], items: PlanItem[], style: StyleProfile) {
  const wb = XLSX.utils.book_new();
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? '—';
  const summary = getPlanSummary(rooms, items, style.budget);

  // Sheet 1: Rooms
  const roomHeaders = ['חדר', 'אמוג׳י', 'עדיפות', 'רוחב (ס״מ)', 'אורך (ס״מ)', 'גובה (ס״מ)', 'שטח (מ״ר)', 'פריטים', 'יש לנו', 'חסר', 'מוכנות %', 'עלות מתוכננת', 'הערות'];
  const roomRows = rooms.map((r) => {
    const s = getRoomStats(r, items);
    return [r.name, r.emoji, r.priority, r.width, r.length, r.height, roomAreaM2(r),
      s.total, s.have, s.missing, s.readiness / 100, s.estimatedCost, r.notes];
  });
  const roomData = [roomHeaders, ...roomRows];
  const ws1 = XLSX.utils.aoa_to_sheet(roomData);
  autoWidth(ws1, roomData);
  for (let r = 1; r <= roomRows.length; r++) {
    if (ws1['K' + (r + 1)]) ws1['K' + (r + 1)].z = '0%';
    if (ws1['L' + (r + 1)]) ws1['L' + (r + 1)].z = shekelFmt;
  }
  XLSX.utils.book_append_sheet(wb, ws1, 'חדרים');

  // Sheet 2: All items
  const itemHeaders = ['פריט', 'חדר', 'קטגוריה', 'סטטוס', 'עדיפות', 'כמות', 'מחיר יח׳', 'סה״כ', 'נקנה', 'חנות', 'קישור', 'הערות'];
  const itemRows = items.map((i) => [
    i.name, roomName(i.roomId), i.category, i.status, i.priority, i.quantity,
    i.price, itemTotal(i), i.bought ? 'כן' : 'לא', i.store, i.link, i.notes,
  ]);
  const itemData = [itemHeaders, ...itemRows];
  const ws2 = XLSX.utils.aoa_to_sheet(itemData);
  autoWidth(ws2, itemData);
  moneyCols(ws2, itemRows.length, ['G', 'H']);
  XLSX.utils.book_append_sheet(wb, ws2, 'כל הפריטים');

  // Sheet 3: Missing items
  const missing = items.filter((i) => i.status === 'חסר');
  const misRows = missing.map((i) => [
    i.name, roomName(i.roomId), i.priority, i.quantity, i.price, itemTotal(i), i.store,
  ]);
  const misData = [
    ['פריט', 'חדר', 'עדיפות', 'כמות', 'מחיר יח׳', 'סה״כ', 'חנות'],
    ...misRows,
    ['', '', '', '', 'סה״כ', missing.reduce((s, i) => s + itemTotal(i), 0), ''],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(misData);
  autoWidth(ws3, misData);
  moneyCols(ws3, misRows.length + 1, ['E', 'F']);
  XLSX.utils.book_append_sheet(wb, ws3, 'פריטים חסרים');

  // Sheet 4: Budget by room
  const byRoomData: unknown[][] = [
    ['חדר', 'עלות מתוכננת', 'כבר נקנה', 'עוד חסר'],
    ...rooms.map((r) => {
      const s = getRoomStats(r, items);
      return [r.name, s.estimatedCost, s.spentCost, s.missingCost];
    }),
    ['סה״כ', summary.totalEstimated, summary.totalSpent, summary.totalMissingCost],
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(byRoomData);
  autoWidth(ws4, byRoomData);
  moneyCols(ws4, rooms.length + 1, ['B', 'C', 'D']);
  XLSX.utils.book_append_sheet(wb, ws4, 'תקציב לפי חדר');

  // Sheet 5: Budget by priority
  const byPrioData: unknown[][] = [
    ['עדיפות', 'מספר פריטים', 'עלות'],
    ['חובה', summary.byPriority['חובה'].count, summary.byPriority['חובה'].cost],
    ['חשוב', summary.byPriority['חשוב'].count, summary.byPriority['חשוב'].cost],
    ['נחמד שיהיה', summary.byPriority['נחמד שיהיה'].count, summary.byPriority['נחמד שיהיה'].cost],
  ];
  const ws5 = XLSX.utils.aoa_to_sheet(byPrioData);
  autoWidth(ws5, byPrioData);
  moneyCols(ws5, 3, ['C']);
  XLSX.utils.book_append_sheet(wb, ws5, 'תקציב לפי עדיפות');

  // Sheet 6: Totals
  const totalsData: unknown[][] = [
    ['סיכום כללי', ''],
    ['', ''],
    ['סגנון', style.style || '—'],
    ['תקציב כולל', style.budget],
    ['עלות מתוכננת', summary.totalEstimated],
    ['נותר בתקציב', summary.remaining],
    ['כבר נקנה', summary.totalSpent],
    ['עוד חסר', summary.totalMissingCost],
    ['', ''],
    ['מספר חדרים', summary.totalRooms],
    ['שטח כולל (מ״ר)', summary.totalAreaM2],
    ['מספר פריטים', summary.totalItems],
    ['מוכנות כללית', summary.readiness / 100],
  ];
  const ws6 = XLSX.utils.aoa_to_sheet(totalsData);
  ['B4', 'B5', 'B6', 'B7', 'B8'].forEach((ref) => { if (ws6[ref]) ws6[ref].z = shekelFmt; });
  if (ws6['B13']) ws6['B13'].z = '0%';
  ws6['!cols'] = [{ wch: 22 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws6, 'סיכום');

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
