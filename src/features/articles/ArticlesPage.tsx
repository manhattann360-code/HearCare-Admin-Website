import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '@/api/client';
import type { ArticleDetail, ArticleListItem } from '@/api/types';
import { useTopics } from '@/api/hooks';
import { PageHeader, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Pill } from '@/components/ui/Pill';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { ImportPanel } from './ImportPanel';
import { articleToPayload } from './articleUtils';

export const TAGS = [
  { value: 'care-guide', label: 'Care guide' },
  { value: 'prevention', label: 'Prevention' },
  { value: 'devices', label: 'Devices' },
  { value: 'children', label: 'Children' },
  { value: 'general', label: 'General' },
] as const;

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function ArticlesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const topicId = params.get('topicId') ?? '';
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim());
  const [toDelete, setToDelete] = useState<ArticleListItem | null>(null);

  const topics = useTopics();

  const setFilter = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };

  useEffect(() => setPage(1), [q]);

  const list = useQuery({
    queryKey: ['articles', { status, topicId, q, page }],
    queryFn: () => api.list<ArticleListItem>('/admin/articles', { status, topicId, q, page }),
    placeholderData: (prev) => prev,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['articles'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
  };

  const togglePublish = useMutation({
    mutationFn: (a: ArticleListItem) => api.post(`/admin/articles/${a.id}/${a.status === 'published' ? 'unpublish' : 'publish'}`),
    onSuccess: (_d, a) => {
      toast.success(a.status === 'published' ? 'The article is now a draft and is hidden from the app.' : 'The article is now published.');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const toggleFeatured = useMutation({
    mutationFn: async (a: ArticleListItem) => {
      const detail = await api.get<ArticleDetail>(`/admin/articles/${a.id}`);
      return api.put(`/admin/articles/${a.id}`, { ...articleToPayload(detail), isFeatured: !a.isFeatured });
    },
    onSuccess: (_d, a) => {
      toast.success(a.isFeatured ? 'Removed from the Home screen.' : 'This article will be featured on the Home screen.');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (a: ArticleListItem) => api.del(`/admin/articles/${a.id}`),
    onSuccess: () => {
      toast.success('The article was deleted.');
      setToDelete(null);
      refresh();
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      setToDelete(null);
    },
  });

  const items = list.data?.data ?? [];
  const filtered = !!(status || topicId || q);

  return (
    <div>
      <PageHeader
        title="Health articles"
        subtitle="Write and publish the health articles people read in the HearCare app."
        actions={
          <Button icon="post_add" onClick={() => navigate('/articles/new')}>
            Add article
          </Button>
        }
      />

      <div className="mb-6">
        <ImportPanel
          onImported={(r) => navigate('/articles/new', { state: { imported: r } })}
          hint="Upload a Word (.docx), Markdown (.md), text or PDF file and we will fill the article for you; you can still edit it."
        />
      </div>

      <Card className="mb-6 grid gap-4 p-4 sm:grid-cols-3">
        <Input label="Search" placeholder="Type a title…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select label="Show" value={status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All articles</option>
          <option value="published">Published only</option>
          <option value="draft">Drafts only</option>
        </Select>
        <Select label="Topic" value={topicId} onChange={(e) => setFilter('topicId', e.target.value)}>
          <option value="">All topics</option>
          {topics.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name.en}
            </option>
          ))}
        </Select>
      </Card>

      {list.isLoading ? (
        <LoadingBlock label="Loading articles…" />
      ) : list.isError ? (
        <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : items.length === 0 ? (
        filtered ? (
          <EmptyState icon="search_off" title="No articles match your search" text="Try a different word, or clear the filters." />
        ) : (
          <EmptyState
            icon="article"
            title="No articles yet"
            text="Articles you write here appear in the HearCare app once you publish them."
            actionLabel="Add your first article"
            onAction={() => navigate('/articles/new')}
          />
        )
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <Link to={`/articles/${a.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                {a.heroImageUrl ? (
                  <img src={a.heroImageUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl border border-line object-cover" />
                ) : (
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon name="article" className="text-[32px]" />
                  </span>
                )}
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {a.status === 'published' ? <Pill tone="success" icon="check_circle">Published</Pill> : <Pill tone="warning" icon="edit_note">Draft</Pill>}
                    {a.hasSwahili ? <Pill tone="info">English + Kiswahili</Pill> : <Pill>English only</Pill>}
                  </div>
                  <div className="truncate text-lg font-semibold">{a.title?.en || a.title?.sw || '(No title)'}</div>
                  <div className="text-sm text-ink-soft">
                    {a.topicName} · {a.readMinutes} min read · Updated {formatDate(a.updatedAt)}
                  </div>
                </div>
              </Link>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => toggleFeatured.mutate(a)}
                  disabled={toggleFeatured.isPending}
                  aria-pressed={a.isFeatured}
                  title={a.isFeatured ? 'Featured on Home. Click to remove.' : 'Click to feature this article on Home'}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-line hover:bg-slate-50"
                >
                  <Icon name="star" filled={a.isFeatured} className={a.isFeatured ? 'text-warning' : 'text-slate-400'} />
                </button>
                <Button
                  size="sm"
                  variant={a.status === 'published' ? 'secondary' : 'success'}
                  icon={a.status === 'published' ? 'visibility_off' : 'publish'}
                  loading={togglePublish.isPending && togglePublish.variables?.id === a.id}
                  onClick={() => togglePublish.mutate(a)}
                >
                  {a.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                <Button size="sm" variant="secondary" icon="edit" onClick={() => navigate(`/articles/${a.id}`)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" icon="delete" onClick={() => setToDelete(a)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination meta={list.data?.meta} onPage={setPage} />

      <ConfirmDialog
        open={!!toDelete}
        tone="danger"
        title="Delete this article?"
        message={
          <>
            <strong>“{toDelete?.title?.en || 'This article'}”</strong> will be deleted for good and will disappear from the app. This cannot be undone.
          </>
        }
        confirmLabel="Yes, delete article"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      >
        {toDelete?.status === 'published' && (
          <p className="rounded-card bg-warning-soft p-3 text-sm">Tip: if you only want to hide it, use “Unpublish” instead.</p>
        )}
      </ConfirmDialog>
    </div>
  );
}
