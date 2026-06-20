'use client';
import { supabase } from '../supabase';
import { ApartmentPlan, emptyPlan } from './types';

// Persistence for the apartment plan.
// Strategy: a single JSONB document. Try Supabase first (cross-device),
// always mirror to localStorage so the feature works offline / before the
// `apartment_plan` migration is pushed. The moment the table exists, sync
// activates automatically with no code change.

// Per-user "profile memory": the plan + advisor history are scoped to the
// signed-in user (separate localStorage key and separate apartment_plan row),
// so each profile keeps its own plan, style and AI conversation.
async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
const lsKey = (uid: string | null) => (uid ? `apartment_plan_${uid}` : 'apartment_plan_v1');
const docId = (uid: string | null) => uid ?? 'main';

function readLocal(uid: string | null): ApartmentPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(lsKey(uid));
    if (!raw) return null;
    return JSON.parse(raw) as ApartmentPlan;
  } catch {
    return null;
  }
}

function writeLocal(uid: string | null, plan: ApartmentPlan) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(lsKey(uid), JSON.stringify(plan));
  } catch {
    // storage full (large floor-plan image) — drop the image and retry
    try {
      window.localStorage.setItem(lsKey(uid), JSON.stringify({ ...plan, floorPlanImage: null }));
    } catch {
      /* give up silently */
    }
  }
}

function isMeaningful(plan: ApartmentPlan | null | undefined): plan is ApartmentPlan {
  return !!plan && (
    (plan.rooms?.length ?? 0) > 0 ||
    (plan.items?.length ?? 0) > 0 ||
    (plan.chat?.length ?? 0) > 0 ||
    !!plan.floorPlanImage ||
    !!plan.style?.style ||
    (plan.style?.budget ?? 0) > 0
  );
}

export async function loadPlan(): Promise<ApartmentPlan> {
  const uid = await currentUserId();
  const local = readLocal(uid);
  // Try remote (this user's own plan row)
  try {
    const { data, error } = await supabase
      .from('apartment_plan')
      .select('data')
      .eq('id', docId(uid))
      .single();
    if (!error && data) {
      const remote = data.data as ApartmentPlan;
      if (isMeaningful(remote)) {
        writeLocal(uid, remote);
        return normalize(remote);
      }
    }
  } catch {
    /* table missing / offline — fall through to local */
  }
  if (local) return normalize(local);
  return emptyPlan();
}

export async function savePlan(plan: ApartmentPlan): Promise<void> {
  const uid = await currentUserId();
  const stamped = { ...plan, updatedAt: new Date().toISOString() };
  writeLocal(uid, stamped);
  try {
    await supabase
      .from('apartment_plan')
      .upsert({ id: docId(uid), data: stamped, updated_at: stamped.updatedAt });
  } catch {
    /* remote unavailable — local copy already persisted */
  }
}

/** Backfill any missing fields so older saved docs stay valid. */
function normalize(plan: ApartmentPlan): ApartmentPlan {
  const base = emptyPlan();
  return {
    ...base,
    ...plan,
    style: { ...base.style, ...(plan.style ?? {}) },
    rooms: plan.rooms ?? [],
    items: plan.items ?? [],
    chat: plan.chat ?? [],
  };
}
