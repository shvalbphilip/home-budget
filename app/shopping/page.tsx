'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { PRIORITY_OPTIONS } from '@/lib/types';
import { fmt } from '@/lib/utils';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { ShoppingCart, ExternalLink, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ShoppingPage() {
  const { items, categories, updateItem } = useStore();
  const [catFilter, setCatFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [essentialOnly, setEssentialOnly] = useState(false);
  const [storeFilter, setStoreFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const missing = items.filter((i) => i.status === 'חסר' || i.status === 'לרכישה');
  const filtered = missing.filter((i) => {
    if (catFilter && i.categoryId !== catFilter) return false;
    if (priorityFilter && i.priority !== priorityFilter) return false;
    if (essentialOnly && !i.isEssential) return false;
    if (storeFilter && !i.store.toLowerCase().includes(storeFilter.toLowerCase())) return false;
    if (maxPrice && i.estimatedPrice > Number(maxPrice)) return false;
    return true;
  });

  const totalEstimated = filtered.reduce((s, i) => s + i.estimatedPrice * i.quantity, 0);

  const markBought = (id: string, price: number) => {
    const actual = prompt('מה המחיר ששולם? (₪)', String(price || ''));
    if (actual === null) return;
    updateItem(id, { status: 'נרכש', actualPrice: Number(actual), purchaseDate: new Date().toISOString().split('T')[0] });
  };

  // Group by category
  const grouped = categories.reduce<Record<string, typeof filtered>>((acc, cat) => {
    const catItems = filtered.filter((i) => i.categoryId === cat.id);
    if (catItems.length) acc[cat.id] = catItems;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <ShoppingCart size={24} className="text-amber-500" /> רשימת קניות
          </h1>
          <p className="text-stone-500 text-sm">
            {filtered.length} פריטים{totalEstimated > 0 ? ` • הערכה: ${fmt(totalEstimated)}` : ''}
          </p>
        </div>
        <Link href="/add-item" className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
          + הוסף פריט
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-wrap gap-3 items-center">
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400">
          <option value="">כל הקטגוריות</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400">
          <option value="">כל העדיפויות</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input type="number" placeholder="מחיר מקסימום ₪" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400 w-36" />
        <input type="text" placeholder="חנות..." value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400 w-32" />
        <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-700 select-none">
          <input type="checkbox" checked={essentialOnly} onChange={(e) => setEssentialOnly(e.target.checked)} className="accent-amber-500 w-4 h-4" />
          חיוני בלבד
        </label>
      </div>

      {missing.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-stone-600 font-medium text-lg">אין פריטים לרכישה</p>
          <p className="text-stone-400 text-sm mt-1">כל הפריטים נרכשו, או שעוד לא הוספת פריטים</p>
          <Link href="/add-item" className="mt-4 inline-block text-amber-600 text-sm font-medium hover:text-amber-700">+ הוסף פריט</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
          <p className="text-stone-400">אין תוצאות עבור הפילטרים שנבחרו</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([catId, catItems]) => {
            const cat = catMap[catId];
            return (
              <div key={catId} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
                  <h2 className="font-bold text-stone-800">{cat?.emoji} {cat?.name}</h2>
                  <span className="text-sm text-stone-500">
                    {catItems.length} פריטים{catItems.some((i) => i.estimatedPrice > 0) ? ` • ${fmt(catItems.reduce((s, i) => s + i.estimatedPrice * i.quantity, 0))}` : ''}
                  </span>
                </div>
                <div className="divide-y divide-stone-100">
                  {catItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 px-5 py-4">
                      <button
                        onClick={() => markBought(item.id, item.estimatedPrice)}
                        title="סמן כנרכש"
                        className="shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 border-stone-300 hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium text-stone-900">{item.name}</span>
                          <StatusBadge status={item.status} />
                          <PriorityBadge priority={item.priority} />
                          {item.isEssential && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">חיוני</span>}
                        </div>
                        {item.store && <p className="text-xs text-stone-500">חנות: {item.store}</p>}
                        {item.notes && <p className="text-xs text-stone-400 mt-0.5">{item.notes}</p>}
                      </div>
                      <div className="shrink-0 text-left space-y-1">
                        <p className="font-semibold text-stone-800">{item.estimatedPrice > 0 ? fmt(item.estimatedPrice * item.quantity) : '—'}</p>
                        {item.quantity > 1 && <p className="text-xs text-stone-400">×{item.quantity}</p>}
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700">
                            קישור <ExternalLink size={10} />
                          </a>
                        )}
                        <Link href={`/add-item?id=${item.id}`} className="block text-xs text-stone-400 hover:text-amber-500">✏️ ערוך</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
