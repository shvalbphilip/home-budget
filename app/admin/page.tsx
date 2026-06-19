'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fmt } from '@/lib/planning/geometry';
import {
  fetchProject, updateProject, fetchMembers, setMemberRole, setMemberCanDelete,
  ProjectInfo, MemberRow,
} from '@/lib/db/members';
import { fetchActivity, ActivityRow, logActivity } from '@/lib/db/activity';
import { ShieldCheck, Users, Settings2, ScrollText, Crown, User as UserIcon, Save } from 'lucide-react';

export default function AdminPage() {
  const { enabled, isAdmin, projectId, profile } = useAuth();
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    const [proj, mem, act] = await Promise.all([fetchProject(projectId), fetchMembers(projectId), fetchActivity(projectId)]);
    setProject(proj); setMembers(mem); setActivity(act);
    if (proj) { setName(proj.name); setBudget(String(proj.total_budget || '')); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (!enabled) return <Notice title="מערכת המשתמשים כבויה" body="הפעילו NEXT_PUBLIC_AUTH_ENABLED=true והריצו את המיגרציה. ראו SETUP_AUTH.md." />;
  if (!isAdmin) return <Notice title="אין הרשאת גישה" body="אזור זה מיועד למנהל המערכת בלבד." />;
  if (!projectId) return <Notice title="לא נמצא פרויקט" body="צרו פרויקט ושייכו משתמשים. ראו SETUP_AUTH.md." />;

  const saveProject = async () => {
    await updateProject(projectId, { name: name.trim(), total_budget: Number(budget) || 0 });
    await logActivity(projectId, 'עדכון הגדרות פרויקט', { summary: `${name} · ${fmt(Number(budget) || 0)}` });
    load();
  };

  const input = 'px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400 bg-white';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-stone-900 flex items-center gap-2">
          <ShieldCheck size={22} className="text-amber-500" /> ניהול
        </h1>
        <p className="text-stone-500 text-xs md:text-sm mt-0.5">שלום {profile?.full_name ?? 'מנהל'} · ניהול משתמשים, הרשאות, הגדרות ויומן פעילות</p>
      </div>

      {loading ? (
        <div className="glass-card rounded-3xl p-10 text-center text-stone-400">טוען...</div>
      ) : (
        <>
          {/* Project settings */}
          <div className="glass-card rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2"><Settings2 size={18} className="text-stone-500" /><h2 className="font-bold text-stone-800">הגדרות הפרויקט</h2></div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">שם הפרויקט</label>
                <input className={input + ' w-full'} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">תקציב כולל (₪)</label>
                <input className={input + ' w-full'} type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
            </div>
            <button onClick={saveProject} className="flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95"
              style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)' }}><Save size={15} /> שמור</button>
          </div>

          {/* Members */}
          <div className="glass-card rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2"><Users size={18} className="text-stone-500" /><h2 className="font-bold text-stone-800">משתמשים והרשאות</h2></div>
            {members.length === 0 && <p className="text-stone-400 text-sm">אין משתמשים משויכים. ראו SETUP_AUTH.md ליצירת Philip ו-Ben.</p>}
            {members.map((m) => (
              <div key={m.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.5)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.role === 'admin' ? 'rgba(245,158,11,0.18)' : 'rgba(120,113,108,0.12)' }}>
                  {m.role === 'admin' ? <Crown size={17} className="text-amber-600" /> : <UserIcon size={17} className="text-stone-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800">{m.full_name ?? '—'}</p>
                  <p className="text-[11px] text-stone-400">{m.role === 'admin' ? 'מנהל' : 'משתמש'}{m.is_global_admin ? ' · אדמין מערכת' : ''}</p>
                </div>
                <select value={m.role ?? 'member'} onChange={(e) => setMemberRole(m.id, e.target.value as MemberRow['role']).then(load)} className={input}>
                  <option value="admin">מנהל</option>
                  <option value="member">משתמש</option>
                </select>
                <label className="flex items-center gap-1.5 text-xs text-stone-600 select-none">
                  <input type="checkbox" checked={m.can_delete} onChange={(e) => setMemberCanDelete(m.id, e.target.checked).then(load)} className="w-4 h-4 accent-amber-500" />
                  מחיקה
                </label>
              </div>
            ))}
            <p className="text-[11px] text-stone-400">יצירת/מחיקת חשבונות מתבצעת ב-Supabase Auth. כאן מנהלים תפקיד והרשאת מחיקה בתוך הפרויקט.</p>
          </div>

          {/* Activity log */}
          <div className="glass-card rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2"><ScrollText size={18} className="text-stone-500" /><h2 className="font-bold text-stone-800">יומן פעילות</h2></div>
            {activity.length === 0 ? (
              <p className="text-stone-400 text-sm">אין פעילות מתועדת עדיין.</p>
            ) : (
              <div className="divide-y divide-white/60 max-h-[420px] overflow-auto">
                {activity.map((a) => (
                  <div key={a.id} className="py-2.5 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-800"><span className="font-semibold">{a.actor_name}</span> · {a.action}{a.summary ? ` — ${a.summary}` : ''}</p>
                      <p className="text-[11px] text-stone-400">{new Date(a.created_at).toLocaleString('he-IL')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="glass-card rounded-3xl p-8 text-center space-y-2">
        <div className="text-3xl">🔒</div>
        <h1 className="font-bold text-stone-800">{title}</h1>
        <p className="text-stone-500 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
