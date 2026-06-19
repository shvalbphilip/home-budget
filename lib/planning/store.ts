'use client';
import { create } from 'zustand';
import {
  ApartmentPlan, Room, PlanItem, StyleProfile, ChatMessage,
  emptyPlan, RoomPriority,
} from './types';
import { genId } from './geometry';
import { loadPlan, savePlan } from './service';

interface PlanningState extends ApartmentPlan {
  loaded: boolean;

  load: () => Promise<void>;

  // Rooms
  addRoom: (room: Partial<Room> & { name: string }) => Room;
  updateRoom: (id: string, patch: Partial<Room>) => void;
  deleteRoom: (id: string) => void;

  // Items
  addItem: (item: Partial<PlanItem> & { name: string; roomId: string }) => PlanItem;
  updateItem: (id: string, patch: Partial<PlanItem>) => void;
  deleteItem: (id: string) => void;
  toggleBought: (id: string) => void;
  placeItem: (id: string, px: number, py: number) => void;
  unplaceItem: (id: string) => void;

  // Style profile + advisor chat
  setStyle: (patch: Partial<StyleProfile>) => void;
  addChat: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => ChatMessage;
  clearChat: () => void;

  // Floor-plan image
  setFloorPlanImage: (dataUrl: string | null, name: string | null) => void;

  // Bulk
  loadSample: () => void;
  reset: () => void;
  importPlan: (plan: ApartmentPlan) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(get: () => PlanningState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = get();
    savePlan({
      version: s.version,
      rooms: s.rooms,
      items: s.items,
      style: s.style,
      chat: s.chat,
      floorPlanImage: s.floorPlanImage,
      floorPlanName: s.floorPlanName,
      updatedAt: new Date().toISOString(),
    });
  }, 350);
}

const ROOM_COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6', '#14b8a6', '#22c55e', '#06b6d4', '#ec4899', '#6366f1'];

export const usePlanningStore = create<PlanningState>((set, get) => ({
  ...emptyPlan(),
  loaded: false,

  load: async () => {
    const plan = await loadPlan();
    set({ ...plan, loaded: true });
  },

  // ── Rooms ──────────────────────────────────────────────────────────────
  addRoom: (room) => {
    const existing = get().rooms;
    // tile new rooms in a simple flow so they don't overlap
    const col = existing.length % 3;
    const rowIdx = Math.floor(existing.length / 3);
    const newRoom: Room = {
      id: genId(),
      name: room.name,
      emoji: room.emoji ?? '🏠',
      x: room.x ?? 40 + col * 360,
      y: room.y ?? 40 + rowIdx * 300,
      width: room.width ?? 300,
      length: room.length ?? 250,
      height: room.height ?? 270,
      color: room.color ?? ROOM_COLORS[existing.length % ROOM_COLORS.length],
      notes: room.notes ?? '',
      priority: room.priority ?? 'חשוב',
      createdAt: new Date().toISOString(),
    };
    set({ rooms: [...existing, newRoom] });
    scheduleSave(get);
    return newRoom;
  },

  updateRoom: (id, patch) => {
    set({ rooms: get().rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
    scheduleSave(get);
  },

  deleteRoom: (id) => {
    set({
      rooms: get().rooms.filter((r) => r.id !== id),
      items: get().items.filter((i) => i.roomId !== id),
    });
    scheduleSave(get);
  },

  // ── Items ──────────────────────────────────────────────────────────────
  addItem: (item) => {
    const newItem: PlanItem = {
      id: genId(),
      roomId: item.roomId,
      name: item.name,
      emoji: item.emoji ?? '📦',
      status: item.status ?? 'חסר',
      priority: item.priority ?? 'חשוב',
      quantity: item.quantity ?? 1,
      price: item.price ?? 0,
      store: item.store ?? '',
      link: item.link ?? '',
      notes: item.notes ?? '',
      category: item.category ?? '',
      bought: item.bought ?? false,
      placed: item.placed ?? false,
      px: item.px ?? 0,
      py: item.py ?? 0,
      createdAt: new Date().toISOString(),
    };
    set({ items: [...get().items, newItem] });
    scheduleSave(get);
    return newItem;
  },

  updateItem: (id, patch) => {
    set({ items: get().items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
    scheduleSave(get);
  },

  deleteItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });
    scheduleSave(get);
  },

  toggleBought: (id) => {
    set({
      items: get().items.map((i) => {
        if (i.id !== id) return i;
        const bought = !i.bought;
        return { ...i, bought, status: bought ? 'יש לנו' : i.status };
      }),
    });
    scheduleSave(get);
  },

  placeItem: (id, px, py) => {
    set({ items: get().items.map((i) => (i.id === id ? { ...i, placed: true, px, py } : i)) });
    scheduleSave(get);
  },

  unplaceItem: (id) => {
    set({ items: get().items.map((i) => (i.id === id ? { ...i, placed: false } : i)) });
    scheduleSave(get);
  },

  // ── Style + chat ───────────────────────────────────────────────────────
  setStyle: (patch) => {
    set({ style: { ...get().style, ...patch } });
    scheduleSave(get);
  },

  addChat: (msg) => {
    const m: ChatMessage = { ...msg, id: genId(), createdAt: new Date().toISOString() };
    set({ chat: [...get().chat, m] });
    scheduleSave(get);
    return m;
  },

  clearChat: () => {
    set({ chat: [] });
    scheduleSave(get);
  },

  // ── Floor plan image ───────────────────────────────────────────────────
  setFloorPlanImage: (dataUrl, name) => {
    set({ floorPlanImage: dataUrl, floorPlanName: name });
    scheduleSave(get);
  },

  // ── Bulk ───────────────────────────────────────────────────────────────
  loadSample: () => {
    // Lazy import to avoid bundling sample data with the store eagerly
    import('./sampleData').then(({ buildSamplePlan }) => {
      const plan = buildSamplePlan();
      set({ ...plan, loaded: true });
      scheduleSave(get);
    });
  },

  reset: () => {
    set({ ...emptyPlan(), loaded: true });
    scheduleSave(get);
  },

  importPlan: (plan) => {
    set({ ...plan, loaded: true });
    scheduleSave(get);
  },
}));

export type { RoomPriority };
