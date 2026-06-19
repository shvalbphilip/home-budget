'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Wallet,
  Grid3x3, FileSpreadsheet, PlusCircle, Home, Boxes,
  Receipt, ShieldCheck, LogOut, Crown, User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';

const baseLinks = [
  { href: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { href: '/planning', label: 'תכנון הדירה', icon: Boxes },
  { href: '/inventory', label: 'מלאי', icon: Package },
  { href: '/add-item', label: 'הוסף פריט', icon: PlusCircle },
  { href: '/shopping', label: 'רשימת קניות', icon: ShoppingCart },
  { href: '/budget', label: 'תכנון תקציב', icon: Wallet },
  { href: '/categories', label: 'חדרים', icon: Grid3x3 },
  { href: '/export', label: 'יצוא Excel', icon: FileSpreadsheet },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const { enabled, isAdmin, profile, role, signOut } = useAuth();

  const links = [...baseLinks];
  if (enabled) {
    links.splice(6, 0, { href: '/payments', label: 'תשלומים', icon: Receipt });
    if (isAdmin) links.push({ href: '/admin', label: 'ניהול', icon: ShieldCheck });
  }

  const handleSignOut = async () => { await signOut(); router.replace('/login'); };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col min-h-screen glass-dark">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(145deg, #fbbf24, #f59e0b)', boxShadow: '0 4px 16px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.3)' }}>
            <Home size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">מעבר לדירה</p>
            <p className="text-white/40 text-xs">מנהל תקציב ומלאי</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200"
              style={active ? {
                background: 'rgba(251,191,36,0.22)', color: '#fbbf24',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(251,191,36,0.15)',
                border: '1px solid rgba(251,191,36,0.25)',
              } : { color: 'rgba(255,255,255,0.55)' }}>
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {enabled && profile ? (
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: role === 'admin' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.1)' }}>
              {role === 'admin' ? <Crown size={15} className="text-amber-400" /> : <UserIcon size={15} className="text-white/60" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{profile.full_name ?? 'משתמש'}</p>
              <p className="text-white/40 text-[10px]">{role === 'admin' ? 'מנהל' : 'משתמש'}</p>
            </div>
            <button onClick={handleSignOut} title="התנתק" className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-white/25 text-xs text-center">Supabase · Vercel</p>
        </div>
      )}
    </aside>
  );
}
