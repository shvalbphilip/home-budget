import { ApartmentPlan, Room, PlanItem } from './types';
import { genId } from './geometry';

// A realistic Israeli-apartment starter plan that showcases the budget engine
// (planned budgets, actual costs, partial payments, contractor categories).
// Used by the "טען נתוני דוגמה" button; fully removable via "איפוס".

export function buildSamplePlan(): ApartmentPlan {
  const now = new Date().toISOString();
  const mk = (
    name: string, emoji: string, color: string,
    x: number, y: number, width: number, length: number,
    priority: Room['priority'], plannedBudget: number,
  ): Room => ({
    id: genId(), name, emoji, color, x, y, width, length,
    height: 270, notes: '', priority, plannedBudget, createdAt: now,
  });

  const salon = mk('סלון', '🛋️', '#8b5cf6', 40, 40, 450, 380, 'חובה', 25000);
  const kitchen = mk('מטבח', '🍳', '#f59e0b', 520, 40, 360, 300, 'חובה', 70000);
  const bedroom = mk('חדר שינה', '🛏️', '#3b82f6', 40, 460, 360, 320, 'חובה', 12000);
  const mamad = mk('ממ״ד', '🛡️', '#64748b', 430, 460, 250, 250, 'חשוב', 3000);
  const balcony = mk('מרפסת', '🌿', '#22c55e', 710, 380, 250, 200, 'נחמד שיהיה', 4000);
  const bath = mk('שירותים 1', '🚽', '#06b6d4', 710, 610, 170, 150, 'חובה', 9000);

  const rooms = [salon, kitchen, bedroom, mamad, balcony, bath];

  const item = (
    roomId: string, name: string, emoji: string,
    status: PlanItem['status'], priority: PlanItem['priority'],
    price: number, category: string,
    opts: { actualPrice?: number; paidAmount?: number; supplier?: string; placed?: boolean; px?: number; py?: number } = {},
  ): PlanItem => ({
    id: genId(), roomId, name, emoji, status, priority,
    quantity: 1, price, actualPrice: opts.actualPrice ?? 0, paidAmount: opts.paidAmount ?? 0,
    supplier: opts.supplier ?? '', store: '', link: '', notes: '',
    category, bought: status === 'בבעלותי',
    placed: opts.placed ?? false, px: opts.px ?? 60, py: opts.py ?? 60, createdAt: now,
  });

  const items: PlanItem[] = [
    // Salon
    item(salon.id, 'ספה תלת-מושבית', '🛋️', 'צריך לקנות', 'חובה', 4500, 'ריהוט', { placed: true, px: 120, py: 240 }),
    item(salon.id, 'שולחן סלון', '🪵', 'אולי', 'נחמד שיהיה', 900, 'ריהוט', { placed: true, px: 200, py: 160 }),
    item(salon.id, 'טלוויזיה', '📺', 'בבעלותי', 'חשוב', 3000, 'מוצרי חשמל', { actualPrice: 3000, paidAmount: 3000, placed: true, px: 360, py: 40 }),
    item(salon.id, 'תאורה נסתרת', '💡', 'צריך לקנות', 'חשוב', 3500, 'תאורה', { supplier: 'חשמלאי דני' }),
    // Kitchen — showcases the 70k budget example
    item(kitchen.id, 'נגרות מטבח', '🪚', 'צריך לקנות', 'חובה', 35000, 'נגרות', { actualPrice: 30000, paidAmount: 10000, supplier: 'נגריית כהן', placed: true, px: 40, py: 40 }),
    item(kitchen.id, 'משטח שיש', '🪨', 'צריך לקנות', 'חובה', 12000, 'שיש', { actualPrice: 12500, paidAmount: 0, supplier: 'שיש אבן הדר' }),
    item(kitchen.id, 'מקרר', '🧊', 'צריך לקנות', 'חובה', 4000, 'מוצרי חשמל', { placed: true, px: 200, py: 40 }),
    item(kitchen.id, 'תנור + כיריים', '🔥', 'צריך לקנות', 'חובה', 3200, 'מוצרי חשמל'),
    item(kitchen.id, 'התקנת מטבח', '🔧', 'צריך לקנות', 'חשוב', 2500, 'התקנות', { supplier: 'נגריית כהן' }),
    item(kitchen.id, 'מיקרוגל', '📡', 'בבעלותי', 'חשוב', 450, 'מוצרי חשמל', { actualPrice: 450, paidAmount: 450 }),
    // Bedroom
    item(bedroom.id, 'מיטה זוגית', '🛏️', 'צריך לקנות', 'חובה', 3500, 'ריהוט', { placed: true, px: 120, py: 180 }),
    item(bedroom.id, 'ארון בגדים', '🚪', 'צריך לקנות', 'חובה', 2800, 'נגרות', { supplier: 'נגריית כהן', placed: true, px: 40, py: 40 }),
    // Mamad
    item(mamad.id, 'מדפים', '🗂️', 'אולי', 'נחמד שיהיה', 500, 'אחר'),
    // Balcony
    item(balcony.id, 'סט ישיבה למרפסת', '☀️', 'אולי', 'נחמד שיהיה', 1200, 'ריהוט'),
    // Bath
    item(bath.id, 'ריצוף', '🧱', 'צריך לקנות', 'חובה', 4000, 'ריצוף', { supplier: 'רצף אבי' }),
    item(bath.id, 'מכונת כביסה', '🌀', 'צריך לקנות', 'חובה', 2200, 'מוצרי חשמל'),
  ];

  return {
    version: '2.0',
    rooms,
    items,
    style: {
      style: 'סקנדינבי',
      budget: 130000,
      topPriorities: 'מטבח וחדר שינה קודם',
      partnerNotes: '',
      answers: {},
    },
    chat: [],
    floorPlanImage: null,
    floorPlanName: null,
    updatedAt: now,
  };
}
