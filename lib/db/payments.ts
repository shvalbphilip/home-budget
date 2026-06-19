'use client';
import { supabase } from '@/lib/supabase';

export type PaymentStatus = 'ממתין' | 'שולם' | 'בוטל';
export type CostStatus = 'הצעת מחיר' | 'סוכם' | 'בתשלום' | 'הושלם';

export const PAYMENT_STATUSES: PaymentStatus[] = ['ממתין', 'שולם', 'בוטל'];
export const COST_STATUSES: CostStatus[] = ['הצעת מחיר', 'סוכם', 'בתשלום', 'הושלם'];

export interface Payment {
  id: string;
  project_id: string;
  title: string;
  amount: number;
  status: PaymentStatus;
  paid: boolean;
  paid_at: string | null;
  paid_by: string | null;
  due_date: string | null;
  method: string;
  contractor_cost_id: string | null;
  notes: string;
  created_at: string;
}

export interface ContractorCost {
  id: string;
  project_id: string;
  room_id: string | null;
  contractor_name: string;
  description: string;
  amount: number;
  status: CostStatus;
  due_date: string | null;
  notes: string;
  created_at: string;
}

// ── Payments ────────────────────────────────────────────────────────────────
export async function fetchPayments(projectId: string): Promise<Payment[]> {
  const { data } = await supabase.from('payments').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
  return (data ?? []) as Payment[];
}

export async function createPayment(p: Omit<Payment, 'id' | 'created_at' | 'paid_at' | 'paid_by'>): Promise<Payment | null> {
  const { data: u } = await supabase.auth.getUser();
  const { data } = await supabase.from('payments').insert({ ...p, created_by: u.user?.id ?? null }).select().single();
  return (data as Payment) ?? null;
}

export async function updatePayment(id: string, patch: Partial<Payment>): Promise<void> {
  await supabase.from('payments').update(patch).eq('id', id);
}

export async function markPaid(id: string, paid: boolean): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  await supabase.from('payments').update({
    paid,
    status: paid ? 'שולם' : 'ממתין',
    paid_at: paid ? new Date().toISOString() : null,
    paid_by: paid ? (u.user?.id ?? null) : null,
  }).eq('id', id);
}

export async function deletePayment(id: string): Promise<void> {
  await supabase.from('payments').delete().eq('id', id);
}

// ── Contractor costs ─────────────────────────────────────────────────────────
export async function fetchCosts(projectId: string): Promise<ContractorCost[]> {
  const { data } = await supabase.from('contractor_costs').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
  return (data ?? []) as ContractorCost[];
}

export async function createCost(c: Omit<ContractorCost, 'id' | 'created_at'>): Promise<ContractorCost | null> {
  const { data: u } = await supabase.auth.getUser();
  const { data } = await supabase.from('contractor_costs').insert({ ...c, created_by: u.user?.id ?? null }).select().single();
  return (data as ContractorCost) ?? null;
}

export async function updateCost(id: string, patch: Partial<ContractorCost>): Promise<void> {
  await supabase.from('contractor_costs').update(patch).eq('id', id);
}

export async function deleteCost(id: string): Promise<void> {
  await supabase.from('contractor_costs').delete().eq('id', id);
}
