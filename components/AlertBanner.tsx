import { AlertTriangle, Info } from 'lucide-react';

interface Alert {
  type: 'error' | 'warning' | 'info';
  message: string;
}

export default function AlertBanner({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
            a.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            a.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          {a.type === 'info' ? <Info size={16} /> : <AlertTriangle size={16} />}
          {a.message}
        </div>
      ))}
    </div>
  );
}
