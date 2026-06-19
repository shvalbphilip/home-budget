'use client';
import { useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { exportToExcel, exportToJSON, downloadJSON, parseImportedJSON } from '@/lib/export';
import { getDashboardStats } from '@/lib/utils';
import { fmt } from '@/lib/utils';
import ConfirmDialog from '@/components/ConfirmDialog';
import { FileSpreadsheet, Download, CheckCircle, Upload, FileJson, RotateCcw, AlertTriangle } from 'lucide-react';

export default function ExportPage() {
  const { items, totalBudget, categories, importState, resetAll } = useStore();
  const [xlsDone, setXlsDone] = useState(false);
  const [jsonDone, setJsonDone] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [importError, setImportError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const stats = getDashboardStats(items, totalBudget, categories);

  const doExcel = () => {
    if (items.length === 0 && categories.length === 0) return;
    exportToExcel(items, totalBudget, categories);
    setXlsDone(true);
    setTimeout(() => setXlsDone(false), 3000);
  };

  const doJSON = () => {
    const data = exportToJSON(totalBudget, categories, items);
    downloadJSON(data);
    setJsonDone(true);
    setTimeout(() => setJsonDone(false), 3000);
  };

  const doImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = parseImportedJSON(ev.target?.result as string);
        importState(data);
        setImportMsg(`✅ הגיבוי יובא בהצלחה! ${data.items.length} פריטים, ${data.categories.length} קטגוריות`);
        setImportError('');
      } catch {
        setImportError('❌ הקובץ אינו תקין או פגום');
        setImportMsg('');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 md:space-y-5">
      <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
        <FileSpreadsheet size={24} className="text-amber-500" /> יצוא וגיבוי
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
          <p className="text-xs text-stone-500">פריטים</p>
          <p className="font-bold text-stone-800">{items.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
          <p className="text-xs text-stone-500">הוצא</p>
          <p className="font-bold text-red-600">{fmt(stats.totalSpent)}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
          <p className="text-xs text-stone-500">חסרים</p>
          <p className="font-bold text-amber-600">{stats.totalMissing}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
          <p className="text-xs text-stone-500">קטגוריות</p>
          <p className="font-bold text-stone-800">{categories.length}</p>
        </div>
      </div>

      {/* Excel export */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <FileSpreadsheet size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-stone-800">יצוא לאקסל</h2>
            <p className="text-stone-500 text-xs">4 גיליונות: מלאי, חסרים, תקציב, פירוט קטגוריות</p>
          </div>
        </div>
        <button
          onClick={doExcel}
          disabled={items.length === 0 && categories.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {xlsDone ? <><CheckCircle size={18} /> הורד בהצלחה!</> : <><Download size={18} /> הורד קובץ Excel (.xlsx)</>}
        </button>
      </div>

      {/* JSON backup */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileJson size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-stone-800">גיבוי JSON</h2>
            <p className="text-stone-500 text-xs">גיבוי מלא שניתן לשחזר בכל עת — כולל כל הנתונים</p>
          </div>
        </div>
        <button
          onClick={doJSON}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
        >
          {jsonDone ? <><CheckCircle size={18} /> הגיבוי הורד!</> : <><Download size={18} /> הורד גיבוי JSON</>}
        </button>
      </div>

      {/* Import */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Upload size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-stone-800">יבוא גיבוי</h2>
            <p className="text-stone-500 text-xs">שחזר פרויקט מקובץ JSON שיוצא קודם</p>
          </div>
        </div>

        {importMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium">
            {importMsg}
          </div>
        )}
        {importError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
            <AlertTriangle size={16} /> {importError}
          </div>
        )}

        <input ref={fileRef} type="file" accept=".json" onChange={doImport} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors"
        >
          <Upload size={18} /> בחר קובץ גיבוי לייבוא
        </button>
        <p className="text-xs text-stone-400 text-center">
          ⚠ ייבוא יחליף את כל הנתונים הנוכחיים — מומלץ לגבות תחילה
        </p>
      </div>

      {/* Reset all */}
      <div className="bg-white rounded-2xl border border-red-200 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <RotateCcw size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-stone-800">איפוס מלא</h2>
            <p className="text-stone-500 text-xs">מחיקת כל הנתונים והתחלה מחדש — פעולה בלתי הפיכה</p>
          </div>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
        >
          <RotateCcw size={18} /> איפוס מלא של הפרויקט
        </button>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        title="איפוס מלא של הפרויקט"
        message="פעולה זו תמחק את כל הנתונים — קטגוריות, פריטים, תקציבים. לא ניתן לשחזר אלא מקובץ גיבוי. האם אתה בטוח?"
        confirmLabel="מחק הכל ואפס"
        danger
        onConfirm={() => { resetAll(); setShowResetConfirm(false); }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
