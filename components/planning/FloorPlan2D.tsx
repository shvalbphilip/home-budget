'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { Room, PlanItem } from '@/lib/planning/types';
import { roomAreaM2 } from '@/lib/planning/geometry';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

interface Props {
  rooms: Room[];
  items: PlanItem[];
  image: string | null;
  imageOpacity: number;
  selectedRoomId: string | null;
  onSelectRoom: (id: string | null) => void;
  onMoveRoom: (id: string, x: number, y: number) => void;
  onResizeRoom: (id: string, width: number, length: number) => void;
  onMoveItem: (id: string, px: number, py: number) => void;
}

const GRID = 10; // cm snap
const snap = (v: number) => Math.round(v / GRID) * GRID;

type Drag =
  | { kind: 'room'; id: string; sx: number; sy: number; ox: number; oy: number }
  | { kind: 'resize'; id: string; sx: number; sy: number; ow: number; ol: number }
  | { kind: 'item'; id: string; roomId: string; sx: number; sy: number; ox: number; oy: number }
  | null;

export default function FloorPlan2D({
  rooms, items, image, imageOpacity, selectedRoomId,
  onSelectRoom, onMoveRoom, onResizeRoom, onMoveItem,
}: Props) {
  const [scale, setScale] = useState(0.42); // px per cm
  const drag = useRef<Drag>(null);
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);

  // live override positions during a drag (cm)
  const override = useRef<Record<string, { x: number; y: number; w?: number; l?: number }>>({});

  const onPointerMove = useCallback((e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dxCm = (e.clientX - d.sx) / scale;
    const dyCm = (e.clientY - d.sy) / scale;
    if (d.kind === 'room') {
      override.current[d.id] = { x: Math.max(0, snap(d.ox + dxCm)), y: Math.max(0, snap(d.oy + dyCm)) };
    } else if (d.kind === 'resize') {
      override.current[d.id] = { x: 0, y: 0, w: Math.max(80, snap(d.ow + dxCm)), l: Math.max(80, snap(d.ol + dyCm)) };
    } else if (d.kind === 'item') {
      override.current['item:' + d.id] = { x: Math.max(0, snap(d.ox + dxCm)), y: Math.max(0, snap(d.oy + dyCm)) };
    }
    rerender();
  }, [scale, rerender]);

  const onPointerUp = useCallback(() => {
    const d = drag.current;
    if (d) {
      if (d.kind === 'room') {
        const o = override.current[d.id];
        if (o) onMoveRoom(d.id, o.x, o.y);
      } else if (d.kind === 'resize') {
        const o = override.current[d.id];
        if (o && o.w != null && o.l != null) onResizeRoom(d.id, o.w, o.l);
      } else if (d.kind === 'item') {
        const o = override.current['item:' + d.id];
        if (o) onMoveItem(d.id, o.x, o.y);
      }
    }
    drag.current = null;
    override.current = {};
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    rerender();
  }, [onMoveRoom, onResizeRoom, onMoveItem, onPointerMove, rerender]);

  useEffect(() => () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }, [onPointerMove, onPointerUp]);

  const startDrag = (d: Drag) => {
    drag.current = d;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // canvas extents (cm) — fit all rooms + margin
  const maxX = Math.max(600, ...rooms.map((r) => r.x + r.width + 80));
  const maxY = Math.max(500, ...rooms.map((r) => r.y + r.length + 80));

  const placedItems = items.filter((i) => i.placed);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setScale((s) => Math.min(0.9, s + 0.08))}
          className="glass-card w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 active:scale-95"><ZoomIn size={16} /></button>
        <button onClick={() => setScale((s) => Math.max(0.22, s - 0.08))}
          className="glass-card w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 active:scale-95"><ZoomOut size={16} /></button>
        <span className="text-xs text-stone-400 flex items-center gap-1"><Move size={12} /> גררו חדרים ופריטים · הצמדה ל-{GRID} ס״מ</span>
      </div>

      <div className="glass-card rounded-3xl p-3 overflow-auto" style={{ maxHeight: '70vh' }}>
        <div
          dir="ltr"
          className="relative rounded-2xl"
          style={{
            width: maxX * scale,
            height: maxY * scale,
            minWidth: '100%',
            background:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0 1px, transparent 1px ' + (GRID * scale * 5) + 'px),' +
              'repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0 1px, transparent 1px ' + (GRID * scale * 5) + 'px),' +
              'rgba(255,255,255,0.35)',
          }}
          onPointerDown={(e) => { if (e.target === e.currentTarget) onSelectRoom(null); }}
        >
          {image && (
            <img src={image} alt="תוכנית" className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-2xl"
              style={{ opacity: imageOpacity }} />
          )}

          {rooms.map((room) => {
            const o = override.current[room.id];
            const x = o?.x ?? room.x;
            const y = o?.y ?? room.y;
            const w = o?.w ?? room.width;
            const l = o?.l ?? room.length;
            const selected = selectedRoomId === room.id;
            return (
              <div
                key={room.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelectRoom(room.id);
                  startDrag({ kind: 'room', id: room.id, sx: e.clientX, sy: e.clientY, ox: room.x, oy: room.y });
                }}
                className="absolute rounded-xl select-none cursor-move transition-shadow"
                style={{
                  left: x * scale, top: y * scale, width: w * scale, height: l * scale,
                  background: room.color + '26',
                  border: `2px solid ${room.color}${selected ? 'ff' : '99'}`,
                  boxShadow: selected ? `0 0 0 3px ${room.color}33, 0 8px 24px ${room.color}22` : 'none',
                  touchAction: 'none',
                  zIndex: selected ? 20 : 10,
                }}
              >
                <div dir="rtl" className="absolute top-1 right-1.5 text-[11px] font-bold flex items-center gap-1 pointer-events-none" style={{ color: room.color }}>
                  <span>{room.emoji}</span><span>{room.name}</span>
                </div>
                <div dir="rtl" className="absolute bottom-1 right-1.5 text-[9px] text-stone-500 pointer-events-none">
                  {(w / 100).toFixed(1)}×{(l / 100).toFixed(1)} מ׳ · {roomAreaM2({ ...room, width: w, length: l })} מ״ר
                </div>

                {/* placed items inside this room */}
                {placedItems.filter((i) => i.roomId === room.id).map((it) => {
                  const io = override.current['item:' + it.id];
                  const ix = io?.x ?? it.px;
                  const iy = io?.y ?? it.py;
                  return (
                    <div
                      key={it.id}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        startDrag({ kind: 'item', id: it.id, roomId: room.id, sx: e.clientX, sy: e.clientY, ox: it.px, oy: it.py });
                      }}
                      dir="rtl"
                      className="absolute flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/90 shadow-sm border border-white text-[10px] font-medium cursor-grab active:cursor-grabbing"
                      style={{ left: ix * scale, top: iy * scale, touchAction: 'none', zIndex: 30 }}
                      title={it.name}
                    >
                      <span>{it.emoji}</span>
                      <span className="max-w-[64px] truncate text-stone-700">{it.name}</span>
                    </div>
                  );
                })}

                {/* resize handle (bottom-right in LTR canvas) */}
                {selected && (
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      startDrag({ kind: 'resize', id: room.id, sx: e.clientX, sy: e.clientY, ow: room.width, ol: room.length });
                    }}
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-white shadow cursor-nwse-resize"
                    style={{ border: `2px solid ${room.color}`, touchAction: 'none', zIndex: 40 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
