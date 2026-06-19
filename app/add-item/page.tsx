'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, Item } from '@/lib/types';
import { PlusCircle, Zap } from 'lucide-react';
import Link from 'next/link';

const emptyItem = (defaultCategoryId = ''): Omit<Item, 'id' | 'createdAt'> => ({
  name: '', categoryId: defaultCategoryId, status: 'לרכישה', quantity: 1,
  estimatedPrice: 0, actualPrice: 0, store: '', priority: 'בינונית',
  notes: '', purchaseDate: '', link: '', isEssential: false,
});

function AddItemForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('id');
  const defaultCat = params.get('cat') ?? '';
  const { items, categories, addItem, updateItem } = useStore();

  const [form, setForm] = useState(emptyItem(defaultCat));
  const [quickMode, setQuickMode] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (editId) {
      const found = items.find((i) => i.id === editId);
      if (found) {
        const { id: _id, createdAt: _c, ...rest } = found;
        setForm(rest);
      }
    } else {
      setForm(emptyItem(defaultCat || categories[0]?.id || ''));
    }
  }, [editId]);

  if (categories.length === 0) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto mt-20">
        <p className="text-stone-500">לפני הוספת פריטים יש ליצור לפחות קטגוריה/חדר אחד</p>
        <Link href="/categories" className="inline-block bg-amber-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors">
          הוסף קטגוריות
        </Link>
      </div>
    );
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('שם הפריט הוא שדה חובה');
    if (!form.categoryId) return alert('יש לבחור קטגוריה');
    if (editId) {
      updateItem(editId, form);
      router.push('/inventory');
    } else {
      addItem(form);
      if (quickMode) {
        setForm((f) => ({ ...emptyItem(f.categoryId) }));
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        router.push('/inventory');
      }
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400 bg-white";
  const labelCls = "block text-sm font-medium text-stone-700 mb-1";

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-stone-900 flex items-center gap-2">
          <PlusCircle size={24} className="text-amber-500" />
          {editId ? 'עריכת פריט' : 'הוסף פריט'}
        </h1>
        {!editId && (
          <button
            type="button"
            onClick={() => setQuickMode(!quickMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${quickMode ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
          >
            <Zap size={14} /> מצב מהיר
          </button>
        )}
      </div>

      {quickMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
          ⚡ מצב מהיר — שמירה תישאר בדף לפריט הבא באותה קטגוריה
        </div>
      )}
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 text-center font-medium">
          ✅ הפריט נשמר! הוסף פריט נוסף
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-4 md:p-6 space-y-4 md:space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelCls}>שם הפריט *</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="שם הפריט..." className={inputCls} required autoFocus />
          </div>

          <div>
            <label className={labelCls}>קטגוריה / חדר *</label>
            <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={inputCls}>
              <option value="">בחר קטגוריה...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>סטטוס</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>כמות</label>
            <input type="number" min={1} value={form.quantity} onChange={(e) => set('quantity', Number(e.target.value))} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>עדיפות</label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputCls}>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {!quickMode && (
            <>
              <div>
                <label className={labelCls}>מחיר משוער (₪)</label>
                <input type="number" min={0} value={form.estimatedPrice || ''} onChange={(e) => set('estimatedPrice', Number(e.target.value))} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>מחיר בפועל (₪)</label>
                <input type="number" min={0} value={form.actualPrice || ''} onChange={(e) => set('actualPrice', Number(e.target.value))} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>חנות / ספק</label>
                <input type="text" value={form.store} onChange={(e) => set('store', e.target.value)} placeholder="לדוגמה: IKEA" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>תאריך רכישה</label>
                <input type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>קישור למוצר</label>
                <input type="url" value={form.link} onChange={(e) => set('link', e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>הערות</label>
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="הערות נוספות..." className={inputCls + ' resize-none'} />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={form.isEssential} onChange={(e) => set('isEssential', e.target.checked)} className="w-4 h-4 accent-amber-500" />
              <span className="text-sm font-medium text-stone-700">פריט חיוני (חובה לדירה)</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl font-semibold hover:bg-amber-600 transition-colors">
            {editId ? 'שמור שינויים' : quickMode ? '⚡ שמור והוסף עוד' : 'שמור פריט'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors">
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddItemPage() {
  return <Suspense><AddItemForm /></Suspense>;
}
