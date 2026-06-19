import { ApartmentPlan, Room, PlanItem } from './types';
import { genId } from './geometry';

// A small, realistic Israeli-apartment starter plan. Used by the
// "טען נתוני דוגמה" button; fully removable via "איפוס".

export function buildSamplePlan(): ApartmentPlan {
  const now = new Date().toISOString();
  const mk = (
    name: string, emoji: string, color: string,
    x: number, y: number, width: number, length: number,
    priority: Room['priority'],
  ): Room => ({
    id: genId(), name, emoji, color, x, y, width, length,
    height: 270, notes: '', priority, createdAt: now,
  });

  const salon = mk('סלון', '🛋️', '#8b5cf6', 40, 40, 450, 380, 'חובה');
  const kitchen = mk('מטבח', '🍳', '#f59e0b', 520, 40, 360, 300, 'חובה');
  const bedroom = mk('חדר שינה', '🛏️', '#3b82f6', 40, 460, 360, 320, 'חובה');
  const mamad = mk('ממ״ד', '🛡️', '#64748b', 430, 460, 250, 250, 'חשוב');
  const balcony = mk('מרפסת', '🌿', '#22c55e', 710, 380, 250, 200, 'נחמד שיהיה');
  const bath = mk('שירותים 1', '🚽', '#06b6d4', 710, 610, 170, 150, 'חובה');

  const rooms = [salon, kitchen, bedroom, mamad, balcony, bath];

  const item = (
    roomId: string, name: string, emoji: string,
    status: PlanItem['status'], priority: PlanItem['priority'],
    price: number, category: string,
    placed = false, px = 60, py = 60,
  ): PlanItem => ({
    id: genId(), roomId, name, emoji, status, priority,
    quantity: 1, price, store: '', link: '', notes: '',
    category, bought: status === 'יש לנו', placed, px, py, createdAt: now,
  });

  const items: PlanItem[] = [
    // Salon
    item(salon.id, 'ספה תלת-מושבית', '🛋️', 'חסר', 'חובה', 4500, 'ריהוט', true, 120, 240),
    item(salon.id, 'שולחן סלון', '🪵', 'אולי', 'נחמד שיהיה', 900, 'ריהוט', true, 200, 160),
    item(salon.id, 'טלוויזיה', '📺', 'יש לנו', 'חשוב', 3000, 'אלקטרוניקה', true, 360, 40),
    item(salon.id, 'שטיח', '🧶', 'אולי', 'נחמד שיהיה', 700, 'טקסטיל'),
    // Kitchen
    item(kitchen.id, 'מקרר', '🧊', 'חסר', 'חובה', 4000, 'מוצרי חשמל', true, 40, 40),
    item(kitchen.id, 'תנור + כיריים', '🔥', 'חסר', 'חובה', 3200, 'מוצרי חשמל', true, 200, 40),
    item(kitchen.id, 'מדיח כלים', '🫧', 'אולי', 'חשוב', 2000, 'מוצרי חשמל'),
    item(kitchen.id, 'מיקרוגל', '📡', 'יש לנו', 'חשוב', 450, 'מוצרי חשמל'),
    // Bedroom
    item(bedroom.id, 'מיטה זוגית', '🛏️', 'חסר', 'חובה', 3500, 'ריהוט', true, 120, 180),
    item(bedroom.id, 'ארון בגדים', '🚪', 'חסר', 'חובה', 2800, 'ריהוט', true, 40, 40),
    item(bedroom.id, 'שידות לצד המיטה', '🗄️', 'אולי', 'נחמד שיהיה', 600, 'ריהוט'),
    // Mamad
    item(mamad.id, 'מדפים', '🗂️', 'אולי', 'נחמד שיהיה', 500, 'אחסון'),
    // Balcony
    item(balcony.id, 'סט ישיבה למרפסת', '☀️', 'אולי', 'נחמד שיהיה', 1200, 'גינון'),
    // Bath
    item(bath.id, 'מכונת כביסה', '🌀', 'חסר', 'חובה', 2200, 'מוצרי חשמל'),
  ];

  return {
    version: '1.0',
    rooms,
    items,
    style: {
      style: 'סקנדינבי',
      budget: 60000,
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
