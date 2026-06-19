import { ItemStatus, ItemPriority } from '@/lib/types';

const statusStyle: Record<ItemStatus, string> = {
  'בבעלותי': 'bg-blue-100 text-blue-700',
  'נרכש': 'bg-emerald-100 text-emerald-700',
  'חסר': 'bg-red-100 text-red-700',
  'לרכישה': 'bg-amber-100 text-amber-700',
  'אופציונלי': 'bg-stone-100 text-stone-600',
};

const priorityStyle: Record<ItemPriority, string> = {
  'גבוהה': 'bg-red-100 text-red-700',
  'בינונית': 'bg-amber-100 text-amber-700',
  'נמוכה': 'bg-stone-100 text-stone-600',
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[status]}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ItemPriority }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyle[priority]}`}>
      {priority}
    </span>
  );
}
