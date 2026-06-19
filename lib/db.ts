'use client';
import { supabase } from './supabase';
import { Category, Item } from './types';

// ── Settings ──────────────────────────────────────────────────────────────
export async function fetchSettings() {
  const { data } = await supabase.from('settings').select('*').eq('id', 'main').single();
  return data as { total_budget: number; onboarding_complete: boolean } | null;
}

export async function saveSettings(totalBudget: number, onboardingComplete: boolean) {
  await supabase.from('settings').upsert({
    id: 'main',
    total_budget: totalBudget,
    onboarding_complete: onboardingComplete,
    updated_at: new Date().toISOString(),
  });
}

// ── Categories ────────────────────────────────────────────────────────────
export async function fetchCategories(): Promise<Category[]> {
  const { data } = await supabase.from('categories').select('*').order('sort_order');
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    plannedBudget: Number(r.planned_budget),
  }));
}

export async function upsertCategory(cat: Category, sortOrder: number) {
  await supabase.from('categories').upsert({
    id: cat.id,
    name: cat.name,
    emoji: cat.emoji,
    planned_budget: cat.plannedBudget,
    sort_order: sortOrder,
  });
}

export async function deleteCategory(id: string) {
  await supabase.from('categories').delete().eq('id', id);
}

// ── Items ─────────────────────────────────────────────────────────────────
export async function fetchItems(): Promise<Item[]> {
  const { data } = await supabase.from('items').select('*').order('created_at');
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    categoryId: r.category_id,
    status: r.status,
    quantity: r.quantity,
    estimatedPrice: Number(r.estimated_price),
    actualPrice: Number(r.actual_price),
    store: r.store ?? '',
    priority: r.priority,
    notes: r.notes ?? '',
    purchaseDate: r.purchase_date ?? '',
    link: r.link ?? '',
    isEssential: r.is_essential,
    createdAt: r.created_at,
  }));
}

export async function upsertItem(item: Item) {
  await supabase.from('items').upsert({
    id: item.id,
    name: item.name,
    category_id: item.categoryId,
    status: item.status,
    quantity: item.quantity,
    estimated_price: item.estimatedPrice,
    actual_price: item.actualPrice,
    store: item.store,
    priority: item.priority,
    notes: item.notes,
    purchase_date: item.purchaseDate,
    link: item.link,
    is_essential: item.isEssential,
    created_at: item.createdAt,
  });
}

export async function deleteItem(id: string) {
  await supabase.from('items').delete().eq('id', id);
}

export async function deleteItemsByCategoryId(categoryId: string) {
  await supabase.from('items').delete().eq('category_id', categoryId);
}

// ── Full load ─────────────────────────────────────────────────────────────
export async function loadAll() {
  const [settings, categories, items] = await Promise.all([
    fetchSettings(),
    fetchCategories(),
    fetchItems(),
  ]);
  return { settings, categories, items };
}
