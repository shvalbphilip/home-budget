import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'amber' | 'green' | 'red' | 'blue' | 'purple' | 'stone';
  large?: boolean;
}

const colors = {
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  stone: 'bg-stone-50 border-stone-200 text-stone-700',
};

const iconBgs = {
  amber: 'bg-amber-100',
  green: 'bg-emerald-100',
  red: 'bg-red-100',
  blue: 'bg-blue-100',
  purple: 'bg-purple-100',
  stone: 'bg-stone-100',
};

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'stone', large }: Props) {
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${colors[color]}`}>
      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconBgs[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-medium opacity-70">{title}</p>
        <p className={`font-bold leading-tight ${large ? 'text-2xl' : 'text-xl'}`}>{value}</p>
        {subtitle && <p className="text-xs opacity-60 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
