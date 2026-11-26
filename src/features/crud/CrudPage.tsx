import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '@/api/client';
import { PageHeader, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input, Textarea, Field, controlClass } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/Pill';
import { LoadingBlock } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

export type CrudFieldType = 'text' | 'number' | 'textarea' | 'bilingual' | 'bilingualTextarea' | 'icon' | 'switch';

export interface CrudField {
  name: string;
  label: string;
  type: CrudFieldType;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  /** Text for the switch row ("Yes"/"No" style description) */
  description?: string;
  default?: unknown;
}

export interface CrudConfig<T extends { id: string }> {
  /** e.g. "/admin/regions" */
  endpoint: string;
  queryKey: string;
  title: string;
  subtitle: string;
  /** singular, lower case: "region" */
  itemName: string;
  /** e.g. "Add region" */
  addLabel: string;
  emptyTitle: string;
  emptyText: string;
  emptyIcon: string;
  fields: CrudField[];
  itemTitle: (item: T) => string;
  itemSubtitle?: (item: T) => string;
  itemIcon?: (item: T) => string | undefined;
  itemBadges?: (item: T) => ReactNode;
  sortBy?: (a: T, b: T) => number;
  newDefaults?: (items: T[]) => Record<string, unknown>;
}

type Values = Record<string, any>;

function blankValues(fields: CrudField[]): Values {
  const v: Values = {};
  for (const f of fields) {
    if (f.default !== undefined) v[f.name] = f.default;
    else if (f.type === 'bilingual' || f.type === 'bilingualTextarea') v[f.name] = { en: '', sw: '' };
    else if (f.type === 'switch') v[f.name] = false;
    else if (f.type === 'number') v[f.name] = 0;
    else v[f.name] = '';
  }
  return v;
}

