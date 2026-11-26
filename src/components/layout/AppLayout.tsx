import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/features/auth/AuthContext';
import { ConfirmDialog } from '@/components/ui/Modal';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}
const groups: { title?: string; items: NavItem[] }[] = [
  { items: [{ to: '/', label: 'Home', icon: 'home', end: true }] },
  {
    title: 'Content',
    items: [
      { to: '/articles', label: 'Health articles', icon: 'article' },
      { to: '/topics', label: 'Article topics', icon: 'sell' },
    ],
  },
  {
    title: 'Care providers',
    items: [
      { to: '/audiologists', label: 'Audiologists', icon: 'hearing' },
      { to: '/clinics', label: 'Clinics', icon: 'local_hospital' },
      { to: '/services', label: 'Services offered', icon: 'medical_services' },
      { to: '/regions', label: 'Regions', icon: 'location_on' },
    ],
  },
  {
    title: 'People',
    items: [
      { to: '/appointments', label: 'Appointments', icon: 'event' },
      { to: '/patients', label: 'Patients', icon: 'groups' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { to: '/team', label: 'Team (admins)', icon: 'admin_panel_settings' },
      { to: '/account', label: 'My account', icon: 'person' },
      { to: '/help', label: 'Help', icon: 'help' },
    ],
  },
];

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const sidebar = (
    <nav className="flex h-full flex-col bg-white" aria-label="Main menu">
      <div className="flex items-center gap-3 px-5 py-5">
        <Logo size={40} />
        <div className="leading-tight">
          <div className="text-xl font-bold">HearCare</div>
          <div className="text-sm text-ink-soft">Admin</div>
        </div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((g, i) => (
          <div key={i}>
            {g.title && <div className="mb-1 px-3 text-xs font-bold uppercase tracking-wide text-ink-soft">{g.title}</div>}
            <ul className="space-y-1">
              {g.items.map((it) => (
                <li key={it.to}>
                  <NavLink
                    to={it.to}
                    end={it.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-[48px] items-center gap-3 rounded-card px-3 font-semibold transition-colors',
                        isActive ? 'bg-primary text-white' : 'text-ink hover:bg-slate-100',
                      )
                    }
                  >
                    <Icon name={it.icon} />
                    {it.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line p-3">
        <div className="mb-2 flex items-center gap-3 px-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
            {(admin?.name || admin?.email || '?').slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate font-semibold">{admin?.name}</div>
            <div className="truncate text-sm text-ink-soft">{admin?.email}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOut(true)}
          className="flex min-h-[48px] w-full items-center gap-3 rounded-card px-3 font-semibold text-danger hover:bg-danger-soft/50"
        >
          <Icon name="logout" />
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-72">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-line lg:block">{sidebar}</aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white px-4 py-2 lg:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-card hover:bg-slate-100"
        >
          <Icon name="menu" className="text-[28px]" />
        </button>
        <Logo size={32} />
        <span className="text-lg font-bold">HearCare Admin</span>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
            >
              <Icon name="close" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>

      <ConfirmDialog
        open={confirmOut}
        title="Sign out?"
        message="You will need to enter your email and password to come back."
        confirmLabel="Yes, sign out"
        onCancel={() => setConfirmOut(false)}
        onConfirm={() => {
          setConfirmOut(false);
          logout();
          navigate('/login', { replace: true });
        }}
      />
    </div>
  );
}
