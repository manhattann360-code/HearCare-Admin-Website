import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '@/api/client';
import type { ArticleDetail, ArticlePayload, ArticleTag, ImportResult } from '@/api/types';
import { useTopics } from '@/api/hooks';
import { PageHeader, Section } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Tabs } from '@/components/ui/Tabs';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ConfirmDialog } from '@/components/ui/Modal';
import { ErrorState, Notice, Pill } from '@/components/ui/Pill';
import { LoadingBlock } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useUnsavedChanges } from '@/lib/useUnsavedChanges';
import { readingMinutes } from '@/lib/utils';
import { TAGS } from './ArticlesPage';
import { ImportPanel } from './ImportPanel';
import { ArticlePreview } from './ArticlePreview';

const emptyDraft = (topicId = ''): ArticlePayload => ({
  topicId,
  tag: 'care-guide',
  isFeatured: false,
  heroImageUrl: null,
  reviewedBy: { name: '', credential: '' },
  title: { en: '', sw: '' },
  summary: { en: '', sw: '' },
  bodyHtml: { en: '', sw: '' },
});

export default function ArticleEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const qc = useQueryClient();
  const topics = useTopics();

  const [form, setForm] = useState<ArticlePayload>(() => emptyDraft());
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const [dirty, setDirty] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ topicId?: string; title?: string; body?: string }>({});

  const unsaved = useUnsavedChanges(dirty);

  const detail = useQuery({
    queryKey: ['article', id],
    queryFn: () => api.get<ArticleDetail>(`/admin/articles/${id}`),
    enabled: !isNew,
  });

  // Load existing article
  useEffect(() => {
    if (!isNew && detail.data) {
      const d = detail.data;
      setStatus(d.status);
      setForm({
        topicId: d.topicId,
        tag: d.tag,
        isFeatured: d.isFeatured,
        heroImageUrl: d.heroImageUrl ?? null,
        reviewedBy: d.reviewedBy ? { name: d.reviewedBy.name ?? '', credential: d.reviewedBy.credential ?? '' } : { name: '', credential: '' },
        title: { en: d.title?.en ?? '', sw: d.title?.sw ?? '' },
        summary: { en: d.summary?.en ?? '', sw: d.summary?.sw ?? '' },
        bodyHtml: { en: d.bodyHtml?.en ?? '', sw: d.bodyHtml?.sw ?? '' },
      });
      setDirty(false);
    }
  }, [isNew, detail.data]);

  // Default topic for new articles
  useEffect(() => {
    if (isNew && !form.topicId && topics.data?.length) {
      setForm((f) => ({ ...f, topicId: topics.data![0].id }));
    }
  }, [isNew, form.topicId, topics.data]);

  // Handle document dropped on ArticlesPage -> navigated to /articles/new
  useEffect(() => {
    const imp = (location.state as { imported?: ImportResult } | null)?.imported;
    if (isNew && imp) {
      applyImport(imp, 'en');
      navigate('.', { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  const applyImport = (r: ImportResult, targetLang: 'en' | 'sw') => {
    setForm((f) => ({
      ...f,
      title: { ...f.title, [targetLang]: r.title || f.title[targetLang] },
      bodyHtml: { ...f.bodyHtml, [targetLang]: r.html || f.bodyHtml[targetLang] },
    }));
    setWarnings(r.warnings ?? []);
    setDirty(true);
    toast.success(`Imported document into the ${targetLang === 'en' ? 'English' : 'Kiswahili'} tab. Review and edit below.`);
  };

  const update = (patch: Partial<ArticlePayload>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  const validate = (forPublish: boolean) => {
    const errs: { topicId?: string; title?: string; body?: string } = {};
    if (!form.topicId) errs.topicId = 'Please choose a topic.';
    if (!form.title.en.trim() && !form.title.sw.trim()) {
      errs.title = 'Please enter a title.';
    }
    if (forPublish) {
      if (!form.title.en.trim()) errs.title = 'Please enter an English title before publishing.';
      if (!form.bodyHtml.en.replace(/<[^>]*>/g, '').trim()) {
        errs.body = 'Please write some English article text before publishing.';
      }
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.title || errs.body) setLang('en');
      toast.error('Please fix the highlighted fields before saving.');
      return false;
    }
    return true;
  };

  const save = useMutation({
    mutationFn: async (action: 'draft' | 'publish' | 'unpublish') => {
      const payload: ArticlePayload = {
        ...form,
        reviewedBy: form.reviewedBy?.name?.trim() ? form.reviewedBy : null,
      };
      const saved = isNew
        ? await api.post<ArticleDetail>('/admin/articles', payload)
        : await api.put<ArticleDetail>(`/admin/articles/${id}`, payload);

      if (action === 'publish') {
        return api.post<ArticleDetail>(`/admin/articles/${saved.id}/publish`);
      }
      if (action === 'unpublish') {
        return api.post<ArticleDetail>(`/admin/articles/${saved.id}/unpublish`);
      }
      return saved;
    },
    onSuccess: (saved, action) => {
      setStatus(saved.status);
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['articles'] });
      qc.invalidateQueries({ queryKey: ['article', saved.id] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      if (action === 'publish') toast.success('Article published! People can now read it in the app.');
      else if (action === 'unpublish') toast.success('Article moved back to draft.');
      else toast.success('Draft saved.');

      if (isNew) {
        unsaved.allowNext();
        navigate(`/articles/${saved.id}`, { replace: true });
      }
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => api.del(`/admin/articles/${id}`),
    onSuccess: () => {
      toast.success('The article was deleted.');
      qc.invalidateQueries({ queryKey: ['articles'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      unsaved.allowNext();
      navigate('/articles', { replace: true });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!isNew && detail.isLoading) return <LoadingBlock label="Loading article…" />;
  if (!isNew && detail.isError) return <ErrorState message={errorMessage(detail.error)} onRetry={() => detail.refetch()} />;

  const activeTitle = form.title[lang];
  const activeSummary = form.summary[lang];
  const activeBody = form.bodyHtml[lang];
  const mins = readingMinutes(activeBody);
  const selectedTopicName = topics.data?.find((t) => t.id === form.topicId)?.name.en;

  return (
    <div className="max-w-4xl space-y-6">
      {unsaved.dialog}

      <PageHeader
        back={
          <Link to="/articles" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            ← Back to articles
          </Link>
        }
        title={isNew ? 'Add article' : form.title.en || 'Edit article'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {status === 'published' ? (
              <Pill tone="success" icon="check_circle">Published</Pill>
            ) : (
              <Pill tone="warning" icon="edit_note">Draft</Pill>
            )}
            <Button variant="secondary" size="sm" icon="smartphone" onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
          </div>
        }
      />

      <ImportPanel
        onImported={(r) => applyImport(r, lang)}
        hint={`Upload a Word (.docx), Markdown (.md), text or PDF file to fill the ${lang === 'en' ? 'English' : 'Kiswahili'} tab. You can still edit everything after.`}
      />

      {warnings.length > 0 && (
        <Notice tone="warning" icon="warning">
          <div className="font-semibold">Please check after importing:</div>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Notice>
      )}

      <Section title="1. Topic and details" icon="category">
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Topic"
            required
            value={form.topicId}
            error={fieldErrors.topicId}
            onChange={(e) => {
              setFieldErrors((p) => ({ ...p, topicId: undefined }));
              update({ topicId: e.target.value });
            }}
          >
            <option value="">Choose a topic…</option>
            {topics.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name.en}
              </option>
            ))}
          </Select>

          <Select
            label="Category tag"
            value={form.tag}
            onChange={(e) => update({ tag: e.target.value as ArticleTag })}
          >
            {TAGS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <Switch
          checked={form.isFeatured}
          onChange={(v) => update({ isFeatured: v })}
          label="Feature this article on the Home screen"
          description="Featured articles are shown right on the patient's Home screen."
        />

        <div>
          <label className="mb-2 block font-semibold">Cover picture (optional)</label>
          <ImageUpload
            value={form.heroImageUrl}
            onChange={(url) => update({ heroImageUrl: url })}
            title="Upload a cover picture"
            description="Drag a picture here, or click to choose one (JPG, PNG, WEBP; up to 8 MB)"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Medically reviewed by (name)"
            placeholder="e.g. Dr. Samuel Kimani"
            value={form.reviewedBy?.name ?? ''}
            onChange={(e) => update({ reviewedBy: { name: e.target.value, credential: form.reviewedBy?.credential ?? '' } })}
          />
          <Input
            label="Title or qualification"
            placeholder="e.g. Clinical Audiologist"
            value={form.reviewedBy?.credential ?? ''}
            onChange={(e) => update({ reviewedBy: { name: form.reviewedBy?.name ?? '', credential: e.target.value } })}
          />
        </div>
      </Section>

      <Section
        title="2. Article content"
        icon="edit_document"
        description="Write in English first. You can also add a Kiswahili translation."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={[
              { id: 'en', label: 'English' },
              { id: 'sw', label: 'Kiswahili', badge: form.title.sw.trim() ? 'Added' : 'Optional' },
            ]}
            value={lang}
            onChange={(id) => setLang(id as 'en' | 'sw')}
          />
          <span className="text-sm font-medium text-ink-soft">
            Estimated reading time: <strong>{mins || 1} min</strong>
          </span>
        </div>

        {lang === 'sw' && (
          <Notice tone="info">
            Optional. If the Kiswahili title or text is left empty, patients using Kiswahili will see the English version instead.
          </Notice>
        )}

        <Input
          label={lang === 'en' ? 'Article title (English)' : 'Kichwa cha makala (Kiswahili)'}
          required={lang === 'en'}
          placeholder={lang === 'en' ? 'e.g. Safe headphone volume guidelines' : 'mf. Mwongozo salama wa sauti ya vipokea sauti'}
          value={activeTitle}
          error={lang === 'en' ? fieldErrors.title : undefined}
          onChange={(e) => {
            if (lang === 'en') setFieldErrors((p) => ({ ...p, title: undefined }));
            update({ title: { ...form.title, [lang]: e.target.value } });
          }}
        />

        <Textarea
          label={lang === 'en' ? 'Short summary' : 'Muhtasari mfupi'}
          rows={2}
          maxLength={160}
          placeholder="One or two sentences shown in the article list."
          hint={`${activeSummary.length} / 160 characters`}
          value={activeSummary}
          onChange={(e) => update({ summary: { ...form.summary, [lang]: e.target.value } })}
        />

        <div>
          <label className="mb-2 block font-semibold">
            {lang === 'en' ? 'Article text (English)' : 'Maudhui ya makala (Kiswahili)'}
            {lang === 'en' && <span className="text-danger"> *</span>}
          </label>
          <RichTextEditor
            value={activeBody}
            error={lang === 'en' ? fieldErrors.body : undefined}
            placeholder={lang === 'en' ? 'Write your article here, or import a document above…' : 'Andika makala kwa Kiswahili hapa…'}
            onChange={(html) => {
              if (lang === 'en') setFieldErrors((p) => ({ ...p, body: undefined }));
              update({ bodyHtml: { ...form.bodyHtml, [lang]: html } });
            }}
          />
        </div>
      </Section>

      {/* Bottom Save Bar */}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white p-4 shadow-lg">
        <div className="flex flex-wrap gap-2">
          {!isNew && (
            <Button variant="danger" size="sm" icon="delete" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          )}
          <Button variant="secondary" size="sm" icon="smartphone" onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {status === 'published' && (
            <Button
              variant="secondary"
              icon="visibility_off"
              loading={save.isPending && save.variables === 'unpublish'}
              onClick={() => validate(false) && save.mutate('unpublish')}
            >
              Unpublish
            </Button>
          )}
          <Button
            variant="secondary"
            icon="save"
            loading={save.isPending && save.variables === 'draft'}
            onClick={() => validate(status === 'published') && save.mutate('draft')}
          >
            {status === 'published' ? 'Save changes' : 'Save as draft'}
          </Button>
          {status !== 'published' && (
            <Button
              variant="success"
              icon="publish"
              loading={save.isPending && save.variables === 'publish'}
              onClick={() => validate(true) && save.mutate('publish')}
            >
              Publish
            </Button>
          )}
        </div>
      </div>

      <ArticlePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={activeTitle}
        summary={activeSummary}
        html={activeBody}
        cover={form.heroImageUrl}
        topic={selectedTopicName}
        readMinutes={mins || 1}
        reviewedBy={form.reviewedBy}
        language={lang === 'en' ? 'English' : 'Kiswahili'}
      />

      <ConfirmDialog
        open={confirmDelete}
        tone="danger"
        title="Delete this article?"
        message="This article will be deleted permanently and removed from the app. This cannot be undone."
        confirmLabel="Yes, delete article"
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
