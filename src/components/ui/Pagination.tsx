import { Button } from './Button';
import type { ListMeta } from '@/api/client';

export function Pagination({ meta, onPage }: { meta?: ListMeta; onPage: (p: number) => void }) {
  if (!meta) return null;
  const pages = Math.max(1, Math.ceil(meta.total / Math.max(1, meta.limit)));
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <Button variant="secondary" size="sm" icon="chevron_left" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        Previous
      </Button>
      <span className="text-ink-soft">
        Page {meta.page} of {pages}
      </span>
      <Button variant="secondary" size="sm" disabled={meta.page >= pages} onClick={() => onPage(meta.page + 1)}>
        Next
      </Button>
    </div>
  );
}
