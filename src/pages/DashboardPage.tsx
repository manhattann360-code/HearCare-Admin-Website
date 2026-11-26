import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, errorMessage } from '@/api/client';
import type { Stats } from '@/api/types';
import { PageHeader, Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/Pill';
import { LoadingBlock } from '@/components/ui/Spinner';
import { useAuth } from '@/features/auth/AuthContext';
import { todayEAT } from '@/lib/utils';

function StatCard({ icon, label, value, note, to, tone = 'blue' }: { icon: string; label: string; value: number; note?: string; to: string; tone?: 'blue' | 'green' | 'amber' }) {
  const toneCls = { blue: 'bg-primary-soft text-primary', green: 'bg-success-soft text-success-dark', amber: 'bg-warning-soft text-warning-dark' }[tone];
  return (
    <Link to={to} className="block">
      <Card className="flex h-full items-center gap-4 p-5 transition-shadow hover:shadow-md">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${toneCls}`}>
          <Icon name={icon} className="text-[30px]" />
        </span>
        <div className="min-w-0">
          <div className="text-3xl font-bold leading-none">{value}</div>
          <div className="mt-1 font-semibold">{label}</div>
          {note && <div className="text-sm text-ink-soft">{note}</div>}
        </div>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['stats'], queryFn: () => api.get<Stats>('/admin/stats') });
  const s = q.data;

  return (
    <div>
      <PageHeader title={`Hello, ${admin?.name?.split(' ')[0] ?? 'there'} 👋`} subtitle="Here is a quick look at HearCare today." />

      <section aria-label="Quick actions" className="mb-8">
        <h2 className="mb-3 text-xl">What would you like to do?</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button size="md" icon="post_add" full onClick={() => navigate('/articles/new')}>
            Add article
          </Button>
          <Button size="md" icon="person_add" full variant="secondary" onClick={() => navigate('/audiologists/new')}>
            Add audiologist
          </Button>
          <Button size="md" icon="event" full variant="secondary" onClick={() => navigate(`/appointments?date=${todayEAT()}`)}>
            See today’s appointments
          </Button>
        </div>
      </section>

      <h2 className="mb-3 text-xl">At a glance</h2>
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.isError || !s ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon="article" label="Published articles" value={s.articlesPublished} note="Visible in the app" to="/articles?status=published" tone="green" />
          <StatCard icon="edit_note" label="Draft articles" value={s.articlesDraft} note="Not visible yet" to="/articles?status=draft" tone="amber" />
          <StatCard icon="event_upcoming" label="Upcoming appointments" value={s.upcomingAppointments} to="/appointments" />
          <StatCard icon="hearing" label="Audiologists" value={s.audiologists} note={`${s.verifiedAudiologists} verified (shown in the app)`} to="/audiologists" />
          <StatCard icon="local_hospital" label="Clinics" value={s.clinics} to="/clinics" />
          <StatCard icon="groups" label="Patients" value={s.patients} note="People using the app" to="/patients" />
        </div>
      )}
    </div>
  );
}
