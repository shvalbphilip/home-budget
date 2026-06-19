'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Wallet,
  Grid3x3, FileSpreadsheet, PlusCircle, Home
} from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { href: '/inventory', label: 'מלאי', icon: Package },
  { href: '/add-item', label: 'הוסף פריט', icon: PlusCircle },
  { href: '/shopping', label: 'רשימת קניות', icon: ShoppingCart },
  { href: '/budget', label: 'תכנון תקציב', icon: Wallet },
  { href: '/categories', label: 'חדרים', icon: Grid3x3 },
  { href: '/export', label: 'יצוא Excel', icon: FileSpreadsheet },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-64 shrink-0 bg-stone-900 text-stone-100 flex flex-col min-h-screen">
      <div className="px-6 py-6 border-b border-stone-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
            <Home size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">מעבר לדירה</p>
            <p className="text-stone-400 text-xs">מנהל תקציב ומלאי</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t border-stone-700">
        <p className="text-stone-500 text-xs text-center">כל הנתונים נשמרים מקומית</p>
      </div>
    </aside>
  );
}
