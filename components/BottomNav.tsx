'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Boxes, PlusCircle, ShoppingCart, Wallet } from 'lucide-react';

const tabs = [
  { href: '/dashboard', label: 'בקרה', icon: LayoutDashboard },
  { href: '/planning', label: 'תכנון', icon: Boxes },
  { href: '/add-item', label: 'הוסף', icon: PlusCircle, primary: true },
  { href: '/shopping', label: 'קניות', icon: ShoppingCart },
  { href: '/budget', label: 'תקציב', icon: Wallet },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-center"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)', paddingLeft: 16, paddingRight: 16 }}
    >
      <nav
        className="glass-nav w-full max-w-sm rounded-[28px] flex items-end justify-around px-3 pt-2 pb-2"
        style={{ marginBottom: 8 }}
      >
        {tabs.map(({ href, label, icon: Icon, primary }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href));

          if (primary) {
            return (
              <Link key={href} href={href} className="flex flex-col items-center -mt-6 group">
                <div
                  className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
                  style={{
                    background: active
                      ? 'linear-gradient(145deg, #f59e0b, #d97706)'
                      : 'linear-gradient(145deg, #fbbf24, #f59e0b)',
                    boxShadow: '0 6px 20px rgba(245,158,11,0.45), inset 0 1px 0 rgba(255,255,255,0.35)',
                  }}
                >
                  <Icon size={22} className="text-white drop-shadow-sm" />
                </div>
                <span className="text-[10px] mt-1 font-semibold text-amber-600">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition-all duration-200 active:scale-95"
            >
              {active && (
                <div
                  className="absolute w-10 h-10 rounded-xl"
                  style={{
                    background: 'rgba(251,191,36,0.18)',
                    backdropFilter: 'blur(8px)',
                  }}
                />
              )}
              <Icon
                size={22}
                className="relative transition-colors duration-200"
                style={{ color: active ? '#d97706' : '#a8a29e' }}
              />
              <span
                className="text-[10px] font-medium transition-colors duration-200"
                style={{ color: active ? '#d97706' : '#a8a29e' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
