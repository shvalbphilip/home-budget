'use client';
import { useState, useEffect } from 'react';
import { Room, ROOM_PRIORITIES, RoomPriority } from '@/lib/planning/types';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  room: Room | null;          // null = create
  onClose: () => void;
  onSave: (data: { name: string; emoji: string; width: number; length: number; height: number; color: string; priority: RoomPriority; notes: string; plannedBudget: number }) => void;
}

const COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6', '#14b8a6', '#22c55e', '#06b6d4', '#ec4899', '#64748b'];

export default function RoomModal({ open, room, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏠');
  const [width, setWidth] = useState(300);
  const [length, setLength] = useState(250);
  const [height, setHeight] = useState(270);
  const [color, setColor] = useState(COLORS[0]);
  const [priority, setPriority] = useState<RoomPriority>('חשוב');
  const [notes, setNotes] = useState('');
  const [plannedBudget, setPlannedBudget] = useState(0);

  useEffect(() => {
    if (room) {
      setName(room.name); setEmoji(room.emoji);
      setWidth(room.width); setLength(room.length); setHeight(room.height);
      setColor(room.color); setPriority(room.priority); setNotes(room.notes);
      setPlannedBudget(room.plannedBudget ?? 0);
    } else {
      setName(''); setEmoji('🏠'); setWidth(300); setLength(250); setHeight(270);
      setColor(COLORS[0]); setPriority('חשוב'); setNotes(''); setPlannedBudget(0);
    }
  }, [room, open]);

  if (!open) return null;

  const input = 'w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400 bg-white';
  const label = 'block text-xs font-medium text-stone-600 mb-1';

  const submit = () => {
    if (!name.trim()) { alert('שם החדר הוא שדה חובה'); return; }
    onSave({ name: name.trim(), emoji: emoji || '🏠', width, length, height, color, priority, notes, plannedBudget });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-3xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-900 text-lg">{room ? 'עריכת חדר' : 'חדר חדש'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={label}>שם החדר *</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: סלון" autoFocus />
          </div>
          <div>
            <label className={label}>אמוג׳י</label>
            <input className={input + ' text-center'} value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={2} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={label}>רוחב (ס״מ)</label>
            <input type="number" min={50} className={input} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
          </div>
          <div>
            <label className={label}>אורך (ס״מ)</label>
            <input type="number" min={50} className={input} value={length} onChange={(e) => setLength(Number(e.target.value))} />
          </div>
          <div>
            <label className={label}>גובה (ס״מ)</label>
            <input type="number" min={200} className={input} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className={label}>תקציב מתוכנן לחדר (₪) — אופציונלי</label>
          <input type="number" min={0} className={input} value={plannedBudget || ''} onChange={(e) => setPlannedBudget(Number(e.target.value))} placeholder="לדוגמה: 70000" />
        </div>

        <div>
          <label className={label}>עדיפות</label>
          <div className="flex gap-2">
            {ROOM_PRIORITIES.map((p) => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${priority === p ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={label}>צבע בתוכנית</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-stone-400 scale-110' : ''}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>

        <div>
          <label className={label}>הערות</label>
          <textarea className={input + ' resize-none'} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות על החדר..." />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={submit} className="flex-1 text-white py-2.5 rounded-xl font-semibold transition-all active:scale-95"
            style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
            {room ? 'שמור שינויים' : 'הוסף חדר'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50">ביטול</button>
        </div>
      </div>
    </div>
  );
}
