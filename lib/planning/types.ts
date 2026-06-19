// ── Apartment Planning domain types ─────────────────────────────────────────

export type RoomPriority = 'חובה' | 'חשוב' | 'נחמד שיהיה';
export type PlanItemStatus = 'יש לנו' | 'חסר' | 'אולי' | 'לא צריך';

export const ROOM_PRIORITIES: RoomPriority[] = ['חובה', 'חשוב', 'נחמד שיהיה'];
export const PLAN_ITEM_STATUSES: PlanItemStatus[] = ['יש לנו', 'חסר', 'אולי', 'לא צריך'];

/** Predefined apartment rooms (Hebrew) used as quick-add presets. */
export const ROOM_PRESETS: { name: string; emoji: string; color: string }[] = [
  { name: 'מטבח', emoji: '🍳', color: '#f59e0b' },
  { name: 'סלון', emoji: '🛋️', color: '#8b5cf6' },
  { name: 'חדר שינה', emoji: '🛏️', color: '#3b82f6' },
  { name: 'חדר ארונות', emoji: '🚪', color: '#14b8a6' },
  { name: 'ממ״ד', emoji: '🛡️', color: '#64748b' },
  { name: 'מרפסת', emoji: '🌿', color: '#22c55e' },
  { name: 'שירותים 1', emoji: '🚽', color: '#06b6d4' },
  { name: 'שירותים 2', emoji: '🚿', color: '#0ea5e9' },
  { name: 'שירותים 3', emoji: '🧺', color: '#6366f1' },
];

export interface Room {
  id: string;
  name: string;
  emoji: string;
  /** Floor-plan geometry, in centimetres. Origin top-left of the canvas. */
  x: number;
  y: number;
  width: number;   // horizontal extent (cm)
  length: number;  // vertical extent on plan (cm)
  height: number;  // ceiling height (cm) — used by the 3D preview
  color: string;   // hex
  notes: string;
  priority: RoomPriority;
  createdAt: string;
}

export interface PlanItem {
  id: string;
  roomId: string;
  name: string;
  emoji: string;
  status: PlanItemStatus;
  priority: RoomPriority;
  quantity: number;
  price: number;        // unit estimated price (₪)
  store: string;
  link: string;
  notes: string;
  category: string;     // free-text budget category
  bought: boolean;
  // Optional placement on the 2D plan (cm, relative to the room's origin)
  placed: boolean;
  px: number;
  py: number;
  createdAt: string;
}

export interface StyleProfile {
  style: string;            // e.g. מודרני / כפרי / סקנדינבי
  budget: number;           // total apartment budget the couple set
  topPriorities: string;    // free text
  partnerNotes: string;     // notes from the partner
  answers: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
}

export interface ApartmentPlan {
  version: string;
  rooms: Room[];
  items: PlanItem[];
  style: StyleProfile;
  chat: ChatMessage[];
  floorPlanImage: string | null;  // dataURL of an uploaded plan (image)
  floorPlanName: string | null;   // original filename (for PDFs we keep the name)
  updatedAt: string;
}

export const emptyStyle = (): StyleProfile => ({
  style: '',
  budget: 0,
  topPriorities: '',
  partnerNotes: '',
  answers: {},
});

export const emptyPlan = (): ApartmentPlan => ({
  version: '1.0',
  rooms: [],
  items: [],
  style: emptyStyle(),
  chat: [],
  floorPlanImage: null,
  floorPlanName: null,
  updatedAt: new Date().toISOString(),
});
