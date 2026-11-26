import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '@/api/client';
import type { Audiologist, WeeklyHour } from '@/api/types';
import { useAudiologists, useRegions } from '@/api/hooks';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Pill } from '@/components/ui/Pill';
import { LoadingBlock } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { initials } from '@/lib/utils';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function summarizeHours(hours: WeeklyHour[]): string {
  if (!hours?.length) return 'No weekly hours set';
  const sorted = [...hours].sort((a, b) => (a.dayOfWeek || 7) - (b.dayOfWeek || 7));
  const first = sorted[0];
  const sameRange = sorted.every((h) => h.start === first.start && h.end === first.end);
  const days = sorted.map((h) => DAYS_SHORT[h.dayOfWeek]).filter((v, i, arr) => arr.indexOf(v) === i);
  if (sameRange && days.length > 1) {
    return `${days[0]}–${days[days.length - 1]} ${first.start}–${first.end}`;
  }
  return `${days.join(', ')} (${first.start}–${first.end})`;
}

export default function AudiologistsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const list = useAudiologists();
  const regions = useRegions();
  const [search, setSearch] = useState('');
  const [regionName, setRegionName] = useState('');
  const [toDelete, setToDelete] = useState<Audiologist | null>(null);

  const toggleActive = useMutation({
    mutationFn: (a: Audiologist) =>
      api.put(`/admin/audiologists/${a.id}`, {
        name: a.name,
        title: a.title,
        photoUrl: a.photoUrl,
        bio: a.bio,
        clinicId: a.clinicId,
        serviceIds: a.serviceIds,
        languages: a.languages,
        gender: a.gender,
        yearsExperience: a.yearsExperience,
        registrationNumber: a.registrationNumber,
        verified: a.verified,
        contactPhone: a.contactPhone,
        slotMinutes: a.slotMinutes,
        leadTimeHours: a.leadTimeHours,
        maxDaysAhead: a.maxDaysAhead,
        weeklyHours: a.weeklyHours,
        timeOff: a.timeOff,
        isActive: !a.isActive,
      }),
    onSuccess: (_d, a) => {
      toast.success(a.isActive ? `${a.name} is now hidden from the app.` : `${a.name} is now active.`);
      qc.invalidateQueries({ queryKey: ['audiologists'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (a: Audiologist) => api.del(`/admin/audiologists/${a.id}`),
    onSuccess: () => {
      toast.success('Audiologist removed.');
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ['audiologists'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      setToDelete(null);
    },
  });

  const items = (list.data ?? []).filter((a) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || (a.clinicName ?? '').toLowerCase().includes(q);
    const matchRegion = !regionName || a.regionName === regionName;
    return matchSearch && matchRegion;
  });

  return (
    <div>
      <PageHeader
        title="Audiologists"
        subtitle="Specialists who appear in “Find an Audiologist” and accept bookings."
        actions={
          <Button icon="person_add" onClick={() => navigate('/audiologists/new')}>
            Add audiologist
          </Button>
        }
      />

      <Card className="mb-6 grid gap-4 p-4 sm:grid-cols-2">
        <Input label="Search" placeholder="Type a name or clinic…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select label="Region" value={regionName} onChange={(e) => setRegionName(e.target.value)}>
          <option value="">All regions</option>
          {regions.data?.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </Select>
      </Card>

      {list.isLoading ? (
        <LoadingBlock label="Loading audiologists…" />
      ) : list.isError ? (
        <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="hearing"
          title={search || regionName ? 'No audiologists match' : 'No audiologists yet'}
          text={
            search || regionName
              ? 'Try another search word or clear the region filter.'
              : 'Add your first verified audiologist so patients can book appointments.'
          }
          actionLabel={search || regionName ? undefined : 'Add your first audiologist'}
          onAction={() => navigate('/audiologists/new')}
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <Link to={`/audiologists/${a.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                {a.photoUrl ? (
                  <img src={a.photoUrl} alt={a.name} className="h-16 w-16 shrink-0 rounded-full border border-line object-cover" />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">
                    {initials(a.name)}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{a.name}</span>
                    {a.verified ? (
                      <Pill tone="success" icon="verified">Verified</Pill>
                    ) : (
                      <Pill tone="warning">Not verified</Pill>
                    )}
                    {!a.isActive && <Pill tone="neutral">Hidden</Pill>}
                  </div>
                  <div className="text-sm text-ink-soft">
                    {[a.clinicName, a.regionName].filter(Boolean).join(' · ')}
                  </div>
                  <div className="text-sm text-ink-soft">{summarizeHours(a.weeklyHours)}</div>
                </div>
              </Link>

              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <Switch
                  checked={a.isActive}
                  onChange={() => toggleActive.mutate(a)}
                  disabled={toggleActive.isPending}
                  onLabel="Active"
                  offLabel="Hidden"
                  label=""
                />
                <Button size="sm" variant="secondary" icon="edit" onClick={() => navigate(`/audiologists/${a.id}`)}>
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

      <ConfirmDialog
        open={!!toDelete}
        tone="danger"
        title="Delete this audiologist?"
        message={
          <>
            <strong>{toDelete?.name}</strong> will be deleted. If they have upcoming appointments, switch them to Hidden instead.
          </>
        }
        confirmLabel="Yes, delete"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      />
    </div>
  );
}
