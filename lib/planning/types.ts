// ── Apartment Planning domain types ─────────────────────────────────────────

export type RoomPriority = 'חובה' | 'חשוב' | 'נחמד שיהיה';
export type PlanItemStatus = 'בבעלותי' | 'צריך לקנות' | 'חסר' | 'אולי' | 'לא צריך';
export type PaymentStatus = 'לא שולם' | 'שולם חלקית' | 'שולם במלואו' | 'חורג מהתקציב';
export type RoomBudgetStatus = 'עומד בתקציב' | 'קרוב לחריגה' | 'חורג מהתקציב' | 'שולם מלא' | 'בתהליך';

export const ROOM_PRIORITIES: RoomPriority[] = ['חובה', 'חשוב', 'נחמד שיהיה'];
export const PLAN_ITEM_STATUSES: PlanItemStatus[] = ['בבעלותי', 'צריך לקנות', 'חסר', 'אולי', 'לא צריך'];

/** Full cost/work category taxonomy (furniture/products + renovation/contractor). */
export const ITEM_CATEGORIES: string[] = [
  'ריהוט', 'מוצרי חשמל', 'נגרות', 'שיש', 'חומרי גלם', 'קבלן',
  'עבודות חשמל', 'אינסטלציה', 'צבע', 'ריצוף', 'חיפויים', 'תאורה',
  'מזגנים', 'אלומיניום', 'דלתות', 'הובלה והרכבה', 'התקנות', 'תיקונים',
  'אגרות / תשלומים', 'אחר',
];

/** Categories that count as contractor / renovation work (vs furniture & products). */
export const CONTRACTOR_CATEGORIES = new Set<string>([
  'נגרות', 'שיש', 'חומרי גלם', 'קבלן', 'עבודות חשמל', 'אינסטלציה', 'צבע',
  'ריצוף', 'חיפויים', 'אלומיניום', 'דלתות', 'הובלה והרכבה', 'התקנות',
  'תיקונים', 'אגרות / תשלומים',
]);

/** Map legacy statuses from older saved plans to the new taxonomy. */
export function normalizeStatus(s: string): PlanItemStatus {
  if (s === 'יש לנו') return 'בבעלותי';
  if (s === 'לרכישה') return 'צריך לקנות';
  if ((PLAN_ITEM_STATUSES as string[]).includes(s)) return s as PlanItemStatus;
  return 'חסר';
}

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
  plannedBudget: number;  // planned budget for this room (₪) — optional (0 = none)
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
  price: number;        // PLANNED unit price (₪)
  actualPrice: number;  // ACTUAL final unit price (₪) — 0 if not known yet
  paidAmount: number;   // total amount paid so far (₪)
  supplier: string;     // supplier / contractor name
  store: string;
  link: string;         // invoice / quote link
  notes: string;
  category: string;     // from ITEM_CATEGORIES
  bought: boolean;
  // Optional placement on the 2D plan (cm, relative to the room's origin)
  placed: boolean;
  px: number;
  py: number;
  createdAt: string;
}

export interface StyleProfile {
  style: string;
  budget: number;           // optional global apartment budget
  topPriorities: string;
  partnerNotes: string;
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
  floorPlanImage: string | null;
  floorPlanName: string | null;
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
  version: '2.0',
  rooms: [],
  items: [],
  style: emptyStyle(),
  chat: [],
  floorPlanImage: null,
  floorPlanName: null,
  updatedAt: new Date().toISOString(),
});
