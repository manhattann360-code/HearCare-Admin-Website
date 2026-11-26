import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, errorMessage } from '@/api/client';
import type { Admin } from '@/api/types';
import { PageHeader, Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Pill } from '@/components/ui/Pill';
import { LoadingBlock } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthContext';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  name: z.string().trim().min(2, 'Please type the person’s name.'),
  email: z.string().trim().min(1, 'Please type their email address.').email('That does not look like an email address.'),
  password: z.string().min(8, 'The password must have at least 8 characters.'),
});
type Values = z.infer<typeof schema>;

export default function TeamPage() {
  const { admin: me } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [toRemove, setToRemove] = useState<Admin | null>(null);

  const q = useQuery({ queryKey: ['admins'], queryFn: async () => (await api.list<Admin>('/admin/admins')).data });

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '' } });

  const add = useMutation({
    mutationFn: (v: Values) => api.post('/admin/admins', v),
    onSuccess: () => {
      toast.success('New team member added. Share their password with them safely.');
      qc.invalidateQueries({ queryKey: ['admins'] });
      setAdding(false);
      form.reset();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (a: Admin) => api.del(`/admin/admins/${a.id}`),
    onSuccess: () => {
      toast.success('Team member removed.');
      qc.invalidateQueries({ queryKey: ['admins'] });
      setToRemove(null);
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      setToRemove(null);
    },
  });

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="People who can sign in to this admin website."
        actions={
          <Button icon="person_add" onClick={() => setAdding(true)}>
            Add team member
          </Button>
        }
      />
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data!.length === 0 ? (
        <EmptyState icon="admin_panel_settings" title="No team members yet" actionLabel="Add your first team member" onAction={() => setAdding(true)} />
      ) : (
        <div className="space-y-3">
          {q.data!.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center gap-4 p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">
                {a.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{a.name}</span>
                  {a.id === me?.id && <Pill tone="info">You</Pill>}
                </div>
                <div className="truncate text-ink-soft">{a.email}</div>
                {a.createdAt && <div className="text-sm text-ink-soft">Added {formatDate(a.createdAt)}</div>}
              </div>
              {a.id !== me?.id && (
                <Button variant="danger" size="sm" icon="person_remove" onClick={() => setToRemove(a)}>
                  Remove
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a team member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button loading={add.isPending} onClick={form.handleSubmit((v) => add.mutate(v))}>
              Add team member
            </Button>
          </>
        }
      >
        <form
          className="space-y-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit((v) => add.mutate(v))();
          }}
        >
          <Input label="Full name" error={form.formState.errors.name?.message} {...form.register('name')} />
          <Input label="Email address" type="email" hint="They will use this to sign in." error={form.formState.errors.email?.message} {...form.register('email')} />
          <Input
            label="Starting password"
            type="text"
            hint="At least 8 characters. Tell them to change it after signing in (My account → Change my password)."
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toRemove}
        tone="danger"
        title="Remove this team member?"
        message={`${toRemove?.name ?? 'This person'} will no longer be able to sign in to the admin website.`}
        confirmLabel="Yes, remove"
        loading={remove.isPending}
        onCancel={() => setToRemove(null)}
        onConfirm={() => toRemove && remove.mutate(toRemove)}
      />
    </div>
  );
}
