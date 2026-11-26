import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '@/api/client';
import type { Clinic, OpeningHour } from '@/api/types';
import { useRegions } from '@/api/hooks';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { useToast } from '@/components/ui/Toast';

interface Props {
  open: boolean;
  clinic?: Clinic | null;
  onClose: () => void;
  onSaved?: (clinic: Clinic) => void;
}

const emptyClinic = (regionId = '') => ({
  name: '',
  regionId,
  district: '',
  addressLine: '',
  phone: '',
  whatsapp: '',
  acceptsInsurance: ['NHIF', 'Cash'],
  paymentNote: 'NHIF and Cash accepted',
  lat: '',
  lng: '',
  openingHours: [{ label: 'Mon – Fri', hours: '08:00 AM – 04:30 PM' }] as OpeningHour[],
});

export function ClinicFormModal({ open, clinic, onClose, onSaved }: Props) {
  const toast = useToast();
  const qc = useQueryClient();
  const regions = useRegions();
  const [form, setForm] = useState(() => emptyClinic());
  const [errors, setErrors] = useState<{ name?: string; regionId?: string }>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (clinic) {
      setForm({
        name: clinic.name,
        regionId: clinic.regionId,
        district: clinic.district ?? '',
        addressLine: clinic.addressLine ?? '',
        phone: clinic.phone ?? '',
        whatsapp: clinic.whatsapp ?? '',
        acceptsInsurance: clinic.acceptsInsurance ?? [],
        paymentNote: clinic.paymentNote ?? '',
        lat: clinic.lat != null ? String(clinic.lat) : '',
        lng: clinic.lng != null ? String(clinic.lng) : '',
        openingHours: clinic.openingHours?.length ? clinic.openingHours : [{ label: 'Mon – Fri', hours: '08:00 AM – 04:30 PM' }],
      });
    } else {
      setForm(emptyClinic(regions.data?.[0]?.id ?? ''));
    }
  }, [open, clinic, regions.data]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        regionId: form.regionId,
        district: form.district.trim(),
        addressLine: form.addressLine.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        acceptsInsurance: form.acceptsInsurance,
        paymentNote: form.paymentNote.trim(),
        lat: form.lat.trim() ? Number(form.lat) : null,
        lng: form.lng.trim() ? Number(form.lng) : null,
        openingHours: form.openingHours.filter((h) => h.label.trim() || h.hours.trim()),
      };
      return clinic ? api.put<Clinic>(`/admin/clinics/${clinic.id}`, payload) : api.post<Clinic>('/admin/clinics', payload);
    },
    onSuccess: (saved) => {
      toast.success(clinic ? 'Clinic updated.' : 'Clinic added.');
      qc.invalidateQueries({ queryKey: ['clinics'] });
      qc.invalidateQueries({ queryKey: ['audiologists'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      onSaved?.(saved);
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const submit = () => {
    const errs: { name?: string; regionId?: string } = {};
    if (!form.name.trim()) errs.name = 'Please enter the clinic name.';
    if (!form.regionId) errs.regionId = 'Please choose a region.';
    setErrors(errs);
    if (Object.keys(errs).length === 0) save.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={clinic ? `Edit ${clinic.name}` : 'Add clinic'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            {clinic ? 'Save changes' : 'Add clinic'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Clinic or hospital name"
            required
            placeholder="e.g. CCBRT Hospital"
            value={form.name}
            error={errors.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Region"
            required
            value={form.regionId}
            error={errors.regionId}
            onChange={(e) => setForm({ ...form, regionId: e.target.value })}
          >
            <option value="">Choose a region…</option>
            {regions.data?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="District / area"
            placeholder="e.g. Kinondoni"
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
          />
          <Input
            label="Street address"
            placeholder="e.g. Msasani Peninsula, Off Haile Selassie Rd"
            value={form.addressLine}
            onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone number"
            placeholder="+255 22 ..."
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="WhatsApp number"
            placeholder="+255 7..."
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />
        </div>

        <TagInput
          label="Insurance & payment accepted"
          hint="Patients can filter audiologists by NHIF."
          value={form.acceptsInsurance}
          onChange={(v) => setForm({ ...form, acceptsInsurance: v })}
          suggestions={['NHIF', 'Cash', 'AAR', 'Jubilee', 'Strategis']}
          placeholder="Type and press Add"
        />

        <Input
          label="Payment note (shown on profile)"
          placeholder="e.g. NHIF and Cash accepted at reception"
          value={form.paymentNote}
          onChange={(e) => setForm({ ...form, paymentNote: e.target.value })}
        />

        <div>
          <label className="mb-2 block font-semibold">Opening hours</label>
          <div className="space-y-2">
            {form.openingHours.map((h, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  placeholder="Days (e.g. Mon – Fri)"
                  value={h.label}
                  onChange={(e) => {
                    const next = [...form.openingHours];
                    next[i] = { ...h, label: e.target.value };
                    setForm({ ...form, openingHours: next });
                  }}
                />
                <Input
                  placeholder="Hours (e.g. 08:00 AM – 04:30 PM)"
                  value={h.hours}
                  onChange={(e) => {
                    const next = [...form.openingHours];
                    next[i] = { ...h, hours: e.target.value };
                    setForm({ ...form, openingHours: next });
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon="delete"
                  aria-label="Remove row"
                  onClick={() => setForm({ ...form, openingHours: form.openingHours.filter((_, idx) => idx !== i) })}
                />
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon="add"
            className="mt-2"
            onClick={() => setForm({ ...form, openingHours: [...form.openingHours, { label: '', hours: '' }] })}
          >
            Add hours row
          </Button>
        </div>

        <div className="rounded-card border border-line bg-slate-50 p-4">
          <div className="mb-1 font-semibold">Map coordinates (optional)</div>
          <p className="mb-3 text-sm text-ink-soft">
            Helps “Get directions” open the exact pin. On Google Maps, right-click the clinic and click the two numbers at the top to copy them.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Latitude"
              placeholder="-6.7623"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
            <Input
              label="Longitude"
              placeholder="39.2665"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
