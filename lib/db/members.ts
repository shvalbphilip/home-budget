'use client';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/lib/auth/permissions';

export interface ProjectInfo {
  id: string;
  name: string;
  owner_id: string | null;
  total_budget: number;
  currency: string;
}

export interface MemberRow {
  id: string;
  user_id: string;
  role: Role;
  can_delete: boolean;
  full_name: string | null;
  is_global_admin: boolean;
}

export async function fetchProject(projectId: string): Promise<ProjectInfo | null> {
  const { data } = await supabase.from('apartment_projects').select('id, name, owner_id, total_budget, currency').eq('id', projectId).single();
  return (data as ProjectInfo) ?? null;
}

export async function updateProject(projectId: string, patch: Partial<ProjectInfo>): Promise<void> {
  await supabase.from('apartment_projects').update(patch).eq('id', projectId);
}

export async function fetchMembers(projectId: string): Promise<MemberRow[]> {
  const { data: members } = await supabase
    .from('project_members')
    .select('id, user_id, role, can_delete')
    .eq('project_id', projectId);
  if (!members) return [];

  const ids = members.map((m) => m.user_id);
  const [{ data: profs }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', ids),
    supabase.from('user_roles').select('user_id, role').in('user_id', ids),
  ]);
  const nameMap: Record<string, string | null> = {};
  profs?.forEach((p) => { nameMap[p.id] = p.full_name; });
  const adminSet = new Set((roles ?? []).filter((r) => r.role === 'admin').map((r) => r.user_id));

  return members.map((m) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role as Role,
    can_delete: m.can_delete,
    full_name: nameMap[m.user_id] ?? null,
    is_global_admin: adminSet.has(m.user_id),
  }));
}

export async function setMemberRole(memberId: string, role: Role): Promise<void> {
  await supabase.from('project_members').update({ role }).eq('id', memberId);
}

export async function setMemberCanDelete(memberId: string, canDelete: boolean): Promise<void> {
  await supabase.from('project_members').update({ can_delete: canDelete }).eq('id', memberId);
}
