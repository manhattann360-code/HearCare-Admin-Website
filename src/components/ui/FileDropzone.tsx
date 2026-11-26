import { useRef, useState } from 'react';
import type { DragEvent, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

interface Props {
  accept: string;
  onFile: (file: File) => void;
  loading?: boolean;
  title: string;
  description?: string;
  icon?: string;
  compact?: boolean;
  className?: string;
}

/** Drag-and-drop or click to choose a single file. */
export function FileDropzone({ accept, onFile, loading, title, description, icon = 'upload_file', compact, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (loading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title}
      onKeyDown={onKey}
      onClick={() => !loading && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer items-center gap-4 rounded-card border-2 border-dashed text-left transition-colors',
        compact ? 'p-4' : 'flex-col justify-center p-8 text-center',
        over ? 'border-primary bg-primary-soft' : 'border-line bg-white hover:bg-slate-50',
        loading && 'cursor-wait opacity-80',
        className,
      )}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        {loading ? <Spinner className="h-7 w-7" /> : <Icon name={icon} className="text-[30px]" />}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold">{loading ? 'Please wait…' : title}</span>
        {description && <span className="block text-sm text-ink-soft">{description}</span>}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) onFile(f);
        }}
      />
    </div>
  );
}
