import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '@/api/client';
import type { Audiologist, Gender, TimeOff, WeeklyHour } from '@/api/types';
import { useClinics, useServices } from '@/api/hooks';
import { PageHeader, Section } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { CheckCard, Switch } from '@/components/ui/Switch';
import { Tabs } from '@/components/ui/Tabs';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ConfirmDialog } from '@/components/ui/Modal';
import { ErrorState, Notice } from '@/components/ui/Pill';
import { LoadingBlock } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useUnsavedChanges } from '@/lib/useUnsavedChanges';
import { initials } from '@/lib/utils';
import { ClinicFormModal } from '@/features/clinics/ClinicFormModal';
import { summarizeHours } from './AudiologistsPage';

const WEEKDAYS = [
  { dow: 1, label: 'Monday' },
  { dow: 2, label: 'Tuesday' },
  { dow: 3, label: 'Wednesday' },
  { dow: 4, label: 'Thursday' },
  { dow: 5, label: 'Friday' },
  { dow: 6, label: 'Saturday' },
  { dow: 0, label: 'Sunday' },
];

const DEFAULT_HOURS: WeeklyHour[] = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  start: '09:00',
  end: '16:00',
}));

export default function AudiologistEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const clinics = useClinics();
  const services = useServices();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('Audiologist');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [yearsExperience, setYearsExperience] = useState(5);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [gender, setGender] = useState<Gender>('unspecified');
  const [languages, setLanguages] = useState<string[]>(['en', 'sw']);
  const [contactPhone, setContactPhone] = useState('');
  const [bio, setBio] = useState({ en: '', sw: '' });
  const [bioLang, setBioLang] = useState<'en' | 'sw'>('en');
  const [clinicId, setClinicId] = useState('');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHour[]>(DEFAULT_HOURS);
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [leadTimeHours, setLeadTimeHours] = useState(2);
  const [maxDaysAhead, setMaxDaysAhead] = useState(30);
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [verified, setVerified] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [dirty, setDirty] = useState(false);
  const [clinicModalOpen, setClinicModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; clinicId?: string; hours?: string }>({});

  const unsaved = useUnsavedChanges(dirty);

  const detail = useQuery({
    queryKey: ['audiologist', id],
    queryFn: () => api.get<Audiologist>(`/admin/audiologists/${id}`),
    enabled: !isNew,
  });

  useEffect(() => {
    if (!isNew && detail.data) {
      const d = detail.data;
      setName(d.name);
      setTitle(d.title || 'Audiologist');
      setPhotoUrl(d.photoUrl ?? null);
      setYearsExperience(d.yearsExperience ?? 0);
      setRegistrationNumber(d.registrationNumber ?? '');
      setGender(d.gender ?? 'unspecified');
      setLanguages(d.languages?.length ? d.languages : ['en', 'sw']);
      setContactPhone(d.contactPhone ?? '');
      setBio({ en: d.bio?.en ?? '', sw: d.bio?.sw ?? '' });
      setClinicId(d.clinicId);
      setServiceIds(d.serviceIds ?? []);
      setWeeklyHours(d.weeklyHours ?? []);
      setSlotMinutes(d.slotMinutes ?? 60);
      setLeadTimeHours(d.leadTimeHours ?? 2);
      setMaxDaysAhead(d.maxDaysAhead ?? 30);
      setTimeOff(d.timeOff ?? []);
      setVerified(!!d.verified);
      setIsActive(d.isActive !== false);
      setDirty(false);
    }
  }, [isNew, detail.data]);

  useEffect(() => {
    if (isNew && !clinicId && clinics.data?.length) {
      setClinicId(clinics.data[0].id);
    }
  }, [isNew, clinicId, clinics.data]);

  const markDirty = () => setDirty(true);

  const toggleDay = (dow: number, on: boolean) => {
    markDirty();
    if (on) {
      setWeeklyHours((prev) => [...prev, { dayOfWeek: dow, start: '09:00', end: '16:00' }]);
    } else {
      setWeeklyHours((prev) => prev.filter((w) => w.dayOfWeek !== dow));
    }
  };

  const copyMondayToWeekdays = () => {
    const mon = weeklyHours.filter((w) => w.dayOfWeek === 1);
    if (!mon.length) {
      toast.info('Turn on Monday first before copying.');
      return;
    }
    markDirty();
    const rest = weeklyHours.filter((w) => w.dayOfWeek < 1 || w.dayOfWeek > 5);
    const copied = [1, 2, 3, 4, 5].flatMap((dow) => mon.map((b) => ({ dayOfWeek: dow, start: b.start, end: b.end })));
    setWeeklyHours([...rest, ...copied]);
    toast.success('Copied Monday hours to Tuesday–Friday.');
  };

  const validate = () => {
    const errs: { name?: string; clinicId?: string; hours?: string } = {};
    if (!name.trim()) errs.name = 'Please enter the audiologist’s name.';
    if (!clinicId) errs.clinicId = 'Please choose a clinic.';
    if (weeklyHours.some((w) => w.start >= w.end)) {
      errs.hours = 'Every opening time must be earlier than its closing time.';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please check the highlighted fields.');
      return false;
    }
    return true;
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        title: title.trim() || 'Audiologist',
        photoUrl,
        bio,
        clinicId,
        serviceIds,
        languages: languages.length ? languages : ['en'],
        gender,
        yearsExperience: Number(yearsExperience) || 0,
        registrationNumber: registrationNumber.trim(),
        verified,
        contactPhone: contactPhone.trim(),
        slotMinutes: Number(slotMinutes),
        leadTimeHours: Number(leadTimeHours),
        maxDaysAhead: Number(maxDaysAhead),
        weeklyHours,
        timeOff: timeOff.filter((t) => t.from && t.to),
        isActive,
      };
      return isNew ? api.post<Audiologist>('/admin/audiologists', payload) : api.put<Audiologist>(`/admin/audiologists/${id}`, payload);
    },
    onSuccess: (saved) => {
      setDirty(false);
      toast.success(isNew ? 'Audiologist added.' : 'Changes saved.');
      qc.invalidateQueries({ queryKey: ['audiologists'] });
      qc.invalidateQueries({ queryKey: ['audiologist', saved.id] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      if (isNew) {
        unsaved.allowNext();
        navigate(`/audiologists/${saved.id}`, { replace: true });
      }
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => api.del(`/admin/audiologists/${id}`),
    onSuccess: () => {
      toast.success('Audiologist deleted.');
      qc.invalidateQueries({ queryKey: ['audiologists'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      unsaved.allowNext();
      navigate('/audiologists', { replace: true });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!isNew && detail.isLoading) return <LoadingBlock label="Loading audiologist…" />;
  if (!isNew && detail.isError) return <ErrorState message={errorMessage(detail.error)} onRetry={() => detail.refetch()} />;

  return (
    <div className="max-w-4xl space-y-6">
      {unsaved.dialog}

      <PageHeader
        back={
          <Link to="/audiologists" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            ← Back to audiologists
          </Link>
        }
        title={isNew ? 'Add audiologist' : name || 'Edit audiologist'}
      />

      <Section title="1. Basic details" icon="person">
        <ImageUpload
          shape="round"
          value={photoUrl}
          fallbackText={initials(name) || 'DR'}
          onChange={(u) => {
            markDirty();
            setPhotoUrl(u);
          }}
          title="Upload profile photo"
          description="Clear headshot (optional)"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            required
            placeholder="e.g. Dr. Amani Lucas"
            value={name}
            error={errors.name}
            onChange={(e) => {
              setErrors((p) => ({ ...p, name: undefined }));
              markDirty();
              setName(e.target.value);
            }}
          />
          <Input
            label="Role / title"
            placeholder="Audiologist"
            value={title}
            onChange={(e) => {
              markDirty();
              setTitle(e.target.value);
            }}
          />
          <Input
            label="Years of experience"
            type="number"
            min={0}
            max={60}
            value={yearsExperience}
            onChange={(e) => {
              markDirty();
              setYearsExperience(Number(e.target.value));
            }}
          />
          <Input
            label="Registration number"
            placeholder="e.g. TZ-AUD-0142"
            value={registrationNumber}
            onChange={(e) => {
              markDirty();
              setRegistrationNumber(e.target.value);
            }}
          />
          <Select
            label="Gender"
            value={gender}
            onChange={(e) => {
              markDirty();
              setGender(e.target.value as Gender);
            }}
          >
            <option value="unspecified">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </Select>
          <Input
            label="Notification phone (SMS alerts for new bookings)"
            placeholder="+255 7XX XXX XXX"
            value={contactPhone}
            onChange={(e) => {
              markDirty();
              setContactPhone(e.target.value);
            }}
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold">Languages spoken</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckCard
              checked={languages.includes('en')}
              onChange={(on) => {
                markDirty();
                setLanguages((l) => (on ? [...new Set([...l, 'en'])] : l.filter((x) => x !== 'en')));
              }}
              title="English"
            />
            <CheckCard
              checked={languages.includes('sw')}
              onChange={(on) => {
                markDirty();
                setLanguages((l) => (on ? [...new Set([...l, 'sw'])] : l.filter((x) => x !== 'sw')));
              }}
              title="Kiswahili"
            />
          </div>
        </div>
      </Section>

      <Section title="2. About (shown on profile)" icon="info">
        <Tabs
          tabs={[
            { id: 'en', label: 'English' },
            { id: 'sw', label: 'Kiswahili', badge: bio.sw.trim() ? 'Added' : 'Optional' },
          ]}
          value={bioLang}
          onChange={(v) => setBioLang(v as 'en' | 'sw')}
        />
        <Textarea
          label={bioLang === 'en' ? 'Short bio (English)' : 'Maelezo mafupi (Kiswahili)'}
          rows={3}
          placeholder="2–3 friendly sentences about their experience."
          value={bio[bioLang]}
          onChange={(e) => {
            markDirty();
            setBio({ ...bio, [bioLang]: e.target.value });
          }}
        />
      </Section>

      <Section title="3. Clinic and services" icon="local_hospital">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Clinic"
            required
            fieldClassName="flex-1 min-w-[240px]"
            value={clinicId}
            error={errors.clinicId}
            onChange={(e) => {
              setErrors((p) => ({ ...p, clinicId: undefined }));
              markDirty();
              setClinicId(e.target.value);
            }}
          >
            <option value="">Choose a clinic…</option>
            {clinics.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.regionName ? `(${c.regionName})` : ''}
              </option>
            ))}
          </Select>
          <Button variant="secondary" icon="add" onClick={() => setClinicModalOpen(true)}>
            Add new clinic
          </Button>
        </div>

        <div>
          <label className="mb-2 block font-semibold">Services offered</label>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.data?.map((s) => {
              const checked = serviceIds.includes(s.id);
              return (
                <CheckCard
                  key={s.id}
                  checked={checked}
                  icon={s.icon}
                  title={s.name.en}
                  description={s.description.en}
                  onChange={(on) => {
                    markDirty();
                    setServiceIds((ids) => (on ? [...ids, s.id] : ids.filter((x) => x !== s.id)));
                  }}
                />
              );
            })}
          </div>
        </div>
      </Section>

      <Section
        title="4. Weekly availability"
        icon="schedule"
        description={`Summary: ${summarizeHours(weeklyHours)}`}
      >
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" icon="content_copy" onClick={copyMondayToWeekdays}>
            Copy Monday to weekdays
          </Button>
        </div>
        {errors.hours && <Notice tone="error">{errors.hours}</Notice>}
        <div className="divide-y divide-line rounded-card border border-line bg-white">
          {WEEKDAYS.map((day) => {
            const blocks = weeklyHours
              .map((w, idx) => ({ w, idx }))
              .filter(({ w }) => w.dayOfWeek === day.dow);
            const active = blocks.length > 0;
            return (
              <div key={day.dow} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="w-44 pt-1">
                  <Switch checked={active} onChange={(on) => toggleDay(day.dow, on)} label={day.label} />
                </div>
                {active ? (
                  <div className="flex-1 space-y-2">
                    {blocks.map(({ w, idx }) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={w.start}
                          onChange={(e) => {
                            markDirty();
                            setWeeklyHours((prev) => prev.map((row, i) => (i === idx ? { ...row, start: e.target.value } : row)));
                          }}
                          className="h-11 rounded-card border border-line px-3"
                        />
                        <span className="text-ink-soft">to</span>
                        <input
                          type="time"
                          value={w.end}
                          onChange={(e) => {
                            markDirty();
                            setWeeklyHours((prev) => prev.map((row, i) => (i === idx ? { ...row, end: e.target.value } : row)));
                          }}
                          className="h-11 rounded-card border border-line px-3"
                        />
                        {blocks.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="delete"
                            aria-label="Remove time block"
                            onClick={() => {
                              markDirty();
                              setWeeklyHours((prev) => prev.filter((_, i) => i !== idx));
                            }}
                          />
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        markDirty();
                        setWeeklyHours((prev) => [...prev, { dayOfWeek: day.dow, start: '14:00', end: '17:00' }]);
                      }}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      + Add break / second block
                    </button>
                  </div>
                ) : (
                  <div className="pt-1 text-sm text-ink-soft">Closed</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 pt-2 sm:grid-cols-3">
          <Select
            label="Appointment length"
            hint="How long each booking slot lasts."
            value={slotMinutes}
            onChange={(e) => {
              markDirty();
              setSlotMinutes(Number(e.target.value));
            }}
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes (recommended)</option>
            <option value={90}>90 minutes</option>
          </Select>
          <Input
            label="Minimum notice (hours)"
            type="number"
            min={0}
            max={72}
            hint="Prevents last-minute bookings."
            value={leadTimeHours}
            onChange={(e) => {
              markDirty();
              setLeadTimeHours(Number(e.target.value));
            }}
          />
          <Input
            label="Bookable days ahead"
            type="number"
            min={1}
            max={180}
            hint="Usually 30 days."
            value={maxDaysAhead}
            onChange={(e) => {
              markDirty();
              setMaxDaysAhead(Number(e.target.value));
            }}
          />
        </div>
      </Section>

      <Section title="5. Days off (holidays or leave)" icon="event_busy">
        {timeOff.length === 0 ? (
          <p className="text-sm text-ink-soft">No days off added.</p>
        ) : (
          <div className="space-y-3">
            {timeOff.map((t, idx) => (
              <div key={idx} className="grid gap-3 rounded-card border border-line p-3 sm:grid-cols-[1fr_1fr_1.5fr_auto] sm:items-end">
                <Input
                  label="From"
                  type="date"
                  value={t.from}
                  onChange={(e) => {
                    markDirty();
                    setTimeOff((prev) => prev.map((x, i) => (i === idx ? { ...x, from: e.target.value } : x)));
                  }}
                />
                <Input
                  label="To"
                  type="date"
                  value={t.to}
                  onChange={(e) => {
                    markDirty();
                    setTimeOff((prev) => prev.map((x, i) => (i === idx ? { ...x, to: e.target.value } : x)));
                  }}
                />
                <Input
                  label="Reason (optional)"
                  placeholder="e.g. Annual leave"
                  value={t.reason}
                  onChange={(e) => {
                    markDirty();
                    setTimeOff((prev) => prev.map((x, i) => (i === idx ? { ...x, reason: e.target.value } : x)));
                  }}
                />
                <Button
                  size="sm"
                  variant="danger"
                  icon="delete"
                  onClick={() => {
                    markDirty();
                    setTimeOff((prev) => prev.filter((_, i) => i !== idx));
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="secondary"
          size="sm"
          icon="add"
          onClick={() => {
            markDirty();
            setTimeOff((prev) => [...prev, { from: '', to: '', reason: '' }]);
          }}
        >
          Add days off
        </Button>
      </Section>

      <Section title="6. Visibility in the app" icon="verified_user">
        <Switch
          checked={verified}
          onChange={(v) => {
            markDirty();
            setVerified(v);
          }}
          label="Verified audiologist"
          description="Only verified audiologists appear in the app. Please confirm their registration first."
        />
        {!verified && (
          <Notice tone="warning">
            Because “Verified” is off, patients will not see this audiologist in the app yet.
          </Notice>
        )}
        <Switch
          checked={isActive}
          onChange={(v) => {
            markDirty();
            setIsActive(v);
          }}
          label="Active (accepting bookings)"
          description="Turn off to pause bookings without deleting the profile."
        />
      </Section>

      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white p-4 shadow-lg">
        {!isNew ? (
          <Button variant="danger" size="sm" icon="delete" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        ) : (
          <span />
        )}
        <Button icon="save" loading={save.isPending} onClick={() => validate() && save.mutate()}>
          {isNew ? 'Save audiologist' : 'Save changes'}
        </Button>
      </div>

      <ClinicFormModal
        open={clinicModalOpen}
        onClose={() => setClinicModalOpen(false)}
        onSaved={(c) => {
          markDirty();
          setClinicId(c.id);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        tone="danger"
        title="Delete this audiologist?"
        message="This cannot be undone. If they have upcoming appointments, turn off Active instead."
        confirmLabel="Yes, delete"
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
