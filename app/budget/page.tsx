'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { getCategoryStats, getDashboardStats, fmt } from '@/lib/utils';
import ProgressBar from '@/components/ProgressBar';
import { Wallet, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function BudgetPage() {
  const { items, totalBudget, categories, setTotalBudget, setCategoryBudget } = useStore();
  const [editTotal, setEditTotal] = useState(String(totalBudget || ''));
  const [editCat, setEditCat] = useState<Record<string, string>>({});
  const [savedMsg, setSavedMsg] = useState('');

  const catStats = getCategoryStats(items, categories);
  const dashStats = getDashboardStats(items, totalBudget, categories);

  const flash = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 2000); };

  if (categories.length === 0) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto mt-20">
        <Wallet size={48} className="text-stone-300 mx-auto" />
        <p className="text-stone-500">יש ליצור קטגוריות/חדרים לפני הגדרת תקציב</p>
        <Link href="/categories" className="inline-block bg-amber-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors">
          הוסף קטגוריות
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
        <Wallet size={24} className="text-amber-500" /> תכנון תקציב
      </h1>

      {savedMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
          <Check size={16} /> {savedMsg}
        </div>
      )}

      {/* Total budget */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h2 className="font-bold text-stone-800">תקציב כולל לדירה</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">₪</span>
            <input
              type="number"
              value={editTotal}
              onChange={(e) => setEditTotal(e.target.value)}
              className="w-full pr-8 pl-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400"
              min={0}
              placeholder="הכנס תקציב..."
            />
          </div>
          <button
            onClick={() => { setTotalBudget(Number(editTotal) || 0); flash('התקציב הכולל נשמר ✅'); }}
            className="px-5 py-2.5 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors"
          >
            שמור
          </button>
        </div>
        {totalBudget > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-stone-50 rounded-xl p-3 text-center">
                <p className="text-xs text-stone-500">תקציב</p>
                <p className="font-bold text-stone-800">{fmt(totalBudget)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xs text-red-500">הוצא</p>
                <p className="font-bold text-red-700">{fmt(dashStats.totalSpent)}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${dashStats.remaining < 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                <p className={`text-xs ${dashStats.remaining < 0 ? 'text-red-500' : 'text-emerald-500'}`}>נותר</p>
                <p className={`font-bold ${dashStats.remaining < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{fmt(dashStats.remaining)}</p>
              </div>
            </div>
            <ProgressBar value={dashStats.budgetUsedPct} color={dashStats.budgetUsedPct > 100 ? 'red' : dashStats.budgetUsedPct > 80 ? 'amber' : 'green'} showLabel />
          </div>
        )}
      </div>

      {/* Category budgets */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h2 className="font-bold text-stone-800">תקציב לפי קטגוריה</h2>
        <div className="space-y-4">
          {catStats.map((c) => {
            const editVal = editCat[c.id] ?? String(c.plannedBudget || '');
            const remaining = c.plannedBudget - c.spent;
            return (
              <div key={c.id} className={`p-4 rounded-xl border ${c.isOverBudget ? 'border-red-200 bg-red-50' : c.noBudget ? 'border-amber-100 bg-amber-50' : 'border-stone-100 bg-stone-50'}`}>
                <div className="flex flex-wrap gap-3 items-center mb-3">
                  <span className="font-semibold text-stone-800">{c.emoji} {c.name}</span>
                  <div className="flex gap-2 flex-1 min-w-0">
                    <div className="relative flex-1 max-w-36">
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">₪</span>
                      <input
                        type="number"
                        value={editVal}
                        onChange={(e) => setEditCat((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        className="w-full pr-6 pl-2 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 bg-white"
                        min={0}
                        placeholder="0"
                      />
                    </div>
                    <button
                      onClick={() => { setCategoryBudget(c.id, Number(editVal) || 0); flash(`תקציב ${c.name} נשמר ✅`); }}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                    >
                      שמור
                    </button>
                  </div>
                  {c.isOverBudget && <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><AlertTriangle size={12} /> חריגה</span>}
                  {c.noBudget && <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><AlertTriangle size={12} /> ללא תקציב</span>}
                </div>
                {(c.spent > 0 || c.plannedBudget > 0) && (
                  <div className="flex gap-4 text-xs text-stone-600 mb-2">
                    <span>הוצא: <strong>{fmt(c.spent)}</strong></span>
                    {c.plannedBudget > 0 && <>
                      <span>תקציב: <strong>{fmt(c.plannedBudget)}</strong></span>
                      <span className={remaining < 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>
                        {remaining < 0 ? `חריגה: ${fmt(Math.abs(remaining))}` : `נותר: ${fmt(remaining)}`}
                      </span>
                    </>}
                    <span className="text-stone-400">{c.total} פריטים</span>
                  </div>
                )}
                {c.plannedBudget > 0 && <ProgressBar value={c.budgetUsed} color={c.isOverBudget ? 'red' : 'amber'} showLabel height="sm" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
