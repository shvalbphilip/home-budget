'use client';
import { useState, useEffect } from 'react';
import { PlanItem, Room, PLAN_ITEM_STATUSES, ROOM_PRIORITIES, ITEM_CATEGORIES, PlanItemStatus, RoomPriority } from '@/lib/planning/types';
import { fmt } from '@/lib/planning/geometry';
import { X } from 'lucide-react';

export interface PlanItemDraft {
  name: string; emoji: string; roomId: string;
  status: PlanItemStatus; priority: RoomPriority;
  quantity: number; price: number; actualPrice: number; paidAmount: number;
  supplier: string; store: string; link: string; notes: string; category: string;
}

interface Props {
  open: boolean;
  item: PlanItem | null;       // null = create
  rooms: Room[];
  defaultRoomId?: string;
  onClose: () => void;
  onSave: (data: PlanItemDraft) => void;
}

const blank = (roomId: string): PlanItemDraft => ({
  name: '', emoji: '📦', roomId, status: 'חסר', priority: 'חשוב',
  quantity: 1, price: 0, actualPrice: 0, paidAmount: 0,
  supplier: '', store: '', link: '', notes: '', category: 'ריהוט',
});

export default function PlanItemModal({ open, item, rooms, defaultRoomId, onClose, onSave }: Props) {
  const [d, setD] = useState<PlanItemDraft>(blank(defaultRoomId ?? rooms[0]?.id ?? ''));

  useEffect(() => {
    if (item) {
      setD({
        name: item.name, emoji: item.emoji, roomId: item.roomId,
        status: item.status, priority: item.priority, quantity: item.quantity,
        price: item.price, actualPrice: item.actualPrice ?? 0, paidAmount: item.paidAmount ?? 0,
        supplier: item.supplier ?? '', store: item.store, link: item.link, notes: item.notes,
        category: item.category || 'ריהוט',
      });
    } else {
      setD(blank(defaultRoomId ?? rooms[0]?.id ?? ''));
    }
  }, [item, open, defaultRoomId, rooms]);

  if (!open) return null;

  const set = <K extends keyof PlanItemDraft>(k: K, v: PlanItemDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const input = 'w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400 bg-white';
  const label = 'block text-xs font-medium text-stone-600 mb-1';

  // live payment readout
  const actualTotal = (d.actualPrice > 0 ? d.actualPrice : d.price) * (d.quantity || 1);
  const remaining = Math.max(0, actualTotal - d.paidAmount);
  const payStatus = (d.actualPrice > 0 && d.actualPrice * (d.quantity || 1) > d.price * (d.quantity || 1))
    ? 'חורג מהתקציב'
    : d.paidAmount <= 0 ? 'לא שולם'
    : d.paidAmount >= actualTotal ? 'שולם במלואו' : 'שולם חלקית';
  const payColor = payStatus === 'שולם במלואו' ? 'text-emerald-600'
    : payStatus === 'חורג מהתקציב' ? 'text-red-600'
    : payStatus === 'שולם חלקית' ? 'text-amber-600' : 'text-stone-500';

  const submit = () => {
    if (!d.name.trim()) { alert('שם הפריט הוא שדה חובה'); return; }
    if (!d.roomId) { alert('יש לבחור חדר'); return; }
    onSave({ ...d, name: d.name.trim() });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-3xl w-full max-w-md p-5 space-y-3 max-h-[92vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-900 text-lg">{item ? 'עריכת פריט' : 'פריט חדש'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={label}>שם הפריט *</label>
            <input className={input} value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="לדוגמה: נגרות מטבח" autoFocus />
          </div>
          <div>
            <label className={label}>אמוג׳י</label>
            <input className={input + ' text-center'} value={d.emoji} onChange={(e) => set('emoji', e.target.value)} maxLength={2} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>חדר</label>
            <select className={input} value={d.roomId} onChange={(e) => set('roomId', e.target.value)}>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>קטגוריה</label>
            <select className={input} value={d.category} onChange={(e) => set('category', e.target.value)}>
              {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={label}>סטטוס</label>
            <select className={input} value={d.status} onChange={(e) => set('status', e.target.value as PlanItemStatus)}>
              {PLAN_ITEM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>עדיפות</label>
            <select className={input} value={d.priority} onChange={(e) => set('priority', e.target.value as RoomPriority)}>
              {ROOM_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>כמות</label>
            <input type="number" min={1} className={input} value={d.quantity} onChange={(e) => set('quantity', Number(e.target.value))} />
          </div>
        </div>

        {/* Money block */}
        <div className="rounded-2xl p-3 space-y-3" style={{ background: 'rgba(255,255,255,0.5)' }}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={label}>מחיר מתוכנן (₪)</label>
              <input type="number" min={0} className={input} value={d.price || ''} onChange={(e) => set('price', Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className={label}>מחיר בפועל (₪)</label>
              <input type="number" min={0} className={input} value={d.actualPrice || ''} onChange={(e) => set('actualPrice', Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className={label}>שולם עד כה (₪)</label>
              <input type="number" min={0} className={input} value={d.paidAmount || ''} onChange={(e) => set('paidAmount', Number(e.target.value))} placeholder="0" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">נשאר לשלם: <span className="font-bold text-stone-700">{fmt(remaining)}</span></span>
            <span className={`font-semibold ${payColor}`}>{payStatus}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>ספק / קבלן</label>
            <input className={input} value={d.supplier} onChange={(e) => set('supplier', e.target.value)} placeholder="נגריית כהן" />
          </div>
          <div>
            <label className={label}>חנות</label>
            <input className={input} value={d.store} onChange={(e) => set('store', e.target.value)} placeholder="IKEA" />
          </div>
        </div>

        <div>
          <label className={label}>קישור להצעת מחיר / חשבונית</label>
          <input className={input} value={d.link} onChange={(e) => set('link', e.target.value)} placeholder="https://" />
        </div>

        <div>
          <label className={label}>הערות</label>
          <textarea className={input + ' resize-none'} rows={2} value={d.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={submit} className="flex-1 text-white py-2.5 rounded-xl font-semibold transition-all active:scale-95"
            style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
            {item ? 'שמור שינויים' : 'הוסף פריט'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50">ביטול</button>
        </div>
      </div>
    </div>
  );
}
