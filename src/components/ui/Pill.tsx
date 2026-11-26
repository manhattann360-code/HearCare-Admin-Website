import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';
import { Button } from './Button';

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const tones: Record<Tone, string> = {
  success: 'bg-success-soft text-success-dark border-success/30',
  warning: 'bg-warning-soft text-warning-dark border-warning/40',
  error: 'bg-danger-soft text-danger border-danger/30',
  info: 'bg-primary-soft text-primary-pressed border-primary/30',
  neutral: 'bg-slate-100 text-ink-soft border-line',
};

export function Pill({ tone = 'neutral', icon, children }: { tone?: Tone; icon?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1 text-sm font-semibold',
        tones[tone],
      )}
    >
      {icon && <Icon name={icon} filled className="text-[16px]" />}
      {children}
    </span>
  );
}

export function EmptyState({
  icon = 'inbox',
  title,
  text,
  actionLabel,
  onAction,
  actionIcon = 'add',
  children,
}: {
  icon?: string;
  title: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-card border-2 border-dashed border-line bg-white px-6 py-14 text-center">
      <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon name={icon} className="text-[40px]" />
      </span>
      <h2 className="text-xl">{title}</h2>
      {text && <p className="mt-2 max-w-md text-ink-soft">{text}</p>}
      {actionLabel && onAction && (
        <Button className="mt-6" icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-danger/30 bg-danger-soft/40 px-6 py-12 text-center">
      <Icon name="cloud_off" className="mb-3 text-[40px] text-danger" />
      <h2 className="text-xl">We could not load this page</h2>
      <p className="mt-2 max-w-md text-ink-soft">
        {message || 'Please check your internet connection and try again.'}
      </p>
      {onRetry && (
        <Button className="mt-5" variant="secondary" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Notice({
  tone = 'info',
  icon,
  children,
  className,
}: {
  tone?: 'info' | 'warning' | 'success' | 'error';
  icon?: string;
  children: ReactNode;
  className?: string;
}) {
  const map = {
    info: ['bg-primary-soft border-primary/30', 'info'],
    warning: ['bg-warning-soft border-warning/50', 'warning'],
    success: ['bg-success-soft border-success/40', 'check_circle'],
    error: ['bg-danger-soft border-danger/40', 'error'],
  } as const;
  return (
    <div className={cn('flex items-start gap-3 rounded-card border p-4', map[tone][0], className)}>
      <Icon name={icon ?? map[tone][1]} filled className="mt-0.5" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
