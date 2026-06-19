'use client';
import { supabase } from '@/lib/supabase';

export interface ActivityRow {
  id: string;
  project_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
  actor_name?: string;
}

/** Append an immutable audit entry. Fire-and-forget; never throws to the UI. */
export async function logActivity(
  projectId: string | null,
  action: string,
  opts: { entityType?: string; entityId?: string; summary?: string; details?: Record<string, unknown> } = {},
): Promise<void> {
  if (!projectId) return;
  try {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from('activity_log').insert({
      project_id: projectId,
      user_id: u.user?.id ?? null,
      action,
      entity_type: opts.entityType ?? '',
      entity_id: opts.entityId ?? '',
      summary: opts.summary ?? '',
      details: opts.details ?? {},
    });
  } catch {
    /* logging must never break the action it records */
  }
}

export async function fetchActivity(projectId: string, limit = 100): Promise<ActivityRow[]> {
  const { data: rows } = await supabase
    .from('activity_log')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (!rows) return [];

  // resolve actor names
  const ids = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];
  const names: Record<string, string> = {};
  if (ids.length) {
    const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids);
    profs?.forEach((p) => { names[p.id] = p.full_name ?? '—'; });
  }
  return rows.map((r) => ({ ...r, actor_name: r.user_id ? (names[r.user_id] ?? '—') : 'מערכת' })) as ActivityRow[];
}
