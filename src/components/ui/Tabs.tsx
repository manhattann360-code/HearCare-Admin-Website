import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  badge?: string;
}

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn('inline-flex rounded-card bg-slate-100 p-1', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex min-h-[44px] items-center gap-2 rounded-xl px-5 font-semibold transition-colors',
            value === t.id ? 'bg-white text-primary shadow-card' : 'text-ink-soft hover:text-ink',
          )}
        >
          {t.label}
          {t.badge && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-ink-soft">{t.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