export function CrudPage<T extends { id: string }>({ config }: { config: CrudConfig<T> }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<{ id: string | null; values: Values } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<T | null>(null);

  const q = useQuery({
    queryKey: [config.queryKey],
    queryFn: async () => (await api.list<T>(config.endpoint, { limit: 200 })).data,
  });

  const items = useMemo(() => {
    const list = [...(q.data ?? [])];
    if (config.sortBy) list.sort(config.sortBy);
    return list;
  }, [q.data, config]);

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const body: Values = {};
      for (const f of config.fields) {
        let val = editing.values[f.name];
        if (f.type === 'number') val = Number(val) || 0;
        if (typeof val === 'string') val = val.trim();
        if (f.type === 'bilingual' || f.type === 'bilingualTextarea') val = { en: (val.en ?? '').trim(), sw: (val.sw ?? '').trim() };
        body[f.name] = val;
      }
      return editing.id ? api.put(`${config.endpoint}/${editing.id}`, body) : api.post(config.endpoint, body);
    },
    onSuccess: () => {
      toast.success(editing?.id ? 'Changes saved.' : `The ${config.itemName} was added.`);
      qc.invalidateQueries({ queryKey: [config.queryKey] });
      setEditing(null);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (item: T) => api.del(`${config.endpoint}/${item.id}`),
    onSuccess: () => {
      toast.success(`The ${config.itemName} was deleted.`);
      qc.invalidateQueries({ queryKey: [config.queryKey] });
      setToDelete(null);
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      setToDelete(null);
    },
  });

  const openNew = () => {
    setErrors({});
    setEditing({ id: null, values: { ...blankValues(config.fields), ...(config.newDefaults?.(items) ?? {}) } });
  };
  const openEdit = (item: T) => {
    setErrors({});
    const values = blankValues(config.fields);
    for (const f of config.fields) {
      const raw = (item as Values)[f.name];
      if (raw !== undefined && raw !== null) values[f.name] = f.type.startsWith('bilingual') ? { en: raw.en ?? '', sw: raw.sw ?? '' } : raw;
    }
    setEditing({ id: item.id, values });
  };

  const setValue = (name: string, v: unknown) => setEditing((e) => (e ? { ...e, values: { ...e.values, [name]: v } } : e));

  const validate = () => {
    const errs: Record<string, string> = {};
    for (const f of config.fields) {
      if (!f.required) continue;
      const v = editing!.values[f.name];
      const empty = f.type.startsWith('bilingual') ? !String(v?.en ?? '').trim() : typeof v === 'string' ? !v.trim() : v === undefined || v === null;
      if (empty) errs[f.name] = f.type.startsWith('bilingual') ? `Please type the English ${f.label.toLowerCase()}.` : `Please fill in “${f.label}”.`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const renderField = (f: CrudField) => {
    const v = editing!.values[f.name];
    const err = errors[f.name];
    switch (f.type) {
      case 'text':
        return <Input key={f.name} label={f.label} hint={f.hint} required={f.required} error={err} placeholder={f.placeholder} value={v ?? ''} onChange={(e) => setValue(f.name, e.target.value)} />;
      case 'number':
        return <Input key={f.name} label={f.label} hint={f.hint} type="number" error={err} value={v ?? 0} onChange={(e) => setValue(f.name, e.target.value)} />;
      case 'textarea':
        return <Textarea key={f.name} label={f.label} hint={f.hint} error={err} value={v ?? ''} onChange={(e) => setValue(f.name, e.target.value)} />;
      case 'bilingual':
        return (
          <div key={f.name} className="space-y-3 rounded-card bg-slate-50 p-4">
            <Input label={`${f.label} (English)`} required={f.required} hint={f.hint} error={err} value={v?.en ?? ''} onChange={(e) => setValue(f.name, { ...v, en: e.target.value })} />
            <Input label={`${f.label} (Kiswahili)`} hint="Optional. If empty, English will be shown." value={v?.sw ?? ''} onChange={(e) => setValue(f.name, { ...v, sw: e.target.value })} />
          </div>
        );
      case 'bilingualTextarea':
        return (
          <div key={f.name} className="space-y-3 rounded-card bg-slate-50 p-4">
            <Textarea label={`${f.label} (English)`} required={f.required} hint={f.hint} error={err} rows={3} value={v?.en ?? ''} onChange={(e) => setValue(f.name, { ...v, en: e.target.value })} />
            <Textarea label={`${f.label} (Kiswahili)`} rows={3} hint="Optional. If empty, English will be shown." value={v?.sw ?? ''} onChange={(e) => setValue(f.name, { ...v, sw: e.target.value })} />
          </div>
        );
      case 'icon':
        return (
          <Field
            key={f.name}
            label={f.label}
            hint={
              <>
                Type the name of a picture icon, for example <strong>hearing</strong> or <strong>child_care</strong>.{' '}
                <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
                  Browse icons
                </a>{' '}
                (click an icon and copy its name). If you see words instead of a picture, the name is not right.
              </>
            }
            error={err}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card border border-line bg-primary-soft text-primary">
                {v ? <Icon name={String(v)} className="text-[32px]" /> : <Icon name="image" className="text-[32px] opacity-40" />}
              </span>
              <input className={`${controlClass(err)} h-12`} value={v ?? ''} placeholder="e.g. hearing" onChange={(e) => setValue(f.name, e.target.value.trim().toLowerCase())} />
            </div>
          </Field>
        );
      case 'switch':
        return (
          <Switch key={f.name} checked={!!v} onChange={(x) => setValue(f.name, x)} label={f.label} description={f.description ?? f.hint} />
        );
    }
  };

  return (
    <div>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <Button icon="add" onClick={openNew}>
            {config.addLabel}
          </Button>
        }
      />

      {q.isLoading ? (
        <LoadingBlock />
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={config.emptyIcon} title={config.emptyTitle} text={config.emptyText} actionLabel={`Add your first ${config.itemName}`} onAction={openNew} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const icon = config.itemIcon?.(item);
            const sub = config.itemSubtitle?.(item);
            return (
              <Card key={item.id} className="flex flex-wrap items-center gap-4 p-4">
                {icon !== undefined && (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Icon name={icon || 'image'} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{config.itemTitle(item)}</span>
                    {config.itemBadges?.(item)}
                  </div>
                  {sub && <div className="truncate text-ink-soft">{sub}</div>}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" icon="edit" onClick={() => openEdit(item)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" icon="delete" onClick={() => setToDelete(item)}>
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${config.itemName}` : config.addLabel}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={save.isPending} icon="save" onClick={() => validate() && save.mutate()}>
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <form
            className="space-y-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (validate()) save.mutate();
            }}
          >
            {config.fields.map(renderField)}
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        tone="danger"
        title={`Delete this ${config.itemName}?`}
        message={
          <>
            <strong>{toDelete ? config.itemTitle(toDelete) : ''}</strong> will be deleted for good. This cannot be undone.
          </>
        }
        confirmLabel={`Yes, delete ${config.itemName}`}
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      />
    </div>
  );
}
