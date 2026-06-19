import { supabase } from '@/lib/supabase';

// Thin, defensively-typed wrapper around Supabase MFA (phone / SMS factor).
// Typed locally so it compiles regardless of the SDK version's MFA typings.
interface Factor { id: string; factor_type: string; status: string }
interface MfaApi {
  listFactors(): Promise<{ data: { all?: Factor[]; totp?: Factor[]; phone?: Factor[] } | null; error: { message: string } | null }>;
  getAuthenticatorAssuranceLevel(): Promise<{ data: { currentLevel: string | null; nextLevel: string | null } | null; error: unknown }>;
  enroll(p: { factorType: 'phone'; phone: string }): Promise<{ data: { id: string } | null; error: { message: string } | null }>;
  challenge(p: { factorId: string }): Promise<{ data: { id: string } | null; error: { message: string } | null }>;
  verify(p: { factorId: string; challengeId: string; code: string }): Promise<{ data: unknown; error: { message: string } | null }>;
}
const mfa = supabase.auth.mfa as unknown as MfaApi;

function allFactors(d: { all?: Factor[]; totp?: Factor[]; phone?: Factor[] } | null): Factor[] {
  if (!d) return [];
  return d.all ?? [...(d.phone ?? []), ...(d.totp ?? [])];
}

/** Does the current session still need a second factor to reach AAL2? */
export async function needsSecondFactor(): Promise<boolean> {
  const { data } = await mfa.getAuthenticatorAssuranceLevel();
  return !!data && data.nextLevel === 'aal2' && data.currentLevel !== 'aal2';
}

export async function getVerifiedPhoneFactor(): Promise<string | null> {
  const { data } = await mfa.listFactors();
  const f = allFactors(data).find((x) => x.factor_type === 'phone' && x.status === 'verified');
  return f?.id ?? null;
}

/** Enroll a new phone factor and send the first SMS code. */
export async function startPhoneEnrollment(phone: string): Promise<{ factorId: string; challengeId: string } | { error: string }> {
  const { data: e, error: enrollErr } = await mfa.enroll({ factorType: 'phone', phone });
  if (enrollErr || !e) return { error: enrollErr?.message ?? 'רישום הטלפון נכשל' };
  const { data: c, error: chErr } = await mfa.challenge({ factorId: e.id });
  if (chErr || !c) return { error: chErr?.message ?? 'שליחת קוד נכשלה' };
  return { factorId: e.id, challengeId: c.id };
}

/** Send a fresh SMS code for an already-enrolled factor. */
export async function challengeFactor(factorId: string): Promise<{ challengeId: string } | { error: string }> {
  const { data, error } = await mfa.challenge({ factorId });
  if (error || !data) return { error: error?.message ?? 'שליחת קוד נכשלה' };
  return { challengeId: data.id };
}

export async function verifyCode(factorId: string, challengeId: string, code: string): Promise<{ ok: true } | { error: string }> {
  const { error } = await mfa.verify({ factorId, challengeId, code });
  if (error) return { error: error.message };
  return { ok: true };
}
