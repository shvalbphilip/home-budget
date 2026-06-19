'use client';
import { useState } from 'react';
import { usePlanningStore } from '@/lib/planning/store';
import { Room, PlanItem, ROOM_PRESETS } from '@/lib/planning/types';
import { getRoomStats, fmt, itemTotal } from '@/lib/planning/geometry';
import ProgressBar from '@/components/ProgressBar';
import ConfirmDialog from '@/components/ConfirmDialog';
import RoomModal from './RoomModal';
import PlanItemModal, { PlanItemDraft } from './PlanItemModal';
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp, MapPin, MapPinOff,
  Check, ExternalLink,
} from 'lucide-react';

const statusColor: Record<string, string> = {
  'יש לנו': 'bg-emerald-100 text-emerald-700',
  'חסר': 'bg-red-100 text-red-700',
  'אולי': 'bg-amber-100 text-amber-700',
  'לא צריך': 'bg-stone-100 text-stone-500',
};
const prioColor: Record<string, string> = {
  'חובה': 'bg-red-100 text-red-700',
  'חשוב': 'bg-amber-100 text-amber-700',
  'נחמד שיהיה': 'bg-stone-100 text-stone-500',
};

export default function RoomsManager() {
  const {
    rooms, items, addRoom, updateRoom, deleteRoom,
    addItem, updateItem, deleteItem, toggleBought, placeItem, unplaceItem,
  } = usePlanningStore();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [roomModal, setRoomModal] = useState<{ open: boolean; room: Room | null }>({ open: false, room: null });
  const [itemModal, setItemModal] = useState<{ open: boolean; item: PlanItem | null; roomId?: string }>({ open: false, item: null });
  const [confirmDel, setConfirmDel] = useState<{ kind: 'room' | 'item'; id: string; name: string } | null>(null);

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const saveRoom = (data: Parameters<NonNullable<Parameters<typeof RoomModal>[0]['onSave']>>[0]) => {
    if (roomModal.room) updateRoom(roomModal.room.id, data);
    else addRoom(data);
    setRoomModal({ open: false, room: null });
  };

  const saveItem = (data: PlanItemDraft) => {
    if (itemModal.item) updateItem(itemModal.item.id, data);
    else addItem(data);
    setItemModal({ open: false, item: null });
  };

  return (
    <div className="space-y-4">
      {/* quick add presets */}
      <div className="glass-card rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-stone-800 text-sm">הוספת חדר</p>
          <button onClick={() => setRoomModal({ open: true, room: null })}
            className="flex items-center gap-1 text-white px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95"
            style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
            <Plus size={14} /> חדר מותאם
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROOM_PRESETS.filter((p) => !rooms.some((r) => r.name === p.name)).map((p) => (
            <button key={p.name} onClick={() => addRoom({ name: p.name, emoji: p.emoji, color: p.color })}
              className="glass-card px-3 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:text-amber-600 active:scale-95 transition-colors">
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      </div>

      {rooms.length === 0 && (
        <div className="glass-card rounded-3xl p-10 text-center text-stone-400">
          עדיין אין חדרים. הוסיפו חדר כדי להתחיל לתכנן.
        </div>
      )}

      {rooms.map((room) => {
        const stats = getRoomStats(room, items);
        const isOpen = expanded[room.id];
        return (
          <div key={room.id} className="glass-card rounded-3xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0" style={{ background: room.color + '22' }}>
                    {room.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900">{room.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${prioColor[room.priority]}`}>{room.priority}</span>
                    </div>
                    <p className="text-xs text-stone-400">{stats.area} מ״ר · {(room.width / 100).toFixed(1)}×{(room.length / 100).toFixed(1)} מ׳</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setRoomModal({ open: true, room })} className="p-2 rounded-xl text-stone-400 hover:text-amber-600 hover:bg-amber-50"><Pencil size={15} /></button>
                  <button onClick={() => setConfirmDel({ kind: 'room', id: room.id, name: room.name })} className="p-2 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-500">מוכנות החדר</span>
                  <span className="font-semibold text-stone-700">{stats.readiness}%</span>
                </div>
                <ProgressBar value={stats.readiness} color={stats.readiness < 50 ? 'red' : stats.readiness < 80 ? 'amber' : 'green'} height="sm" />
              </div>

              <div className="flex items-center gap-3 mt-3 text-xs flex-wrap">
                <span className="text-emerald-600 font-medium">יש לנו {stats.have}</span>
                <span className="text-red-500 font-medium">חסר {stats.missing}</span>
                <span className="text-amber-600 font-medium">אולי {stats.maybe}</span>
                <span className="text-stone-500">עלות {fmt(stats.estimatedCost)}</span>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => setItemModal({ open: true, item: null, roomId: room.id })}
                  className="flex items-center gap-1 text-amber-600 text-xs font-semibold hover:text-amber-700">
                  <Plus size={14} /> הוסף פריט
                </button>
                {stats.total > 0 && (
                  <button onClick={() => toggle(room.id)} className="flex items-center gap-1 text-stone-400 text-xs hover:text-stone-600 mr-auto">
                    {isOpen ? <>הסתר <ChevronUp size={14} /></> : <>הצג {stats.total} פריטים <ChevronDown size={14} /></>}
                  </button>
                )}
              </div>
            </div>

            {isOpen && stats.items.length > 0 && (
              <div className="border-t border-white/60 divide-y divide-white/50">
                {stats.items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2 px-4 py-2.5">
                    <button onClick={() => toggleBought(it.id)}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${it.bought ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300 text-transparent hover:border-emerald-400'}`}>
                      <Check size={13} />
                    </button>
                    <span className="text-base shrink-0">{it.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-sm font-medium ${it.bought ? 'line-through text-stone-400' : 'text-stone-800'}`}>{it.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColor[it.status]}`}>{it.status}</span>
                        {it.link && <a href={it.link} target="_blank" rel="noopener noreferrer" className="text-amber-500"><ExternalLink size={11} /></a>}
                      </div>
                      <p className="text-[11px] text-stone-400">
                        {it.quantity > 1 ? `${it.quantity}× ` : ''}{it.price > 0 ? fmt(itemTotal(it)) : 'ללא מחיר'}{it.store ? ` · ${it.store}` : ''}
                      </p>
                    </div>
                    <button onClick={() => (it.placed ? unplaceItem(it.id) : placeItem(it.id, Math.round(room.width / 2), Math.round(room.length / 2)))}
                      title={it.placed ? 'הסר מהתוכנית' : 'הצב בתוכנית'}
                      className={`p-1.5 rounded-lg shrink-0 ${it.placed ? 'text-amber-600 bg-amber-50' : 'text-stone-300 hover:text-amber-500'}`}>
                      {it.placed ? <MapPin size={14} /> : <MapPinOff size={14} />}
                    </button>
                    <button onClick={() => setItemModal({ open: true, item: it })} className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 shrink-0"><Pencil size={13} /></button>
                    <button onClick={() => setConfirmDel({ kind: 'item', id: it.id, name: it.name })} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <RoomModal open={roomModal.open} room={roomModal.room} onClose={() => setRoomModal({ open: false, room: null })} onSave={saveRoom} />
      <PlanItemModal open={itemModal.open} item={itemModal.item} rooms={rooms} defaultRoomId={itemModal.roomId} onClose={() => setItemModal({ open: false, item: null })} onSave={saveItem} />

      <ConfirmDialog
        open={!!confirmDel}
        title={confirmDel?.kind === 'room' ? 'מחיקת חדר' : 'מחיקת פריט'}
        message={confirmDel?.kind === 'room'
          ? `למחוק את "${confirmDel?.name}" וכל הפריטים שבו? פעולה זו אינה ניתנת לביטול.`
          : `למחוק את "${confirmDel?.name}"?`}
        confirmLabel="מחק"
        danger
        onConfirm={() => {
          if (confirmDel?.kind === 'room') deleteRoom(confirmDel.id);
          else if (confirmDel) deleteItem(confirmDel.id);
          setConfirmDel(null);
        }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
