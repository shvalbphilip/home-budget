import {
  Room, PlanItem, RoomPriority, PlanItemStatus, PaymentStatus, RoomBudgetStatus,
  CONTRACTOR_CATEGORIES,
} from './types';

export const fmt = (n: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);

export const pct = (part: number, total: number) =>
  total <= 0 ? 0 : Math.round((part / total) * 100);

/** Room floor area in m². */
export function roomAreaM2(room: Room): number {
  return Math.round(((room.width / 100) * (room.length / 100)) * 10) / 10;
}

// ── Per-item money helpers (defensive defaults for older saved items) ────────
export const itemPlanned = (i: PlanItem) => (i.price || 0) * (i.quantity || 1);
export const itemActual = (i: PlanItem) =>
  ((i.actualPrice && i.actualPrice > 0 ? i.actualPrice : i.price) || 0) * (i.quantity || 1);
export const itemPaid = (i: PlanItem) => i.paidAmount || 0;
export const itemRemaining = (i: PlanItem) => Math.max(0, itemActual(i) - itemPaid(i));
export const itemIsOverBudget = (i: PlanItem) => itemPlanned(i) > 0 && itemActual(i) > itemPlanned(i);
/** Legacy alias used by older callers. */
export const itemTotal = (i: PlanItem) => itemActual(i);

export function itemPaymentStatus(i: PlanItem): PaymentStatus {
  if (itemIsOverBudget(i)) return 'חורג מהתקציב';
  const actual = itemActual(i);
  const paid = itemPaid(i);
  if (paid <= 0) return 'לא שולם';
  if (actual > 0 && paid >= actual) return 'שולם במלואו';
  return 'שולם חלקית';
}

const isCounted = (i: PlanItem) => i.status !== 'לא צריך';
const isContractor = (i: PlanItem) => CONTRACTOR_CATEGORIES.has(i.category);

// ── Room-level stats ─────────────────────────────────────────────────────────
export interface RoomStats {
  room: Room;
  items: PlanItem[];
  owned: number;        // בבעלותי
  toBuy: number;        // צריך לקנות
  missing: number;      // חסר
  maybe: number;        // אולי
  notNeeded: number;    // לא צריך
  total: number;
  plannedBudget: number;
  plannedCost: number;  // sum of planned prices (counted items)
  actualCost: number;   // sum of actual prices (counted items)
  paid: number;         // total paid so far
  remaining: number;    // actualCost - paid
  missingCost: number;  // cost of חסר + צריך לקנות
  diff: number;         // plannedBudget - actualCost (negative = over)
  usedPct: number;      // actualCost / plannedBudget
  budgetStatus: RoomBudgetStatus;
  readiness: number;    // owned / (owned + need)
  area: number;
}

export function roomBudgetStatus(planned: number, actual: number, paid: number): RoomBudgetStatus {
  if (planned > 0 && actual > planned) return 'חורג מהתקציב';
  if (actual > 0 && paid >= actual) return 'שולם מלא';
  if (planned > 0 && actual >= planned * 0.9) return 'קרוב לחריגה';
  if (actual > 0 || paid > 0) return 'בתהליך';
  return 'עומד בתקציב';
}

export function getRoomStats(room: Room, items: PlanItem[]): RoomStats {
  const roomItems = items.filter((i) => i.roomId === room.id);
  const counted = roomItems.filter(isCounted);
  const owned = roomItems.filter((i) => i.status === 'בבעלותי').length;
  const toBuy = roomItems.filter((i) => i.status === 'צריך לקנות').length;
  const missing = roomItems.filter((i) => i.status === 'חסר').length;
  const maybe = roomItems.filter((i) => i.status === 'אולי').length;
  const notNeeded = roomItems.filter((i) => i.status === 'לא צריך').length;

  const plannedCost = counted.reduce((s, i) => s + itemPlanned(i), 0);
  const actualCost = counted.reduce((s, i) => s + itemActual(i), 0);
  const paid = roomItems.reduce((s, i) => s + itemPaid(i), 0);
  const missingCost = roomItems
    .filter((i) => i.status === 'חסר' || i.status === 'צריך לקנות')
    .reduce((s, i) => s + itemActual(i), 0);

  const need = toBuy + missing;
  const readiness = owned + need === 0 ? 0 : Math.round((owned / (owned + need)) * 100);
  const planned = room.plannedBudget || 0;

  return {
    room, items: roomItems,
    owned, toBuy, missing, maybe, notNeeded,
    total: roomItems.length,
    plannedBudget: planned,
    plannedCost, actualCost, paid,
    remaining: Math.max(0, actualCost - paid),
    missingCost,
    diff: planned - actualCost,
    usedPct: pct(actualCost, planned),
    budgetStatus: roomBudgetStatus(planned, actualCost, paid),
    readiness,
    area: roomAreaM2(room),
  };
}

