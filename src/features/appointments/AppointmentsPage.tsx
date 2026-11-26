import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '@/api/client';
import type { AdminAppointment, AppointmentStatus } from '@/api/types';
import { useAudiologists } from '@/api/hooks';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Pill } from '@/components/ui/Pill';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime, telHref } from '@/lib/utils';

const STATUS_TONE: Record<AppointmentStatus, { label: string; tone: 'success' | 'info' | 'warning' | 'neutral' }> = {
  confirmed: { label: 'Confirmed', tone: 'success' },
  completed: { label: 'Completed', tone: 'info' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  no_show: { label: 'Missed', tone: 'warning' },
};

export default function AppointmentsPage() {
  const [params, setParams] = useSearchParams();
  const date = params.get('date') ?? '';
  const status = params.get('status') ?? '';
  const audiologistId = params.get('audiologistId') ?? '';
  const [page, setPage] = useState(1);
  const [toCancel, setToCancel] = useState<AdminAppointment | null>(null);
  const [reason, setReason] = useState('');

  const toast = useToast();
  const qc = useQueryClient();
  const audiologists = useAudiologists();

  const setFilter = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };

  const list = useQuery({
    queryKey: ['appointments', { date, status, audiologistId, page }],
    queryFn: () => api.list<AdminAppointment>('/admin/appointments', { date, status, audiologistId, page }),
    placeholderData: (p) => p,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['appointments'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
  };

  const act = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: 'complete' | 'no-show' | 'cancel'; body?: object }) =>
      api.post(`/admin/appointments/${id}/${action}`, body),
    onSuccess: (_d, vars) => {
      toast.success(
        vars.action === 'cancel'
          ? 'Appointment cancelled and the patient was notified.'
          : vars.action === 'complete'
            ? 'Marked as completed.'
            : 'Marked as missed.',
      );
      setToCancel(null);
      setReason('');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const items = list.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="See upcoming and past patient visits, and update their status."
        actions={
          (date || status || audiologistId) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setParams({}, { replace: true });
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )
        }
      />

      <Card className="mb-6 grid gap-4 p-4 sm:grid-cols-3">
        <Input label="Date" type="date" value={date} onChange={(e) => setFilter('date', e.target.value)} />
        <Select label="Status" value={status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">Missed</option>
        </Select>
        <Select label="Audiologist" value={audiologistId} onChange={(e) => setFilter('audiologistId', e.target.value)}>
          <option value="">All audiologists</option>
          {audiologists.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </Card>

      {list.isLoading ? (
        <LoadingBlock label="Loading appointments…" />
      ) : list.isError ? (
        <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="event"
          title="No appointments found"
          text={date || status || audiologistId ? 'Try clearing or changing your filters.' : 'When patients book appointments in the app, they will appear here.'}
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const st = STATUS_TONE[a.status];
            return (
              <Card key={a.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={st.tone}>{st.label}</Pill>
                    <span className="font-semibold">{formatDateTime(a.startAt)}</span>
                    {a.bookedFor?.type && a.bookedFor.type !== 'self' && (
                      <Pill tone="info">
                        For {a.bookedFor.type === 'child' ? 'child' : 'someone else'}
                        {a.bookedFor.name ? `: ${a.bookedFor.name}` : ''}
                      </Pill>
                    )}
                  </div>
                  <div className="text-lg font-semibold">
                    {a.patient.name || 'Patient'}{' '}
                    {a.patient.phone && (
                      <a href={telHref(a.patient.phone)} className="ml-2 text-base font-medium text-primary hover:underline">
                        {a.patient.phone}
                      </a>
                    )}
                  </div>
                  <div className="text-sm text-ink-soft">
                    {a.audiologistName} · {a.clinicName} · {a.serviceName}
                  </div>
                  {a.note && <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-ink-soft">Note: {a.note}</div>}
                </div>

                {a.status === 'confirmed' && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      icon="check"
                      loading={act.isPending && act.variables?.id === a.id && act.variables?.action === 'complete'}
                      onClick={() => act.mutate({ id: a.id, action: 'complete' })}
                    >
                      Mark completed
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => act.mutate({ id: a.id, action: 'no-show' })}
                    >
                      Mark missed
                    </Button>
                    <Button size="sm" variant="danger" icon="cancel" onClick={() => setToCancel(a)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Pagination meta={list.data?.meta} onPage={setPage} />

      <Modal
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        title="Cancel this appointment?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToCancel(null)}>
              Keep appointment
            </Button>
            <Button
              variant="dangerSolid"
              loading={act.isPending}
              onClick={() => toCancel && act.mutate({ id: toCancel.id, action: 'cancel', body: { reason: reason.trim() || undefined } })}
            >
              Yes, cancel and notify patient
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">
            We will send an SMS to <strong>{toCancel?.patient.name || toCancel?.patient.phone}</strong> letting them know.
          </p>
          <Textarea
            label="Reason (optional)"
            rows={2}
            placeholder="e.g. Doctor away, please choose another day"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
