'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { getCategoryStats } from '@/lib/utils';
import { fmt } from '@/lib/utils';
import ProgressBar from '@/components/ProgressBar';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Grid3x3, CheckCircle, ShoppingCart, Package, Plus, Pencil, Trash2, RotateCcw, Check, X } from 'lucide-react';
import Link from 'next/link';

const EMOJI_OPTIONS = ['🏠','🍳','🛋️','🛏️','👗','🛡️','🌿','🚿','🛁','🚽','⚡','🪑','💡','🎨','📦','🔧','🪟','🖥️','🧹','🛒','🌱','🏋️','📚','🎵','🧸','🪴','🍽️','🧺','🪞','🚪','🎮','🏊'];

interface Confirm {
  type: 'delete' | 'reset';
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const { items, categories, addCategory, renameCategory, deleteCategory, resetCategory } = useStore();
  const catStats = getCategoryStats(items, categories);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [showEditEmoji, setShowEditEmoji] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏠');
  const [showNewEmoji, setShowNewEmoji] = useState(false);

  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const startEdit = (id: string, name: string, emoji: string) => {
    setEditingId(id);
    setEditName(name);
    setEditEmoji(emoji);
    setShowEditEmoji(false);
  };

  const saveEdit = () => {
    if (editName.trim() && editingId) {
      renameCategory(editingId, editName.trim(), editEmoji);
    }
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCategory(newName.trim(), newEmoji, 0);
    setNewName('');
    setNewEmoji('🏠');
    setShowAddForm(false);
  };

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.type === 'delete') deleteCategory(confirm.id);
    if (confirm.type === 'reset') resetCategory(confirm.id);
    setConfirm(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'delete' ? 'מחיקת קטגוריה' : 'איפוס קטגוריה'}
        message={confirm?.type === 'delete'
          ? `האם למחוק את "${confirm?.name}" ואת כל הפריטים שבה? פעולה זו אינה ניתנת לביטול.`
          : `האם למחוק את כל הפריטים בקטגוריה "${confirm?.name}"? הקטגוריה עצמה תישאר.`
        }
        confirmLabel={confirm?.type === 'delete' ? 'מחק קטגוריה' : 'אפס פריטים'}
        danger
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Grid3x3 size={24} className="text-amber-500" /> חדרים וקטגוריות
          </h1>
          <p className="text-stone-500 text-sm">{categories.length} קטגוריות</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
        >
          <Plus size={16} /> הוסף קטגוריה
        </button>
      </div>

      {/* Add category form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 space-y-4">
          <h3 className="font-bold text-stone-800">קטגוריה חדשה</h3>
          <div className="flex gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNewEmoji(!showNewEmoji)}
                className="w-12 h-12 text-2xl rounded-xl border-2 border-stone-200 hover:border-amber-300 flex items-center justify-center transition-colors"
              >
                {newEmoji}
              </button>
              {showNewEmoji && (
                <div className="absolute top-14 right-0 z-20 bg-white border border-stone-200 rounded-2xl p-3 shadow-xl grid grid-cols-6 gap-1 w-56">
                  {EMOJI_OPTIONS.map((e) => (
                    <button key={e} type="button" onClick={() => { setNewEmoji(e); setShowNewEmoji(false); }}
                      className="text-xl p-1.5 rounded-lg hover:bg-amber-50 transition-colors">{e}</button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="שם הקטגוריה..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400"
              autoFocus
            />
            <button onClick={handleAdd} disabled={!newName.trim()} className="px-4 py-2.5 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 disabled:opacity-40 transition-colors">
              הוסף
            </button>
            <button onClick={() => { setShowAddForm(false); setNewName(''); }} className="px-3 py-2.5 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <Grid3x3 size={48} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-400 font-medium">אין קטגוריות עדיין</p>
          <button onClick={() => setShowAddForm(true)} className="mt-3 text-amber-600 text-sm font-medium hover:text-amber-700">+ הוסף קטגוריה ראשונה</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {catStats.map((c) => {
            const isExpanded = expanded === c.id;
            const isEditing = editingId === c.id;
            const catItems = items.filter((i) => i.categoryId === c.id);

            return (
              <div key={c.id} className={`bg-white rounded-2xl border transition-all ${c.isOverBudget ? 'border-red-200' : c.noBudget && c.total > 0 ? 'border-amber-200' : 'border-stone-200'}`}>
                {/* Header */}
                <div className="p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="relative">
                          <button type="button" onClick={() => setShowEditEmoji(!showEditEmoji)}
                            className="w-10 h-10 text-xl rounded-xl border border-stone-200 hover:border-amber-300 flex items-center justify-center">
                            {editEmoji}
                          </button>
                          {showEditEmoji && (
                            <div className="absolute top-12 right-0 z-20 bg-white border border-stone-200 rounded-2xl p-3 shadow-xl grid grid-cols-6 gap-1 w-56">
                              {EMOJI_OPTIONS.map((e) => (
                                <button key={e} type="button" onClick={() => { setEditEmoji(e); setShowEditEmoji(false); }}
                                  className="text-xl p-1.5 rounded-lg hover:bg-amber-50">{e}</button>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="flex-1 px-3 py-2 text-sm rounded-xl border border-amber-400 focus:outline-none"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="flex-1 bg-amber-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-1">
                          <Check size={14} /> שמור
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-2 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <button onClick={() => setExpanded(isExpanded ? null : c.id)} className="text-right flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{c.emoji}</span>
                            <h3 className="font-bold text-stone-900 text-base">{c.name}</h3>
                          </div>
                        </button>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(c.id, c.name, c.emoji)} className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 hover:bg-amber-50 transition-colors" title="שנה שם">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setConfirm({ type: 'reset', id: c.id, name: c.name })} className="p-1.5 rounded-lg text-stone-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="אפס פריטים">
                            <RotateCcw size={14} />
                          </button>
                          <button onClick={() => setConfirm({ type: 'delete', id: c.id, name: c.name })} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="מחק קטגוריה">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <button onClick={() => setExpanded(isExpanded ? null : c.id)} className="w-full text-right">
                        {/* Completion */}
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-stone-500 mb-1">
                            <span>השלמת חדר</span>
                            <span className="font-semibold text-stone-700">{c.completion}% מוכן</span>
                          </div>
                          <ProgressBar value={c.completion} color={c.completion < 50 ? 'red' : c.completion < 80 ? 'amber' : 'green'} height="sm" />
                        </div>

                        {/* Budget */}
                        {c.plannedBudget > 0 && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-stone-500 mb-1">
                              <span>תקציב</span>
                              <span className="font-semibold">{fmt(c.spent)} / {fmt(c.plannedBudget)}</span>
                            </div>
                            <ProgressBar value={c.budgetUsed} color={c.isOverBudget ? 'red' : 'amber'} height="sm" />
                          </div>
                        )}
                        {c.noBudget && c.total > 0 && (
                          <p className="text-xs text-amber-600 mb-2">⚠ לא הוגדר תקציב</p>
                        )}

                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="bg-emerald-50 rounded-lg p-2 text-center">
                            <CheckCircle size={12} className="text-emerald-500 mx-auto mb-0.5" />
                            <p className="text-xs font-bold text-emerald-700">{c.done}</p>
                            <p className="text-xs text-emerald-600">נרכש</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-2 text-center">
                            <ShoppingCart size={12} className="text-amber-500 mx-auto mb-0.5" />
                            <p className="text-xs font-bold text-amber-700">{c.missing}</p>
                            <p className="text-xs text-amber-600">חסר</p>
                          </div>
                          <div className="bg-stone-50 rounded-lg p-2 text-center">
                            <Package size={12} className="text-stone-400 mx-auto mb-0.5" />
                            <p className="text-xs font-bold text-stone-700">{c.total}</p>
                            <p className="text-xs text-stone-500">סה״כ</p>
                          </div>
                        </div>
                      </button>
                    </>
                  )}
                </div>

                {/* Expanded items */}
                {isExpanded && !isEditing && (
                  <div className="border-t border-stone-100 px-4 pb-4 pt-3 space-y-2">
                    {catItems.length === 0 ? (
                      <p className="text-sm text-stone-400 text-center py-2">אין פריטים בקטגוריה זו</p>
                    ) : catItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <StatusBadge status={item.status} />
                          <span className="text-sm text-stone-800 truncate">{item.name}</span>
                          {item.quantity > 1 && <span className="text-xs text-stone-400">×{item.quantity}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PriorityBadge priority={item.priority} />
                          <span className="text-sm text-stone-600">
                            {item.actualPrice > 0 ? fmt(item.actualPrice * item.quantity) : item.estimatedPrice > 0 ? fmt(item.estimatedPrice * item.quantity) : '—'}
                          </span>
                          <Link href={`/add-item?id=${item.id}`} className="text-stone-400 hover:text-amber-500 p-1"><Pencil size={12} /></Link>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/add-item?cat=${c.id}`} className="flex-1 text-center text-xs bg-amber-50 text-amber-700 py-2 rounded-lg font-medium hover:bg-amber-100 transition-colors">
                        + הוסף פריט
                      </Link>
                      <Link href="/budget" className="flex-1 text-center text-xs bg-stone-50 text-stone-600 py-2 rounded-lg font-medium hover:bg-stone-100 transition-colors">
                        ✏️ ערוך תקציב
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
