import { Room, PlanItem, RoomPriority, PlanItemStatus } from './types';

export const fmt = (n: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);

/** Room floor area in m². */
export function roomAreaM2(room: Room): number {
  return Math.round(((room.width / 100) * (room.length / 100)) * 10) / 10;
}

/** Cost of a single plan item (unit price × quantity). */
export function itemTotal(item: PlanItem): number {
  return item.price * item.quantity;
}

export interface RoomStats {
  room: Room;
  items: PlanItem[];
  have: number;        // יש לנו
  missing: number;     // חסר
  maybe: number;       // אולי
  notNeeded: number;   // לא צריך
  total: number;
  estimatedCost: number;   // cost of everything not "לא צריך"
  spentCost: number;       // cost of bought items
  missingCost: number;     // cost of חסר items
  readiness: number;       // 0–100 (have / (have + missing))
  area: number;
}

export function getRoomStats(room: Room, items: PlanItem[]): RoomStats {
  const roomItems = items.filter((i) => i.roomId === room.id);
  const have = roomItems.filter((i) => i.status === 'יש לנו').length;
  const missing = roomItems.filter((i) => i.status === 'חסר').length;
  const maybe = roomItems.filter((i) => i.status === 'אולי').length;
  const notNeeded = roomItems.filter((i) => i.status === 'לא צריך').length;
  const estimatedCost = roomItems
    .filter((i) => i.status !== 'לא צריך')
    .reduce((s, i) => s + itemTotal(i), 0);
  const spentCost = roomItems.filter((i) => i.bought).reduce((s, i) => s + itemTotal(i), 0);
  const missingCost = roomItems
    .filter((i) => i.status === 'חסר')
    .reduce((s, i) => s + itemTotal(i), 0);
  const denom = have + missing;
  const readiness = denom === 0 ? 0 : Math.round((have / denom) * 100);
  return {
    room,
    items: roomItems,
    have, missing, maybe, notNeeded,
    total: roomItems.length,
    estimatedCost, spentCost, missingCost,
    readiness,
    area: roomAreaM2(room),
  };
}

export interface PlanSummary {
  totalRooms: number;
  totalItems: number;
  totalEstimated: number;
  totalSpent: number;
  totalMissingCost: number;
  remaining: number;          // budget - estimated
  readiness: number;          // overall 0–100
  byPriority: Record<RoomPriority, { count: number; cost: number }>;
  byStatus: Record<PlanItemStatus, number>;
  totalAreaM2: number;
}

export function getPlanSummary(rooms: Room[], items: PlanItem[], budget: number): PlanSummary {
  const active = items.filter((i) => i.status !== 'לא צריך');
  const totalEstimated = active.reduce((s, i) => s + itemTotal(i), 0);
  const totalSpent = items.filter((i) => i.bought).reduce((s, i) => s + itemTotal(i), 0);
  const totalMissingCost = items
    .filter((i) => i.status === 'חסר')
    .reduce((s, i) => s + itemTotal(i), 0);

  const byPriority = {
    'חובה': { count: 0, cost: 0 },
    'חשוב': { count: 0, cost: 0 },
    'נחמד שיהיה': { count: 0, cost: 0 },
  } as Record<RoomPriority, { count: number; cost: number }>;
  active.forEach((i) => {
    byPriority[i.priority].count += 1;
    byPriority[i.priority].cost += itemTotal(i);
  });

  const byStatus = {
    'יש לנו': 0, 'חסר': 0, 'אולי': 0, 'לא צריך': 0,
  } as Record<PlanItemStatus, number>;
  items.forEach((i) => { byStatus[i.status] += 1; });

  const have = byStatus['יש לנו'];
  const missing = byStatus['חסר'];
  const readiness = have + missing === 0 ? 0 : Math.round((have / (have + missing)) * 100);

  const totalAreaM2 = Math.round(rooms.reduce((s, r) => s + roomAreaM2(r), 0) * 10) / 10;

  return {
    totalRooms: rooms.length,
    totalItems: items.length,
    totalEstimated,
    totalSpent,
    totalMissingCost,
    remaining: budget - totalEstimated,
    readiness,
    byPriority,
    byStatus,
    totalAreaM2,
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
        canvas.width = w;
        canvas.height = h;
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
