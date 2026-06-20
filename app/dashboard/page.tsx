'use client';
import { useEffect } from 'react';
import { usePlanningStore } from '@/lib/planning/store';
import { getPlanSummary, getRoomStats, itemActual, fmt } from '@/lib/planning/geometry';
import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import AlertBanner from '@/components/AlertBanner';
import { Wallet, CheckCircle, AlertCircle, TrendingDown, Package, Home, Boxes, ChevronLeft, Clock, Activity } from 'lucide-react';
import Link from 'next/link';

const budgetStatusStyle: Record<string, string> = {
  'עומד בתקציב': 'bg-emerald-100 text-emerald-700',
  'קרוב לחריגה': 'bg-amber-100 text-amber-700',
  'חורג מהתקציב': 'bg-red-100 text-red-700',
  'שולם מלא': 'bg-blue-100 text-blue-700',
  'בתהליך': 'bg-stone-100 text-stone-600',
};

export default function Dashboard() {
  const { loaded, load, rooms, items, style } = usePlanningStore();
  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const summary = getPlanSummary(rooms, items, style.budget);

  const alerts = [
    ...summary.overBudgetRooms.map((r) => ({ type: 'error' as const, message: `חריגה מתקציב בחדר: ${r.name} (+${fmt(r.over)})` })),
    ...(summary.overBudget ? [{ type: 'error' as const, message: `חריגה מהתקציב הכולל: ${fmt(-summary.budgetDiff)}` }] : []),
  ];

  const highPriorityMissing = items
    .filter((i) => (i.status === 'חסר' || i.status === 'צריך לקנות') && i.priority === 'חובה')
    .slice(0, 5);

  if (!loaded) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (rooms.length === 0 && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
        <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Home size={40} className="text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">בואו נתחיל לתכנן</h1>
        <p className="text-stone-500 mb-6 max-w-sm">הוסיפו חדרים ופריטים בתכנון הדירה — התקציב יתעדכן אוטומטית.</p>
        <Link href="/planning" className="text-white px-5 py-3 rounded-xl font-semibold" style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)' }}>
          לתכנון הדירה
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Home size={22} className="text-amber-500" /> לוח בקרה
          </h1>
          <p className="text-stone-500 text-xs md:text-sm mt-0.5">סיכום תקציב ותכנון הדירה</p>
        </div>
        <Link href="/planning" className="glass-card px-3 py-2 rounded-xl text-sm font-semibold text-stone-600 flex items-center gap-1.5">
          <Boxes size={16} /> תכנון
        </Link>
      </div>

      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {/* Budget overview */}
      {summary.globalBudget > 0 ? (
        <div className="glass-card rounded-3xl p-5">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-sm text-stone-500">תקציב כולל</p>
              <p className="text-3xl font-bold text-stone-900">{fmt(summary.globalBudget)}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-stone-500">בריאות תקציב</p>
              <p className="text-xl font-bold text-amber-600">{summary.healthScore}/100</p>
            </div>
          </div>
          <ProgressBar value={Math.round((summary.totalActual / summary.globalBudget) * 100)} color={summary.overBudget ? 'red' : 'amber'} />
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-2xl p-3" style={{ background: 'rgba(245,158,11,0.10)' }}>
              <p className="text-xs text-amber-600 font-medium">עלות כוללת</p>
              <p className="text-lg font-bold text-stone-800">{fmt(summary.totalActual)}</p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: 'rgba(34,197,94,0.08)' }}>
              <p className="text-xs text-emerald-600 font-medium">שולם</p>
              <p className="text-lg font-bold text-emerald-700">{fmt(summary.totalPaid)}</p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: summary.budgetDiff < 0 ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)' }}>
              <p className={`text-xs font-medium ${summary.budgetDiff < 0 ? 'text-red-500' : 'text-blue-600'}`}>{summary.budgetDiff < 0 ? 'חריגה' : 'נותר'}</p>
              <p className={`text-lg font-bold ${summary.budgetDiff < 0 ? 'text-red-700' : 'text-blue-700'}`}>{fmt(Math.abs(summary.budgetDiff))}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-amber rounded-3xl p-4 flex items-center justify-between">
          <div>
            <p className="text-amber-800 text-sm font-medium">עלות מתוכננת: {fmt(summary.totalActual)}</p>
            <p className="text-amber-700/70 text-xs">תקציב כולל אופציונלי</p>
          </div>
          <Link href="/budget" className="text-sm text-white px-4 py-2 rounded-2xl font-semibold active:scale-95"
            style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
            הגדר תקציב
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="עלות כוללת" value={fmt(summary.totalActual)} icon={Wallet} color="amber" />
        <StatCard title="שולם" value={fmt(summary.totalPaid)} icon={CheckCircle} color="green" />
        <StatCard title="נשאר לשלם" value={fmt(summary.totalRemaining)} icon={Clock} color="red" />
        <StatCard title="קבלן ושיפוץ" value={fmt(summary.contractorTotal)} icon={Activity} color="purple" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Rooms budget status */}
        <div className="glass-card rounded-3xl p-5">
          <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
            <Home size={16} className="text-amber-500" /> חדרים
          </h2>
          {rooms.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">הוסיפו חדרים בתכנון הדירה</p>
          ) : (
            <div className="space-y-3">
              {rooms.slice(0, 6).map((room) => {
                const s = getRoomStats(room, items);
                return (
                  <div key={room.id}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="font-medium text-stone-700">{room.emoji} {room.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${budgetStatusStyle[s.budgetStatus]}`}>{s.budgetStatus}</span>
                    </div>
                    <ProgressBar value={s.plannedBudget > 0 ? s.usedPct : Math.min(100, s.readiness)} color={s.diff < 0 ? 'red' : s.usedPct >= 90 ? 'amber' : 'green'} height="sm" />
                    <p className="text-[11px] text-stone-400 mt-0.5">בפועל {fmt(s.actualCost)}{s.plannedBudget > 0 ? ` מתוך ${fmt(s.plannedBudget)}` : ''} · שולם {fmt(s.paid)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* High priority missing */}
        <div className="glass-card rounded-3xl p-5">
          <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" /> חובה שעוד חסר
          </h2>
          {highPriorityMissing.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">✅ אין פריטי חובה חסרים</p>
          ) : (
            <div className="space-y-2">
              {highPriorityMissing.map((item) => {
                const room = rooms.find((r) => r.id === item.roomId);
                return (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{item.emoji} {item.name}</p>
                      <p className="text-xs text-stone-500">{room?.emoji} {room?.name} · {item.category}</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">{itemActual(item) > 0 ? fmt(itemActual(item)) : '—'}</p>
                  </div>
                );
              })}
              <Link href="/planning" className="block text-center text-sm text-amber-600 font-medium hover:text-amber-700 pt-1">
                לתכנון הדירה ←
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      {summary.byCategory.length > 0 && (
        <div className="glass-card rounded-3xl p-5">
          <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
            <TrendingDown size={16} className="text-amber-500" /> פירוט תקציב לפי קטגוריה
          </h2>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
            {summary.byCategory.slice(0, 12).map((c) => {
              const maxA = summary.byCategory[0].actual || 1;
              return (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-stone-600">{c.category} <span className="text-stone-400">({c.count})</span></span>
                    <span className="font-semibold text-stone-700">{fmt(c.actual)}</span>
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
    </div>
  );
}
