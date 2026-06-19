'use client';
import { useState } from 'react';
import { Room } from '@/lib/planning/types';
import { RotateCw } from 'lucide-react';

interface Props {
  rooms: Room[];
}

// Lightweight CSS-3D isometric preview (zero dependencies, builds clean).
// Each room is an extruded block: floor + two far walls. This is the MVP;
// a full React-Three-Fiber scene can drop in behind the same component API.

export default function Plan3DPreview({ rooms }: Props) {
  const [spin, setSpin] = useState(-32);
  const s = 0.34;                         // px per cm
  const wallFactor = 0.42;                // compress wall height for readability

  const maxX = Math.max(600, ...rooms.map((r) => r.x + r.width));
  const maxY = Math.max(500, ...rooms.map((r) => r.y + r.length));

  if (rooms.length === 0) {
    return <div className="glass-card rounded-3xl p-10 text-center text-stone-400">הוסיפו חדרים כדי לראות תצוגת 3D</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setSpin((v) => v - 15)} className="glass-card w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 active:scale-95"><RotateCw size={16} className="-scale-x-100" /></button>
        <button onClick={() => setSpin((v) => v + 15)} className="glass-card w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 active:scale-95"><RotateCw size={16} /></button>
        <span className="text-xs text-stone-400">תצוגת 3D · סובבו את הזווית</span>
      </div>

      <div
        className="glass-card rounded-3xl overflow-hidden flex items-center justify-center"
        style={{ height: '64vh', perspective: 1400 }}
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(58deg) rotateZ(${spin}deg)`,
            width: maxX * s,
            height: maxY * s,
            position: 'relative',
          }}
        >
          {rooms.map((room) => {
            const W = room.width * s;
            const L = room.length * s;
            const H = room.height * s * wallFactor;
            return (
              <div
                key={room.id}
                style={{
                  position: 'absolute',
                  left: room.x * s,
                  top: room.y * s,
                  width: W,
                  height: L,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* floor */}
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    background: room.color + '40',
                    border: `1px solid ${room.color}aa`,
                    borderRadius: 4,
                  }}
                />
                {/* label on floor */}
                <div
                  dir="rtl"
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: room.color, gap: 4,
                    transform: `rotateZ(${-spin}deg)`,
                  }}
                >
                  <span>{room.emoji}</span><span>{room.name}</span>
                </div>
                {/* back wall (north edge, y=0) */}
                <div
                  style={{
                    position: 'absolute', left: 0, top: 0, width: W, height: H,
                    transformOrigin: '0% 0%', transform: 'rotateX(-90deg)',
                    background: `linear-gradient(${room.color}cc, ${room.color}88)`,
                    border: `1px solid ${room.color}`,
                  }}
                />
                {/* left wall (west edge, x=0) */}
                <div
                  style={{
                    position: 'absolute', left: 0, top: 0, width: H, height: L,
                    transformOrigin: '0% 0%', transform: 'rotateY(90deg)',
                    background: `linear-gradient(90deg, ${room.color}aa, ${room.color}66)`,
                    border: `1px solid ${room.color}`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
