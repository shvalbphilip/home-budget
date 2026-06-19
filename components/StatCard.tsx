import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'amber' | 'green' | 'red' | 'blue' | 'purple' | 'stone';
  large?: boolean;
}

const iconStyles = {
  amber: { bg: 'rgba(251,191,36,0.18)', color: '#d97706', glow: 'rgba(251,191,36,0.25)' },
  green: { bg: 'rgba(34,197,94,0.15)', color: '#16a34a', glow: 'rgba(34,197,94,0.2)' },
  red: { bg: 'rgba(239,68,68,0.15)', color: '#dc2626', glow: 'rgba(239,68,68,0.2)' },
  blue: { bg: 'rgba(59,130,246,0.15)', color: '#2563eb', glow: 'rgba(59,130,246,0.2)' },
  purple: { bg: 'rgba(168,85,247,0.15)', color: '#9333ea', glow: 'rgba(168,85,247,0.2)' },
  stone: { bg: 'rgba(120,113,108,0.12)', color: '#78716c', glow: 'rgba(120,113,108,0.15)' },
};

const textColors = {
  amber: '#92400e',
  green: '#14532d',
  red: '#7f1d1d',
  blue: '#1e3a5f',
  purple: '#3b0764',
  stone: '#292524',
};

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'stone', large }: Props) {
  const style = iconStyles[color];
  return (
    <div
      className="glass-card rounded-2xl p-4 flex items-center gap-3 transition-transform duration-150 active:scale-[0.98]"
    >
      <div
        className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
        style={{
          background: style.bg,
          boxShadow: `0 2px 12px ${style.glow}`,
        }}
      >
        <Icon size={20} style={{ color: style.color }} />
      </div>
      <div>
        <p className="text-xs font-medium text-stone-500">{title}</p>
        <p
          className={`font-bold leading-tight ${large ? 'text-2xl' : 'text-xl'}`}
          style={{ color: textColors[color] }}
        >
          {value}
        </p>
        {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
