import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '@/api/client';
import type { Clinic } from '@/api/types';
import { useClinics } from '@/api/hooks';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Pill } from '@/components/ui/Pill';
import { LoadingBlock } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { ClinicFormModal } from './ClinicFormModal';

export default function ClinicsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const clinics = useClinics();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Clinic | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Clinic | null>(null);

  // Support /clinics/new link from HelpPage
  useEffect(() => {
    if (location.pathname.endsWith('/new')) {
      setEditing(null);
      setModalOpen(true);
      navigate('/clinics', { replace: true });
    }
  }, [location.pathname, navigate]);

  const remove = useMutation({
    mutationFn: (c: Clinic) => api.del(`/admin/clinics/${c.id}`),
    onSuccess: () => {
      toast.success('Clinic deleted.');
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ['clinics'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      setToDelete(null);
    },
  });

  const items = (clinics.data ?? []).filter((c) => {
    const q = search.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.regionName ?? '').toLowerCase().includes(q) || c.district.toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader
        title="Clinics"
        subtitle="Hospitals and clinics where audiologists see patients."
        actions={
          <Button
            icon="add"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Add clinic
          </Button>
        }
      />

      <Card className="mb-6 p-4">
        <Input label="Search clinics" placeholder="Type clinic name, district or region…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {clinics.isLoading ? (
        <LoadingBlock label="Loading clinics…" />
      ) : clinics.isError ? (
        <ErrorState message={errorMessage(clinics.error)} onRetry={() => clinics.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="local_hospital"
          title={search ? 'No clinics match your search' : 'No clinics yet'}
          text={search ? 'Try another search word.' : 'Add your first hospital or clinic before adding audiologists.'}
          actionLabel={search ? undefined : 'Add your first clinic'}
          onAction={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <Card key={c.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon name="local_hospital" className="text-[26px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{c.name}</h2>
                  {c.regionName && <Pill tone="info">{c.regionName}</Pill>}
                  {c.acceptsInsurance.map((ins) => (
                    <Pill key={ins}>{ins}</Pill>
                  ))}
                </div>
                <div className="text-sm text-ink-soft">
                  {[c.district, c.addressLine, c.phone].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon="edit"
                  onClick={() => {
                    setEditing(c);
                    setModalOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" variant="danger" icon="delete" onClick={() => setToDelete(c)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ClinicFormModal open={modalOpen} clinic={editing} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        open={!!toDelete}
        tone="danger"
        title="Delete this clinic?"
        message={
          <>
            <strong>“{toDelete?.name}”</strong> will be deleted permanently. This only works if no audiologists are assigned to it.
          </>
        }
        confirmLabel="Yes, delete clinic"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      />
    </div>
  );
}
