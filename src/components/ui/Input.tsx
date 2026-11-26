import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

interface FieldProps {
  label?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, htmlFor, children, className }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block font-semibold">
          {label}
          {required && <span className="text-danger" aria-hidden> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 flex items-start gap-1 text-sm font-medium text-danger">
          <Icon name="error" className="text-[18px]" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

const controlBase =
  'block w-full rounded-card border bg-white px-4 text-base text-ink placeholder:text-slate-400 transition-colors focus:border-primary disabled:bg-slate-100 disabled:text-ink-soft';

export const controlClass = (error?: string) =>
  cn(controlBase, error ? 'border-danger' : 'border-line');

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: ReactNode;
  error?: string;
  fieldClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, className, fieldClassName, id, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={fieldClassName}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={cn(controlClass(error), 'h-12', className)}
        {...rest}
      />
    </Field>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: ReactNode;
  error?: string;
  fieldClassName?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, fieldClassName, id, rows = 4, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={fieldClassName}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={!!error}
        className={cn(controlClass(error), 'py-3', className)}
        {...rest}
      />
    </Field>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: ReactNode;
  error?: string;
  fieldClassName?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, className, fieldClassName, id, children, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={fieldClassName}>
      <select
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={cn(controlClass(error), 'h-12 cursor-pointer', className)}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
});
