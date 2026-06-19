'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Category } from '@/lib/types';
import { Home, Plus, Trash2, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const SUGGESTED_CATEGORIES = [
  { name: 'מטבח', emoji: '🍳' },
  { name: 'סלון', emoji: '🛋️' },
  { name: 'חדר שינה', emoji: '🛏️' },
  { name: 'חדר ארונות', emoji: '👗' },
  { name: 'ממ"ד', emoji: '🛡️' },
  { name: 'מרפסת', emoji: '🌿' },
  { name: 'שירותים/אמבטיה הורים', emoji: '🚿' },
  { name: 'שירותים/אמבטיה ילדים', emoji: '🛁' },
  { name: 'שירותי אורחים', emoji: '🚽' },
  { name: 'מוצרי חשמל', emoji: '⚡' },
  { name: 'ריהוט', emoji: '🪑' },
  { name: 'תאורה', emoji: '💡' },
  { name: 'דקורציה', emoji: '🎨' },
  { name: 'אחסון', emoji: '📦' },
  { name: 'שונות', emoji: '🔧' },
];

const EMOJI_OPTIONS = ['🏠','🍳','🛋️','🛏️','👗','🛡️','🌿','🚿','🛁','🚽','⚡','🪑','💡','🎨','📦','🔧','🪟','🖥️','🧹','🛒','🌱','🏋️','📚','🎵','🧸','🪴','🍽️','🧺','🪞','🚪'];

type Step = 'budget' | 'categories' | 'done';

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding } = useStore();

  const [step, setStep] = useState<Step>('budget');
  const [budget, setBudget] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏠');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');

  const toggleSuggested = (s: { name: string; emoji: string }) => {
    const exists = categories.find((c) => c.name === s.name);
    if (exists) {
      setCategories((prev) => prev.filter((c) => c.name !== s.name));
    } else {
      setCategories((prev) => [...prev, { id: genId(), name: s.name, emoji: s.emoji, plannedBudget: 0 }]);
    }
  };

  const addCustom = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (categories.find((c) => c.name === trimmed)) return;
    setCategories((prev) => [...prev, { id: genId(), name: trimmed, emoji: newEmoji, plannedBudget: 0 }]);
    setNewName('');
    setNewEmoji('🏠');
  };

  const removeCategory = (id: string) => setCategories((prev) => prev.filter((c) => c.id !== id));

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditEmoji(cat.emoji);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    setCategories((prev) => prev.map((c) => c.id === editingId ? { ...c, name: editName.trim(), emoji: editEmoji } : c));
    setEditingId(null);
  };

  const finish = () => {
    completeOnboarding(Number(budget) || 0, categories);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <Home size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900">ברוכים הבאים!</h1>
          <p className="text-stone-500 mt-2">בואו נגדיר את הפרויקט שלך מהתחלה</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {(['budget', 'categories', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' :
                ((['budget','categories','done'] as Step[]).indexOf(step) > i) ? 'bg-emerald-500 text-white' :
                'bg-stone-200 text-stone-500'
              }`}>
                {((['budget','categories','done'] as Step[]).indexOf(step) > i) ? <Check size={14} /> : i + 1}
              </div>
              {i < 2 && <div className="w-12 h-0.5 bg-stone-200" />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Budget ── */}
        {step === 'budget' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900 mb-1">מה התקציב הכולל לדירה?</h2>
              <p className="text-stone-500 text-sm">ניתן לשנות בכל עת מתוך הגדרות התקציב</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">תקציב כולל (₪)</label>
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">₪</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="לדוגמה: 150000"
                  className="w-full pr-10 pl-4 py-4 text-xl font-semibold rounded-2xl border-2 border-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
                  autoFocus
                  min={0}
                />
              </div>
              <p className="text-xs text-stone-400 mt-2">* השאר ריק אם עדיין לא ידוע</p>
            </div>
            <button
              onClick={() => setStep('categories')}
              className="w-full bg-amber-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              המשך <ChevronLeft size={20} />
            </button>
          </div>
        )}

        {/* ── Step 2: Categories ── */}
        {step === 'categories' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-900 mb-1">אילו חדרים/קטגוריות יש בדירה?</h2>
                <p className="text-stone-500 text-sm">בחר מהרשימה או הוסף בעצמך. ניתן לשנות מאוחר יותר.</p>
              </div>
              <span className="bg-amber-100 text-amber-700 text-sm font-bold px-3 py-1 rounded-full">{categories.length} נבחרו</span>
            </div>

            {/* Suggested */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">הצעות</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_CATEGORIES.map((s) => {
                  const selected = !!categories.find((c) => c.name === s.name);
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => toggleSuggested(s)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                        selected ? 'bg-amber-500 border-amber-500 text-white' : 'border-stone-200 text-stone-700 hover:border-amber-300'
                      }`}
                    >
                      {s.emoji} {s.name}
                      {selected && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom add */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">הוסף קטגוריה מותאמת</p>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-12 h-12 text-xl rounded-xl border-2 border-stone-200 hover:border-amber-300 flex items-center justify-center transition-colors"
                  >
                    {newEmoji}
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute top-14 right-0 z-20 bg-white border border-stone-200 rounded-2xl p-3 shadow-xl grid grid-cols-6 gap-1 w-56">
                      {EMOJI_OPTIONS.map((e) => (
                        <button key={e} type="button" onClick={() => { setNewEmoji(e); setShowEmojiPicker(false); }}
                          className="text-xl p-1.5 rounded-lg hover:bg-amber-50 transition-colors">{e}</button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                  placeholder="שם הקטגוריה..."
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={addCustom}
                  disabled={!newName.trim()}
                  className="px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium text-sm hover:bg-amber-600 disabled:opacity-40 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Selected list */}
            {categories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">הקטגוריות שלי ({categories.length})</p>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                      {editingId === cat.id ? (
                        <>
                          <span className="text-xl">{editEmoji}</span>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            className="flex-1 px-2 py-1 text-sm rounded-lg border border-amber-400 focus:outline-none"
                            autoFocus
                          />
                          <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-600 p-1"><Check size={16} /></button>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">{cat.emoji}</span>
                          <span className="flex-1 text-sm font-medium text-stone-800">{cat.name}</span>
                          <button onClick={() => startEdit(cat)} className="text-stone-400 hover:text-amber-500 p-1 text-xs">✏️</button>
                          <button onClick={() => removeCategory(cat.id)} className="text-stone-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep('budget')} className="px-5 py-3 rounded-2xl border-2 border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors flex items-center gap-1">
                <ChevronRight size={18} /> חזור
              </button>
              <button
                onClick={() => setStep('done')}
                className="flex-1 bg-amber-500 text-white py-3 rounded-2xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                המשך <ChevronLeft size={20} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 'done' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Check size={40} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">הכל מוכן!</h2>
              <p className="text-stone-500">הפרויקט שלך נוצר. עכשיו תוכל להתחיל להוסיף פריטים.</p>
            </div>
            <div className="bg-stone-50 rounded-2xl p-4 text-right space-y-2 text-sm">
              {budget && Number(budget) > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-500">תקציב כולל</span>
                  <span className="font-bold text-stone-800">₪{Number(budget).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">קטגוריות שנוצרו</span>
                <span className="font-bold text-stone-800">{categories.length}</span>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={finish} className="w-full bg-amber-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20">
                🚀 התחל לנהל את המעבר שלי
              </button>
              <button onClick={() => setStep('categories')} className="w-full text-stone-500 text-sm hover:text-stone-700 transition-colors">
                חזור לעריכת קטגוריות
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
