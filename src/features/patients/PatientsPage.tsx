import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, errorMessage } from '@/api/client';
import type { Patient } from '@/api/types';
import { Card, PageHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { EmptyState, ErrorState } from '@/components/ui/Pill';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate, telHref } from '@/lib/utils';

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const list = useQuery({
    queryKey: ['patients', { q: debounced, page }],
    queryFn: () => api.list<Patient>('/admin/patients', { q: debounced, page }),
    placeholderData: (p) => p,
  });

  const items = list.data?.data ?? [];

  return (
    <div>
      <PageHeader title="Patients" subtitle="People who have signed in to HearCare to book appointments." />

      <Card className="mb-6 p-4">
        <Input label="Search patients" placeholder="Type a name or phone number…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {list.isLoading ? (
        <LoadingBlock label="Loading patients…" />
      ) : list.isError ? (
        <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="groups"
          title={debounced ? 'No patients match your search' : 'No patients yet'}
          text={debounced ? 'Try a different name or phone number.' : 'Patients appear here once they sign in to book a visit.'}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-line bg-slate-50 text-sm text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Region</th>
                <th className="px-4 py-3 font-semibold">Appointments</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-semibold">{p.name || '—'}</td>
                  <td className="px-4 py-3">
                    <a href={telHref(p.phone)} className="text-primary hover:underline">
                      {p.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{p.regionName || '—'}</td>
                  <td className="px-4 py-3">{p.appointmentCount}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Pagination meta={list.data?.meta} onPage={setPage} />
    </div>
  );
}
