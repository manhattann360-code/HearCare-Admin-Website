import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border border-line bg-surface shadow-card', className)} {...rest} />;
}

/** A titled section card used to group form fields. */
export function Section({
  title,
  icon,
  description,
  children,
  className,
}: {
  title: string;
  icon?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('p-5 sm:p-6', className)}>
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-xl">
          {icon && <Icon name={icon} className="text-primary" />}
          {title}
        </h2>
        {description && <p className="mt-1 text-ink-soft">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </Card>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {back && <div className="mb-2">{back}</div>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-ink-soft">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
