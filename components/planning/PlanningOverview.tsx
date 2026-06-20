'use client';
import { useRef, useState } from 'react';
import { usePlanningStore } from '@/lib/planning/store';
import { getPlanSummary, fmt } from '@/lib/planning/geometry';
import { exportPlanToExcel, downloadPlanJSON, parsePlanJSON } from '@/lib/planning/export';
import { emptyPlan } from '@/lib/planning/types';
import ProgressBar from '@/components/ProgressBar';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  Wallet, Package, Sparkles, FileSpreadsheet,
  Download, Upload, RotateCcw, Database, Activity, HardHat, Sofa,
  CheckCircle2, Clock, AlertTriangle,
} from 'lucide-react';

const STYLES = ['מודרני', 'סקנדינבי', 'כפרי', 'תעשייתי', 'בוהו', 'קלאסי', 'מינימליסטי'];

export default function PlanningOverview() {
  const { rooms, items, style, setStyle, loadSample, reset, importPlan } = usePlanningStore();
  const summary = getPlanSummary(rooms, items, style.budget);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<null | 'sample' | 'reset'>(null);

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importPlan(parsePlanJSON(text));
      alert('התכנון יובא בהצלחה');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ייבוא נכשל');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const input = 'w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400 bg-white';

  const stat = (icon: React.ReactNode, label: string, value: string, tint: string) => (
    <div className="glass-card rounded-2xl p-3 flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: tint }}>{icon}</div>
      <div>
        <p className="text-[11px] text-stone-500">{label}</p>
        <p className="font-bold text-stone-900 text-sm leading-tight">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Style profile */}
      <div className="glass-card rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          <h2 className="font-bold text-stone-800">פרופיל הסגנון שלכם</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">סגנון מועדף</label>
            <div className="flex gap-2 flex-wrap">
              {STYLES.map((s) => (
                <button key={s} onClick={() => setStyle({ style: style.style === s ? '' : s })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${style.style === s ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">תקציב כולל (₪)</label>
            <input type="number" min={0} className={input} value={style.budget || ''} placeholder="0"
              onChange={(e) => setStyle({ budget: Number(e.target.value) })} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">הכי חשוב לכם</label>
            <input className={input} value={style.topPriorities} placeholder="לדוגמה: מטבח, חדר שינה"
              onChange={(e) => setStyle({ topPriorities: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">הערות בני/בת הזוג</label>
            <input className={input} value={style.partnerNotes} placeholder="מה חשוב לבן/בת הזוג"
              onChange={(e) => setStyle({ partnerNotes: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Money stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stat(<Wallet size={18} className="text-amber-600" />, 'עלות כוללת', fmt(summary.totalActual), 'rgba(245,158,11,0.18)')}
        {stat(<CheckCircle2 size={18} className="text-emerald-600" />, 'שולם', fmt(summary.totalPaid), 'rgba(34,197,94,0.15)')}
        {stat(<Clock size={18} className="text-red-600" />, 'נשאר לשלם', fmt(summary.totalRemaining), 'rgba(239,68,68,0.13)')}
        {stat(<Activity size={18} className="text-violet-600" />, 'בריאות תקציב', `${summary.healthScore}/100`, 'rgba(139,92,246,0.15)')}
      </div>

      {/* Budget health */}
      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={18} className="text-amber-500" />
          <h2 className="font-bold text-stone-800">בריאות התקציב</h2>
        </div>
        {summary.globalBudget > 0 ? (
          <>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs text-stone-500">מתוך תקציב כולל {fmt(summary.globalBudget)}</p>
                <p className="text-2xl font-bold text-stone-900">{fmt(summary.totalActual)}</p>
              </div>
              <p className={`font-bold ${summary.budgetDiff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {summary.budgetDiff < 0 ? `חריגה ${fmt(-summary.budgetDiff)}` : `נותר ${fmt(summary.budgetDiff)}`}
              </p>
            </div>
            <ProgressBar value={Math.round((summary.totalActual / summary.globalBudget) * 100)} color={summary.overBudget ? 'red' : 'amber'} />
          </>
        ) : (
          <p className="text-stone-400 text-sm">תקציב כולל אופציונלי — כל פריט מתווסף אוטומטית לסה״כ הדירה ({fmt(summary.totalActual)}).</p>
        )}

        {/* furniture vs contractor */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-2xl p-3" style={{ background: 'rgba(59,130,246,0.08)' }}>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium"><Sofa size={14} /> ריהוט ומוצרים</div>
            <p className="font-bold text-stone-800">{fmt(summary.furnitureTotal)}</p>
          </div>
          <div className="rounded-2xl p-3" style={{ background: 'rgba(139,92,246,0.08)' }}>
            <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium"><HardHat size={14} /> קבלן ושיפוץ</div>
            <p className="font-bold text-stone-800">{fmt(summary.contractorTotal)}</p>
          </div>
        </div>

        {/* over-budget warnings */}
        {summary.overBudgetRooms.length > 0 && (
          <div className="mt-3 rounded-2xl p-3 flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">
              חדרים בחריגה: {summary.overBudgetRooms.map((r) => `${r.name} (+${fmt(r.over)})`).join(' · ')}
            </p>
          </div>
        )}
      </div>

      {/* By category */}
      {summary.byCategory.length > 0 && (
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-amber-500" />
            <h2 className="font-bold text-stone-800">פירוט לפי קטגוריה</h2>
          </div>
          <div className="space-y-2">
            {summary.byCategory.slice(0, 12).map((c) => {
              const maxA = summary.byCategory[0].actual || 1;
              return (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-stone-600">{c.category} <span className="text-stone-400">({c.count})</span></span>
                    <span className="font-semibold text-stone-700">{fmt(c.actual)}{c.paid > 0 && <span className="text-emerald-600 font-normal"> · שולם {fmt(c.paid)}</span>}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.round((c.actual / maxA) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data management */}
      <div className="glass-card rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-stone-500" />
          <h2 className="font-bold text-stone-800">נתונים וייצוא</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => exportPlanToExcel(rooms, items, style)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95"
            style={{ background: 'linear-gradient(145deg,#22c55e,#16a34a)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
            <FileSpreadsheet size={16} /> ייצוא Excel
          </button>
          <button onClick={() => downloadPlanJSON({ ...emptyPlan(), rooms, items, style })}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold glass-card text-stone-700 active:scale-95">
            <Download size={16} /> גיבוי JSON
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold glass-card text-stone-700 active:scale-95">
            <Upload size={16} /> שחזור מגיבוי
          </button>
          <button onClick={() => setConfirm('sample')}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold glass-card text-stone-700 active:scale-95">
            <Sparkles size={16} /> נתוני דוגמה
          </button>
        </div>
        <button onClick={() => setConfirm('reset')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-95">
          <RotateCcw size={16} /> איפוס התכנון מאפס
        </button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
      </div>

      <ConfirmDialog
        open={confirm === 'sample'}
        title="טעינת נתוני דוגמה"
        message="פעולה זו תחליף את התכנון הנוכחי בנתוני דוגמה. להמשיך?"
        confirmLabel="טען דוגמה"
        onConfirm={() => { loadSample(); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'reset'}
        title="איפוס התכנון"
        message="כל החדרים, הפריטים, הסגנון והשיחות יימחקו. פעולה זו אינה ניתנת לביטול."
        confirmLabel="אפס הכול"
        danger
        onConfirm={() => { reset(); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
