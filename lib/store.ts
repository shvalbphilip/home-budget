'use client';
import { create } from 'zustand';
import { AppState, Category, Item, ExportedState } from './types';
import * as db from './db';

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const useStore = create<AppState & {
  loaded: boolean;
  loadFromDB: () => Promise<void>;
}>((set, get) => ({
  loaded: false,
  onboardingComplete: false,
  totalBudget: 0,
  categories: [],
  items: [],

  // ── Bootstrap ──────────────────────────────────────────────────────────
  loadFromDB: async () => {
    const { settings, categories, items } = await db.loadAll();
    set({
      loaded: true,
      onboardingComplete: settings?.onboarding_complete ?? false,
      totalBudget: settings?.total_budget ?? 0,
      categories,
      items,
    });
  },

  // ── Onboarding ─────────────────────────────────────────────────────────
  completeOnboarding: async (budget, categories) => {
    set({ onboardingComplete: true, totalBudget: budget, categories });
    await db.saveSettings(budget, true);
    await Promise.all(categories.map((c, i) => db.upsertCategory(c, i)));
  },

  // ── Budget ─────────────────────────────────────────────────────────────
  setTotalBudget: async (budget) => {
    set({ totalBudget: budget });
    await db.saveSettings(budget, get().onboardingComplete);
  },

  // ── Categories ─────────────────────────────────────────────────────────
  addCategory: (name, emoji, budget) => {
    const cat: Category = { id: genId(), name, emoji, plannedBudget: budget };
    const cats = [...get().categories, cat];
    set({ categories: cats });
    db.upsertCategory(cat, cats.length - 1);
    return cat;
  },

  renameCategory: (id, name, emoji) => {
    const cats = get().categories.map((c) => c.id === id ? { ...c, name, emoji } : c);
    set({ categories: cats });
    const updated = cats.find((c) => c.id === id)!;
    db.upsertCategory(updated, cats.findIndex((c) => c.id === id));
  },

  setCategoryBudget: (id, budget) => {
    const cats = get().categories.map((c) => c.id === id ? { ...c, plannedBudget: budget } : c);
    set({ categories: cats });
    const updated = cats.find((c) => c.id === id)!;
    db.upsertCategory(updated, cats.findIndex((c) => c.id === id));
  },

  deleteCategory: (id) => {
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      items: s.items.filter((i) => i.categoryId !== id),
    }));
    db.deleteCategory(id); // cascade deletes items via FK
  },

  resetCategory: (id) => {
    set((s) => ({ items: s.items.filter((i) => i.categoryId !== id) }));
    db.deleteItemsByCategoryId(id);
  },

  reorderCategories: (ids) => {
    const cats = ids.map((id) => get().categories.find((c) => c.id === id)!).filter(Boolean);
    set({ categories: cats });
    cats.forEach((c, i) => db.upsertCategory(c, i));
  },

  // ── Items ──────────────────────────────────────────────────────────────
  addItem: (item) => {
    const newItem: Item = { ...item, id: genId(), createdAt: new Date().toISOString() };
    set((s) => ({ items: [...s.items, newItem] }));
    db.upsertItem(newItem);
  },

  updateItem: (id, patch) => {
    set((s) => ({
      items: s.items.map((i) => i.id === id ? { ...i, ...patch } : i),
    }));
    const updated = get().items.find((i) => i.id === id)!;
    db.upsertItem(updated);
  },

  deleteItem: (id) => {
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    db.deleteItem(id);
  },

  moveItem: (itemId, toCategoryId) => {
    set((s) => ({
      items: s.items.map((i) => i.id === itemId ? { ...i, categoryId: toCategoryId } : i),
    }));
    const updated = get().items.find((i) => i.id === itemId)!;
    db.upsertItem(updated);
  },

  // ── Reset ──────────────────────────────────────────────────────────────
  resetAll: async () => {
    // Delete all items and categories from DB, reset settings
    const { items, categories } = get();
    await Promise.all(items.map((i) => db.deleteItem(i.id)));
    await Promise.all(categories.map((c) => db.deleteCategory(c.id)));
    await db.saveSettings(0, false);
    set({ onboardingComplete: false, totalBudget: 0, categories: [], items: [] });
  },

  // ── Import ─────────────────────────────────────────────────────────────
  importState: async (data: ExportedState) => {
    // Clear existing
    const { items, categories } = get();
    await Promise.all(items.map((i) => db.deleteItem(i.id)));
    await Promise.all(categories.map((c) => db.deleteCategory(c.id)));
    // Write new
    await Promise.all(data.categories.map((c, i) => db.upsertCategory(c, i)));
    await Promise.all(data.items.map((i) => db.upsertItem(i)));
    await db.saveSettings(data.totalBudget, true);
    set({
      onboardingComplete: true,
      totalBudget: data.totalBudget,
      categories: data.categories,
      items: data.items,
    });
  },
}));
