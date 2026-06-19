'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fmt } from '@/lib/planning/geometry';
import {
  fetchPayments, createPayment, markPaid, deletePayment,
  fetchCosts, createCost, deleteCost,
  Payment, ContractorCost, COST_STATUSES, CostStatus,
} from '@/lib/db/payments';
import { logActivity } from '@/lib/db/activity';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Wallet, HardHat, Plus, Check, Trash2, CheckCircle2, Clock, Lock } from 'lucide-react';

export default function PaymentsPage() {
  const { enabled, projectId, can } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [costs, setCosts] = useState<ContractorCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'payments' | 'costs'>('payments');
  const [del, setDel] = useState<{ kind: 'payment' | 'cost'; id: string; name: string } | null>(null);

  // add forms
  const [pTitle, setPTitle] = useState(''); const [pAmount, setPAmount] = useState(''); const [pDue, setPDue] = useState('');
  const [cName, setCName] = useState(''); const [cDesc, setCDesc] = useState(''); const [cAmount, setCAmount] = useState(''); const [cStatus, setCStatus] = useState<CostStatus>('הצעת מחיר');

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    const [p, c] = await Promise.all([fetchPayments(projectId), fetchCosts(projectId)]);
    setPayments(p); setCosts(c); setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (enabled && !projectId) {
    return <Notice title="לא משויכים לפרויקט" body="המנהל צריך לשייך אתכם לפרויקט הדירה. ראו SETUP_AUTH.md." />;
  }
  if (!enabled) {
    return <Notice title="תשלומים זמינים לאחר הפעלת המשתמשים" body="מודול התשלומים נשמר ב-Supabase תחת פרויקט. הפעילו את מערכת המשתמשים (NEXT_PUBLIC_AUTH_ENABLED=true) והריצו את המיגרציה כדי להשתמש בו. ראו SETUP_AUTH.md." />;
  }

  const addPayment = async () => {
    if (!pTitle.trim() || !projectId) return;
    const created = await createPayment({
      project_id: projectId, title: pTitle.trim(), amount: Number(pAmount) || 0,
      status: 'ממתין', paid: false, due_date: pDue || null, method: '',
      contractor_cost_id: null, notes: '',
    });
    if (created) { await logActivity(projectId, 'יצירת תשלום', { entityType: 'payment', entityId: created.id, summary: `${created.title} · ${fmt(created.amount)}` }); }
    setPTitle(''); setPAmount(''); setPDue(''); load();
  };

  const togglePaid = async (p: Payment) => {
    await markPaid(p.id, !p.paid);
    await logActivity(projectId!, p.paid ? 'ביטול סימון תשלום' : 'סימון תשלום כשולם', { entityType: 'payment', entityId: p.id, summary: `${p.title} · ${fmt(p.amount)}` });
    load();
  };

  const addCost = async () => {
    if (!cName.trim() || !projectId) return;
    const created = await createCost({
      project_id: projectId, room_id: null, contractor_name: cName.trim(),
      description: cDesc, amount: Number(cAmount) || 0, status: cStatus, due_date: null, notes: '',
    });
    if (created) await logActivity(projectId, 'הוספת עלות קבלן', { entityType: 'cost', entityId: created.id, summary: `${created.contractor_name} · ${fmt(created.amount)}` });
    setCName(''); setCDesc(''); setCAmount(''); setCStatus('הצעת מחיר'); load();
  };

  const totalPaid = payments.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => !p.paid && p.status !== 'בוטל').reduce((s, p) => s + p.amount, 0);
  const totalCosts = costs.reduce((s, c) => s + c.amount, 0);

  const input = 'px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400 bg-white';
  const canDelete = can('delete');

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Wallet size={22} className="text-amber-500" /> תשלומים ועלויות
        </h1>
        <p className="text-stone-500 text-xs md:text-sm mt-0.5">עקבו אחרי תשלומים בפועל, עלויות קבלנים ומה עוד צריך לשלם</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="שולם" value={fmt(totalPaid)} icon={<CheckCircle2 size={18} className="text-emerald-600" />} tint="rgba(34,197,94,0.15)" />
        <Stat label="ממתין לתשלום" value={fmt(totalPending)} icon={<Clock size={18} className="text-amber-600" />} tint="rgba(245,158,11,0.18)" />
        <Stat label="עלויות קבלנים" value={fmt(totalCosts)} icon={<HardHat size={18} className="text-violet-600" />} tint="rgba(139,92,246,0.15)" />
      </div>

      <div className="glass-card rounded-2xl p-1 flex gap-1">
        <button onClick={() => setTab('payments')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${tab === 'payments' ? 'text-white' : 'text-stone-500'}`}
          style={tab === 'payments' ? { background: 'linear-gradient(145deg,#fbbf24,#f59e0b)' } : {}}>תשלומים</button>
        <button onClick={() => setTab('costs')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${tab === 'costs' ? 'text-white' : 'text-stone-500'}`}
          style={tab === 'costs' ? { background: 'linear-gradient(145deg,#fbbf24,#f59e0b)' } : {}}>עלויות קבלנים</button>
      </div>

      {loading ? (
        <div className="glass-card rounded-3xl p-10 text-center text-stone-400">טוען...</div>
      ) : tab === 'payments' ? (
        <div className="space-y-3">
          <div className="glass-card rounded-3xl p-4 flex flex-wrap gap-2 items-end">
            <input className={input + ' flex-1 min-w-40'} placeholder="תיאור התשלום" value={pTitle} onChange={(e) => setPTitle(e.target.value)} />
            <input className={input + ' w-28'} type="number" placeholder="סכום ₪" value={pAmount} onChange={(e) => setPAmount(e.target.value)} />
            <input className={input + ' w-40'} type="date" value={pDue} onChange={(e) => setPDue(e.target.value)} />
            <button onClick={addPayment} className="flex items-center gap-1 text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95"
              style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)' }}><Plus size={15} /> הוסף</button>
          </div>

          {payments.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center text-stone-400 text-sm">אין תשלומים עדיין</div>
          ) : payments.map((p) => (
            <div key={p.id} className="glass-card rounded-2xl p-4 flex items-center gap-3">
              <button onClick={() => togglePaid(p)} title={p.paid ? 'בטל סימון' : 'סמן כשולם'}
                className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${p.paid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300 text-transparent hover:border-emerald-400'}`}>
                <Check size={15} />
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${p.paid ? 'line-through text-stone-400' : 'text-stone-800'}`}>{p.title}</p>
                <p className="text-xs text-stone-400">{p.due_date ? `לתשלום עד ${p.due_date}` : 'ללא תאריך'} · {p.status}</p>
              </div>
              <span className="font-bold text-stone-800">{fmt(p.amount)}</span>
              {canDelete && (
                <button onClick={() => setDel({ kind: 'payment', id: p.id, name: p.title })} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500"><Trash2 size={15} /></button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="glass-card rounded-3xl p-4 flex flex-wrap gap-2 items-end">
            <input className={input + ' flex-1 min-w-32'} placeholder="שם הקבלן" value={cName} onChange={(e) => setCName(e.target.value)} />
            <input className={input + ' flex-1 min-w-32'} placeholder="תיאור עבודה" value={cDesc} onChange={(e) => setCDesc(e.target.value)} />
            <input className={input + ' w-28'} type="number" placeholder="סכום ₪" value={cAmount} onChange={(e) => setCAmount(e.target.value)} />
            <select className={input} value={cStatus} onChange={(e) => setCStatus(e.target.value as CostStatus)}>
              {COST_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={addCost} className="flex items-center gap-1 text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95"
              style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)' }}><Plus size={15} /> הוסף</button>
          </div>

          {costs.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center text-stone-400 text-sm">אין עלויות קבלנים עדיין</div>
          ) : costs.map((c) => (
            <div key={c.id} className="glass-card rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.15)' }}><HardHat size={17} className="text-violet-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800">{c.contractor_name}</p>
                <p className="text-xs text-stone-400">{c.description || '—'} · {c.status}</p>
              </div>
              <span className="font-bold text-stone-800">{fmt(c.amount)}</span>
              {canDelete && (
                <button onClick={() => setDel({ kind: 'cost', id: c.id, name: c.contractor_name })} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500"><Trash2 size={15} /></button>
              )}
            </div>
          ))}
        </div>
      )}

      {!canDelete && (
        <p className="text-[11px] text-stone-400 flex items-center gap-1 justify-center"><Lock size={11} /> מחיקה מותרת למנהל בלבד</p>
      )}

      <ConfirmDialog
        open={!!del}
        title="מחיקה"
        message={`למחוק את "${del?.name}"?`}
        confirmLabel="מחק" danger
        onConfirm={async () => {
          if (del?.kind === 'payment') { await deletePayment(del.id); await logActivity(projectId!, 'מחיקת תשלום', { entityId: del.id, summary: del.name }); }
          else if (del) { await deleteCost(del.id); await logActivity(projectId!, 'מחיקת עלות קבלן', { entityId: del.id, summary: del.name }); }
          setDel(null); load();
        }}
        onCancel={() => setDel(null)}
      />
    </div>
  );
}

function Stat({ label, value, icon, tint }: { label: string; value: string; icon: React.ReactNode; tint: string }) {
  return (
    <div className="glass-card rounded-2xl p-3 flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint }}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-stone-500">{label}</p>
        <p className="font-bold text-stone-900 text-sm leading-tight">{value}</p>
      </div>
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
