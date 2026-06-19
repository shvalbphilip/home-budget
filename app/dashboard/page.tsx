'use client';
import { useStore } from '@/lib/store';
import { getDashboardStats, getCategoryStats, fmt } from '@/lib/utils';
import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import AlertBanner from '@/components/AlertBanner';
import { Wallet, ShoppingBag, CheckCircle, AlertCircle, TrendingDown, Package, Home } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { items, totalBudget, categories } = useStore();
  const stats = getDashboardStats(items, totalBudget, categories);
  const catStats = getCategoryStats(items, categories);

  const alerts = [
    ...stats.overBudgetCats.map((c) => ({
      type: 'error' as const,
      message: `חריגה מתקציב בקטגוריה: ${c.name}`,
    })),
    ...stats.noBudgetCats.map((c) => ({
      type: 'warning' as const,
      message: `לא הוגדר תקציב לקטגוריה: ${c.name}`,
    })),
    ...(stats.criticalMissing > 0
      ? [{ type: 'error' as const, message: `${stats.criticalMissing} פריטים קריטיים חסרים בעדיפות גבוהה` }]
      : []),
  ];

  const incompleteRooms = catStats.filter((c) => c.completion < 100 && c.total > 0).sort((a, b) => a.completion - b.completion);
  const highPriorityMissing = items.filter((i) => (i.status === 'חסר' || i.status === 'לרכישה') && i.priority === 'גבוהה').slice(0, 5);

  if (items.length === 0 && categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
        <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Home size={40} className="text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">הפרויקט ריק</h1>
        <p className="text-stone-500 mb-6 max-w-sm">התחל בהוספת חדרים/קטגוריות ואז הוסף את הפריטים שלך</p>
        <div className="flex gap-3">
          <Link href="/categories" className="bg-amber-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors">
            הוסף חדרים
          </Link>
          <Link href="/add-item" className="bg-white border border-stone-200 text-stone-700 px-5 py-3 rounded-xl font-semibold hover:bg-stone-50 transition-colors">
            הוסף פריט
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Home size={24} className="text-amber-500" /> לוח בקרה
          </h1>
          <p className="text-stone-500 text-sm mt-1">סיכום מצב המעבר לדירה</p>
        </div>
        <Link href="/add-item" className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
          + הוסף פריט
        </Link>
      </div>

      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {/* Budget overview */}
      {totalBudget > 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-sm text-stone-500">תקציב כולל</p>
              <p className="text-3xl font-bold text-stone-900">{fmt(totalBudget)}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-stone-500">שימוש בתקציב</p>
              <p className="text-xl font-bold text-amber-600">{stats.budgetUsedPct}%</p>
            </div>
          </div>
          <ProgressBar value={stats.budgetUsedPct} color={stats.budgetUsedPct > 90 ? 'red' : 'amber'} />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xs text-red-600 font-medium">הוצאה בפועל</p>
              <p className="text-lg font-bold text-red-700">{fmt(stats.totalSpent)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs text-emerald-600 font-medium">נותר בתקציב</p>
              <p className="text-lg font-bold text-emerald-700">{fmt(stats.remaining)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-amber-700 text-sm font-medium">לא הוגדר תקציב כולל</p>
          <Link href="/budget" className="text-sm bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-amber-600 transition-colors">
            הגדר תקציב
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="פריטים שנרכשו" value={String(stats.totalPurchased)} icon={CheckCircle} color="green" />
        <StatCard title="פריטים חסרים" value={String(stats.totalMissing)} icon={ShoppingBag} color="amber" />
        <StatCard title="בבעלותי" value={String(stats.totalOwned)} icon={Package} color="blue" />
        <StatCard title="סה״כ פריטים" value={String(items.length)} icon={Wallet} color="stone" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Incomplete rooms */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
            <Home size={16} className="text-amber-500" /> חדרים שלא הושלמו
          </h2>
          {incompleteRooms.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">🎉 כל החדרים הושלמו!</p>
          ) : (
            <div className="space-y-3">
              {incompleteRooms.slice(0, 6).map((c) => (
                <div key={c.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-stone-700">{c.emoji} {c.name}</span>
                    <span className="text-stone-500">{c.completion}% מוכן</span>
                  </div>
                  <ProgressBar value={c.completion} color={c.completion < 50 ? 'red' : c.completion < 80 ? 'amber' : 'green'} height="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* High priority missing */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" /> רכישות בעדיפות גבוהה
          </h2>
          {highPriorityMissing.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">✅ אין פריטים בעדיפות גבוהה שחסרים</p>
          ) : (
            <div className="space-y-2">
              {highPriorityMissing.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                return (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{item.name}</p>
                      <p className="text-xs text-stone-500">{cat?.emoji} {cat?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">{item.estimatedPrice > 0 ? fmt(item.estimatedPrice * item.quantity) : '—'}</p>
                      {item.isEssential && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">חיוני</span>}
                    </div>
                  </div>
                );
              })}
              <Link href="/shopping" className="block text-center text-sm text-amber-600 font-medium hover:text-amber-700 pt-1">
                לרשימת הקניות ←
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Category budget breakdown */}
      {catStats.some((c) => c.total > 0 || c.plannedBudget > 0) && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
            <TrendingDown size={16} className="text-amber-500" /> פירוט תקציב לפי קטגוריה
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {catStats.filter((c) => c.total > 0 || c.plannedBudget > 0).map((c) => (
              <div key={c.id} className={`p-3 rounded-xl border ${c.isOverBudget ? 'border-red-200 bg-red-50' : c.noBudget ? 'border-amber-200 bg-amber-50' : 'border-stone-100 bg-stone-50'}`}>
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-medium text-sm text-stone-800">{c.emoji} {c.name}</span>
                  <span className={`text-xs font-semibold ${c.isOverBudget ? 'text-red-600' : 'text-stone-500'}`}>
                    {c.noBudget ? 'ללא תקציב' : `${fmt(c.spent)} / ${fmt(c.plannedBudget)}`}
                  </span>
                </div>
                {!c.noBudget && c.plannedBudget > 0 && <ProgressBar value={c.budgetUsed} color={c.isOverBudget ? 'red' : 'amber'} height="sm" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
