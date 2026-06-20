'use client';
import { useState, useEffect } from 'react';
import { usePlanningStore } from '@/lib/planning/store';
import { useStore } from '@/lib/store';
import { getPlanSummary, getRoomStats, fmt } from '@/lib/planning/geometry';
import ProgressBar from '@/components/ProgressBar';
import { Wallet, Check, AlertTriangle, Activity, CheckCircle2, Clock, DownloadCloud } from 'lucide-react';
import Link from 'next/link';

const budgetStatusStyle: Record<string, string> = {
  'עומד בתקציב': 'bg-emerald-100 text-emerald-700',
  'קרוב לחריגה': 'bg-amber-100 text-amber-700',
  'חורג מהתקציב': 'bg-red-100 text-red-700',
  'שולם מלא': 'bg-blue-100 text-blue-700',
  'בתהליך': 'bg-stone-100 text-stone-600',
};

export default function BudgetPage() {
  const { loaded, load, rooms, items, style, setStyle, updateRoom } = usePlanningStore();
  const legacy = useStore();
  const [editTotal, setEditTotal] = useState('');
  const [editRoom, setEditRoom] = useState<Record<string, string>>({});
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);
  useEffect(() => { setEditTotal(String(style.budget || '')); }, [style.budget, loaded]);

  const flash = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 2200); };
  const summary = getPlanSummary(rooms, items, style.budget);

  if (!loaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto mt-20">
        <Wallet size={48} className="text-stone-300 mx-auto" />
        <p className="text-stone-500">התקציב מחושב מהחדרים והפריטים בתכנון הדירה. הוסיפו חדרים כדי להתחיל.</p>
        <Link href="/planning" className="inline-block text-white px-5 py-3 rounded-xl font-semibold"
          style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)' }}>
          לתכנון הדירה
        </Link>
      </div>
    );
  }

  // one-click import of budgets previously set in the legacy category page
  const canImport = legacy.totalBudget > 0 || legacy.categories.some((c) => c.plannedBudget > 0);
  const importLegacy = () => {
    if (legacy.totalBudget > 0 && !style.budget) setStyle({ budget: legacy.totalBudget });
    rooms.forEach((r) => {
      if ((r.plannedBudget || 0) === 0) {
        const c = legacy.categories.find((cat) => cat.name === r.name && cat.plannedBudget > 0);
        if (c) updateRoom(r.id, { plannedBudget: c.plannedBudget });
      }
    });
    flash('התקציבים יובאו מהקטגוריות ✅');
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 max-w-3xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-stone-900 flex items-center gap-2">
        <Wallet size={22} className="text-amber-500" /> תכנון תקציב
      </h1>

      {savedMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
          <Check size={16} /> {savedMsg}
        </div>
      )}

      {/* Global budget */}
      <div className="glass-card rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-800">תקציב כולל לדירה (אופציונלי)</h2>
          {canImport && (
            <button onClick={importLegacy} className="flex items-center gap-1 text-xs text-amber-600 font-semibold hover:text-amber-700">
              <DownloadCloud size={14} /> ייבא מהקטגוריות
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">₪</span>
            <input type="number" value={editTotal} onChange={(e) => setEditTotal(e.target.value)}
              className="w-full pr-8 pl-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400 bg-white"
              min={0} placeholder="הכנס תקציב..." />
          </div>
          <button onClick={() => { setStyle({ budget: Number(editTotal) || 0 }); flash('התקציב הכולל נשמר ✅'); }}
            className="px-5 py-2.5 text-white rounded-xl font-semibold text-sm"
            style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)' }}>
            שמור
          </button>
        </div>

        {/* live totals from the plan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(245,158,11,0.10)' }}>
            <div className="flex items-center justify-center gap-1 text-[11px] text-amber-600"><Wallet size={12} /> עלות כוללת</div>
            <p className="font-bold text-stone-800 text-sm">{fmt(summary.totalActual)}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(34,197,94,0.10)' }}>
            <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-600"><CheckCircle2 size={12} /> שולם</div>
            <p className="font-bold text-stone-800 text-sm">{fmt(summary.totalPaid)}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(239,68,68,0.08)' }}>
            <div className="flex items-center justify-center gap-1 text-[11px] text-red-500"><Clock size={12} /> נשאר לשלם</div>
            <p className="font-bold text-stone-800 text-sm">{fmt(summary.totalRemaining)}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(139,92,246,0.10)' }}>
            <div className="flex items-center justify-center gap-1 text-[11px] text-violet-600"><Activity size={12} /> בריאות</div>
            <p className="font-bold text-stone-800 text-sm">{summary.healthScore}/100</p>
          </div>
        </div>

        {summary.globalBudget > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-stone-500">{fmt(summary.totalActual)} מתוך {fmt(summary.globalBudget)}</span>
              <span className={`font-semibold ${summary.budgetDiff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {summary.budgetDiff < 0 ? `חריגה ${fmt(-summary.budgetDiff)}` : `נותר ${fmt(summary.budgetDiff)}`}
              </span>
            </div>
            <ProgressBar value={Math.round((summary.totalActual / summary.globalBudget) * 100)} color={summary.overBudget ? 'red' : 'amber'} showLabel />
          </div>
        )}
      </div>

      {/* Per-room budgets — same data as תכנון הדירה */}
      <div className="glass-card rounded-3xl p-5 space-y-3">
        <h2 className="font-bold text-stone-800">תקציב לפי חדר</h2>
        <p className="text-xs text-stone-400 -mt-1">העלות מחושבת אוטומטית מהפריטים שהוספתם בכל חדר בתכנון הדירה.</p>
        <div className="space-y-3">
          {rooms.map((room) => {
            const s = getRoomStats(room, items);
            const editVal = editRoom[room.id] ?? String(room.plannedBudget || '');
            const over = s.plannedBudget > 0 && s.actualCost > s.plannedBudget;
            return (
              <div key={room.id} className="rounded-2xl p-4" style={{ background: over ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.5)' }}>
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  <span className="font-semibold text-stone-800">{room.emoji} {room.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${budgetStatusStyle[s.budgetStatus]}`}>{s.budgetStatus}</span>
                  <div className="flex gap-2 flex-1 min-w-0 justify-end">
                    <div className="relative w-28">
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">₪</span>
                      <input type="number" value={editVal} onChange={(e) => setEditRoom((p) => ({ ...p, [room.id]: e.target.value }))}
                        className="w-full pr-6 pl-2 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 bg-white" min={0} placeholder="תקציב" />
                    </div>
                    <button onClick={() => { updateRoom(room.id, { plannedBudget: Number(editVal) || 0 }); flash(`תקציב ${room.name} נשמר ✅`); }}
                      className="px-3 py-1.5 text-white rounded-lg text-sm font-medium" style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)' }}>
                      שמור
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600 mb-2">
                  <span>בפועל: <strong>{fmt(s.actualCost)}</strong></span>
                  <span className="text-emerald-600">שולם: <strong>{fmt(s.paid)}</strong></span>
                  <span className="text-amber-600">נשאר: <strong>{fmt(s.remaining)}</strong></span>
                  {s.plannedBudget > 0 && (
                    <span className={s.diff < 0 ? 'text-red-600 font-semibold' : 'text-stone-500'}>
                      {s.diff < 0 ? `חריגה: ${fmt(-s.diff)}` : `פנוי: ${fmt(s.diff)}`}
                    </span>
                  )}
                  <span className="text-stone-400">{s.total} פריטים</span>
                  {over && <span className="flex items-center gap-1 text-red-600 font-medium"><AlertTriangle size={12} /> חריגה</span>}
                </div>
                {s.plannedBudget > 0 && <ProgressBar value={s.usedPct} color={over ? 'red' : s.usedPct >= 90 ? 'amber' : 'green'} showLabel height="sm" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* By category */}
      {summary.byCategory.length > 0 && (
        <div className="glass-card rounded-3xl p-5 space-y-3">
          <h2 className="font-bold text-stone-800">תקציב לפי קטגוריה</h2>
          {summary.byCategory.slice(0, 14).map((c) => {
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
      )}
    </div>
  );
}