// ── Whole-plan summary ───────────────────────────────────────────────────────
export interface PlanSummary {
  totalRooms: number;
  totalItems: number;
  globalBudget: number;
  totalPlanned: number;
  totalActual: number;
  totalPaid: number;
  totalRemaining: number;      // actual - paid (still to pay)
  totalMissingCost: number;
  furnitureTotal: number;      // non-contractor categories
  contractorTotal: number;     // contractor/renovation categories
  budgetDiff: number;          // globalBudget - totalActual (negative = over)
  overBudget: boolean;
  readiness: number;
  paidPct: number;             // paid / actual
  healthScore: number;         // 0–100
  byPriority: Record<RoomPriority, { count: number; cost: number }>;
  byStatus: Record<PlanItemStatus, number>;
  byCategory: { category: string; planned: number; actual: number; paid: number; count: number }[];
  totalAreaM2: number;
  overBudgetRooms: { name: string; over: number }[];
}

export function getPlanSummary(rooms: Room[], items: PlanItem[], budget: number): PlanSummary {
  const counted = items.filter(isCounted);
  const totalPlanned = counted.reduce((s, i) => s + itemPlanned(i), 0);
  const totalActual = counted.reduce((s, i) => s + itemActual(i), 0);
  const totalPaid = items.reduce((s, i) => s + itemPaid(i), 0);
  const totalMissingCost = items
    .filter((i) => i.status === 'חסר' || i.status === 'צריך לקנות')
    .reduce((s, i) => s + itemActual(i), 0);
  const contractorTotal = counted.filter(isContractor).reduce((s, i) => s + itemActual(i), 0);
  const furnitureTotal = totalActual - contractorTotal;

  const byPriority = {
    'חובה': { count: 0, cost: 0 }, 'חשוב': { count: 0, cost: 0 }, 'נחמד שיהיה': { count: 0, cost: 0 },
  } as Record<RoomPriority, { count: number; cost: number }>;
  counted.forEach((i) => { byPriority[i.priority].count += 1; byPriority[i.priority].cost += itemActual(i); });

  const byStatus = {
    'בבעלותי': 0, 'צריך לקנות': 0, 'חסר': 0, 'אולי': 0, 'לא צריך': 0,
  } as Record<PlanItemStatus, number>;
  items.forEach((i) => { byStatus[i.status] = (byStatus[i.status] ?? 0) + 1; });

  const catMap: Record<string, { planned: number; actual: number; paid: number; count: number }> = {};
  counted.forEach((i) => {
    const k = i.category || 'אחר';
    (catMap[k] ??= { planned: 0, actual: 0, paid: 0, count: 0 });
    catMap[k].planned += itemPlanned(i);
    catMap[k].actual += itemActual(i);
    catMap[k].paid += itemPaid(i);
    catMap[k].count += 1;
  });
  const byCategory = Object.entries(catMap)
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.actual - a.actual);

  const owned = byStatus['בבעלותי'];
  const need = byStatus['צריך לקנות'] + byStatus['חסר'];
  const readiness = owned + need === 0 ? 0 : Math.round((owned / (owned + need)) * 100);

  const overBudgetRooms = rooms
    .map((r) => { const s = getRoomStats(r, items); return { name: r.name, over: s.plannedBudget > 0 ? s.actualCost - s.plannedBudget : 0 }; })
    .filter((r) => r.over > 0);

  const overBudget = budget > 0 && totalActual > budget;

  // Health score: penalise global over-budget, over-budget rooms; reward paid progress.
  let health = 100;
  if (budget > 0 && totalActual > budget) health -= Math.min(45, Math.round(((totalActual - budget) / budget) * 100));
  health -= Math.min(25, overBudgetRooms.length * 8);
  if (totalActual > 0) health -= Math.round((1 - Math.min(1, totalPaid / totalActual)) * 12);
  const healthScore = Math.max(0, Math.min(100, health));

  return {
    totalRooms: rooms.length,
    totalItems: items.length,
    globalBudget: budget,
    totalPlanned, totalActual, totalPaid,
    totalRemaining: Math.max(0, totalActual - totalPaid),
    totalMissingCost,
    furnitureTotal, contractorTotal,
    budgetDiff: budget - totalActual,
    overBudget,
    readiness,
    paidPct: pct(totalPaid, totalActual),
    healthScore,
    byPriority, byStatus, byCategory,
    totalAreaM2: Math.round(rooms.reduce((s, r) => s + roomAreaM2(r), 0) * 10) / 10,
    overBudgetRooms,
  };
}

/** Downscale an uploaded image to keep the stored dataURL small. */
export function downscaleImage(file: File, maxSize = 1400, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('קריאת הקובץ נכשלה'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('טעינת התמונה נכשלה'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('דפדפן לא תומך'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
