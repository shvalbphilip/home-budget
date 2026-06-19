'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '@/lib/types';
import { fmt } from '@/lib/utils';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Pencil, Trash2, Search, Package, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
  const { items, categories, deleteItem } = useStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q) || i.store.toLowerCase().includes(q) || i.notes.toLowerCase().includes(q);
    const matchCat = !catFilter || i.categoryId === catFilter;
    const matchStatus = !statusFilter || i.status === statusFilter;
    const matchPriority = !priorityFilter || i.priority === priorityFilter;
    return matchSearch && matchCat && matchStatus && matchPriority;
  });

  const totalEstimated = filtered.reduce((s, i) => s + i.estimatedPrice * i.quantity, 0);
  const totalActual = filtered.reduce((s, i) => s + i.actualPrice * i.quantity, 0);
  const itemToDelete = items.find((i) => i.id === deleteId);

  return (
    <div className="p-6 space-y-5">
      <ConfirmDialog
        open={!!deleteId}
        title="מחיקת פריט"
        message={`האם למחוק את "${itemToDelete?.name}"? פעולה זו אינה ניתנת לביטול.`}
        confirmLabel="מחק"
        danger
        onConfirm={() => { if (deleteId) deleteItem(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Package size={24} className="text-amber-500" /> מלאי
          </h1>
          <p className="text-stone-500 text-sm">{filtered.length} מתוך {items.length} פריטים</p>
        </div>
        <Link href="/add-item" className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
          + הוסף פריט
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="חיפוש..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400">
          <option value="">כל הקטגוריות</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400">
          <option value="">כל הסטטוסים</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400">
          <option value="">כל העדיפויות</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
          <p className="text-xs text-stone-500">הערכה כוללת</p>
          <p className="font-bold text-stone-800">{fmt(totalEstimated)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-xs text-red-500">עלות בפועל</p>
          <p className="font-bold text-red-700">{fmt(totalActual)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-xs text-emerald-500">הפרש</p>
          <p className="font-bold text-emerald-700">{fmt(totalEstimated - totalActual)}</p>
        </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <Package size={48} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-400 font-medium">אין פריטים עדיין</p>
          <Link href="/add-item" className="mt-3 inline-block text-amber-600 text-sm font-medium hover:text-amber-700">+ הוסף פריט ראשון</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
          <p className="text-stone-400">לא נמצאו פריטים התואמים את הסינון</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold text-stone-600">שם פריט</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-600">קטגוריה</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-600">סטטוס</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-600">עדיפות</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-600">כמות</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-600">הערכה</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-600">בפועל</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-600">חנות</th>
                  <th className="px-4 py-3 text-center font-semibold text-stone-600">חיוני</th>
                  <th className="px-4 py-3 text-center font-semibold text-stone-600">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((item) => {
                  const cat = catMap[item.categoryId];
                  return (
                    <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">{item.name}</div>
                        {item.notes && <div className="text-xs text-stone-400 mt-0.5">{item.notes}</div>}
                      </td>
                      <td className="px-4 py-3 text-stone-600">{cat ? `${cat.emoji} ${cat.name}` : '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={item.priority} /></td>
                      <td className="px-4 py-3 text-stone-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-stone-700">{item.estimatedPrice > 0 ? fmt(item.estimatedPrice * item.quantity) : '—'}</td>
                      <td className="px-4 py-3 text-stone-700">{item.actualPrice > 0 ? fmt(item.actualPrice * item.quantity) : '—'}</td>
                      <td className="px-4 py-3 text-stone-600">
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-amber-600 hover:text-amber-700">
                            {item.store || 'קישור'} <ExternalLink size={12} />
                          </a>
                        ) : item.store || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">{item.isEssential ? '✅' : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/add-item?id=${item.id}`} className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
