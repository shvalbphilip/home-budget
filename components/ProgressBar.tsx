interface Props {
  value: number; // 0-100
  color?: 'amber' | 'green' | 'red' | 'blue';
  showLabel?: boolean;
  height?: 'sm' | 'md';
}

const track = { amber: 'bg-amber-500', green: 'bg-emerald-500', red: 'bg-red-500', blue: 'bg-blue-500' };

export default function ProgressBar({ value, color = 'amber', showLabel, height = 'md' }: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  const c = value > 100 ? 'red' : color;
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-stone-200 rounded-full overflow-hidden ${height === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${track[c]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-semibold text-stone-600 w-9 text-right">{value}%</span>}
    </div>
  );
}
