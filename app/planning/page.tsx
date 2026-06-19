'use client';
import { useEffect, useRef, useState } from 'react';
import { usePlanningStore } from '@/lib/planning/store';
import { downscaleImage } from '@/lib/planning/geometry';
import PlanningOverview from '@/components/planning/PlanningOverview';
import RoomsManager from '@/components/planning/RoomsManager';
import FloorPlan2D from '@/components/planning/FloorPlan2D';
import Plan3DPreview from '@/components/planning/Plan3DPreview';
import AdvisorChat from '@/components/planning/AdvisorChat';
import { LayoutGrid, Boxes, Home, Sparkles, Box, Square, ImagePlus, ImageOff } from 'lucide-react';

type Tab = 'overview' | 'plan' | 'rooms' | 'advisor';

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'overview', label: 'סקירה', icon: LayoutGrid },
  { id: 'plan', label: 'תוכנית', icon: Boxes },
  { id: 'rooms', label: 'חדרים', icon: Home },
  { id: 'advisor', label: 'יועץ', icon: Sparkles },
];

export default function PlanningPage() {
  const store = usePlanningStore();
  const { loaded, load, rooms, items, floorPlanImage, floorPlanName, setFloorPlanImage, updateRoom, placeItem } = store;
  const [tab, setTab] = useState<Tab>('overview');
  const [view3D, setView3D] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.5);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const onUploadPlan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.type === 'application/pdf') {
        // PDFs aren't rendered inline in the MVP — keep the name as a reference.
        setFloorPlanImage(null, file.name);
        alert('קובץ PDF נשמר כהפניה. לשרטוט רקע בעורך השתמשו בתמונה (PNG/JPG).');
      } else {
        const dataUrl = await downscaleImage(file);
        setFloorPlanImage(dataUrl, file.name);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'העלאה נכשלה');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Home size={22} className="text-amber-500" /> תכנון הדירה
        </h1>
        <p className="text-stone-500 text-xs md:text-sm mt-0.5">תכננו את הדירה חדר-חדר, עצבו תוכנית קומה והתייעצו עם יועץ הדירה</p>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl p-1 flex gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === id ? 'text-white' : 'text-stone-500 hover:text-stone-700'
            }`}
            style={tab === id ? { background: 'linear-gradient(145deg,#fbbf24,#f59e0b)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' } : {}}>
            <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'overview' && <PlanningOverview />}
      {tab === 'rooms' && <RoomsManager />}
      {tab === 'advisor' && <AdvisorChat />}

      {tab === 'plan' && (
        <div className="space-y-3">
          {/* plan toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="glass-card rounded-2xl p-1 flex gap-1">
              <button onClick={() => setView3D(false)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold ${!view3D ? 'bg-amber-500 text-white' : 'text-stone-500'}`}>
                <Square size={14} /> 2D
              </button>
              <button onClick={() => setView3D(true)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold ${view3D ? 'bg-amber-500 text-white' : 'text-stone-500'}`}>
                <Box size={14} /> 3D
              </button>
            </div>

            {!view3D && (
              <>
                <button onClick={() => fileRef.current?.click()}
                  className="glass-card flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 active:scale-95">
                  <ImagePlus size={14} /> רקע תוכנית
                </button>
                {floorPlanImage && (
                  <>
                    <button onClick={() => setFloorPlanImage(null, null)}
                      className="glass-card flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 active:scale-95">
                      <ImageOff size={14} /> הסר רקע
                    </button>
                    <label className="flex items-center gap-2 text-xs text-stone-500">
                      שקיפות
                      <input type="range" min={0.1} max={1} step={0.05} value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))} className="accent-amber-500" />
                    </label>
                  </>
                )}
                {floorPlanName && !floorPlanImage && (
                  <span className="text-xs text-stone-400">📎 {floorPlanName}</span>
                )}
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onUploadPlan} />
          </div>

          {view3D ? (
            <Plan3DPreview rooms={rooms} />
          ) : (
            <FloorPlan2D
              rooms={rooms}
              items={items}
              image={floorPlanImage}
              imageOpacity={opacity}
              selectedRoomId={selectedRoom}
              onSelectRoom={setSelectedRoom}
              onMoveRoom={(id, x, y) => updateRoom(id, { x, y })}
              onResizeRoom={(id, width, length) => updateRoom(id, { width, length })}
              onMoveItem={(id, px, py) => placeItem(id, px, py)}
            />
          )}

          {rooms.length === 0 && (
            <div className="glass-card rounded-3xl p-8 text-center text-stone-400 text-sm">
              אין עדיין חדרים. עברו ללשונית "חדרים" כדי להוסיף, והם יופיעו כאן בתוכנית.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
