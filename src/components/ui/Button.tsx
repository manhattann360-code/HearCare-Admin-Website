import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'danger' | 'dangerSolid' | 'success' | 'ghost';
type Size = 'md' | 'sm';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: string;
  loading?: boolean;
  full?: boolean;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-pressed border border-transparent',
  secondary: 'bg-white text-primary border border-primary hover:bg-primary-soft',
  danger: 'bg-white text-danger border border-danger hover:bg-danger-soft',
  dangerSolid: 'bg-danger text-white border border-transparent hover:bg-red-800',
  success: 'bg-success-dark text-white border border-transparent hover:bg-emerald-800',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-slate-100',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  full,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-card font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55',
        size === 'md' ? 'min-h-[48px] px-5 text-base' : 'min-h-[40px] px-4 text-[15px]',
        variants[variant],
        full && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner className="h-5 w-5" /> : icon ? <Icon name={icon} className="text-[22px]" /> : null}
      {children}
    </button>
  );
}
