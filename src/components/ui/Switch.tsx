import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: ReactNode;
  disabled?: boolean;
  onLabel?: string;
  offLabel?: string;
  className?: string;
}

/** Big on/off switch. `label` sits next to it. */
export function Switch({ checked, onChange, label, description, disabled, onLabel, offLabel, className }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors disabled:opacity-50',
          checked ? 'border-primary bg-primary' : 'border-line bg-slate-200',
        )}
      >
        <span
          className={cn(
            'inline-block h-6 w-6 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-0.5',
          )}
        />
      </button>
      {(label || description || onLabel) && (
        <div className="min-w-0">
          {label && (
            <label htmlFor={id} className="cursor-pointer font-semibold">
              {label}
              {(onLabel || offLabel) && (
                <span className="ml-2 font-normal text-ink-soft">{checked ? onLabel : offLabel}</span>
              )}
            </label>
          )}
          {description && <p className="text-sm text-ink-soft">{description}</p>}
        </div>
      )}
    </div>
  );
}

interface CheckCardProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description?: string;
  icon?: string;
}

/** A big tick-box card (used for services, languages). */
export function CheckCard({ checked, onChange, title, description, icon }: CheckCardProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center gap-3 rounded-card border-2 p-3 text-left transition-colors',
        checked ? 'border-primary bg-primary-soft' : 'border-line bg-white hover:bg-slate-50',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2',
          checked ? 'border-primary bg-primary text-white' : 'border-line bg-white',
        )}
      >
        {checked && <Icon name="check" className="text-[20px]" />}
      </span>
      {icon && <Icon name={icon} className="text-primary" />}
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        {description && <span className="block truncate text-sm text-ink-soft">{description}</span>}
      </span>
    </button>
  );
}
