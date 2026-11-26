import { CrudPage } from '@/features/crud/CrudPage';
import type { CrudConfig } from '@/features/crud/CrudPage';
import type { Region, Service, Topic } from '@/api/types';
import { Pill } from '@/components/ui/Pill';

const regions: CrudConfig<Region> = {
  endpoint: '/admin/regions',
  queryKey: 'regions',
  title: 'Regions',
  subtitle: 'Regions of Tanzania where clinics are located (for example Dar es Salaam, Arusha). Patients use these to find a clinic near them.',
  itemName: 'region',
  addLabel: 'Add region',
  emptyTitle: 'No regions yet',
  emptyText: 'Add the regions where your clinics are, so clinics and audiologists can be placed on the map.',
  emptyIcon: 'location_on',
  fields: [
    { name: 'name', label: 'Region name', type: 'text', required: true, placeholder: 'e.g. Dar es Salaam' },
    { name: 'sortOrder', label: 'Order in the list', type: 'number', hint: 'Smaller numbers are shown first.' },
  ],
  itemTitle: (r) => r.name,
  itemSubtitle: (r) => (r.audiologistCount !== undefined ? `${r.audiologistCount} audiologist${r.audiologistCount === 1 ? '' : 's'}` : ''),
  sortBy: (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
  newDefaults: (items) => ({ sortOrder: items.reduce((m, i) => Math.max(m, i.sortOrder ?? 0), 0) + 1 }),
};

const services: CrudConfig<Service> = {
  endpoint: '/admin/services',
  queryKey: 'services',
  title: 'Services offered',
  subtitle: 'The kinds of visits patients can book, such as a hearing test or a hearing aid fitting.',
  itemName: 'service',
  addLabel: 'Add service',
  emptyTitle: 'No services yet',
  emptyText: 'Add the services your audiologists offer, for example “Hearing test”.',
  emptyIcon: 'medical_services',
  fields: [
    { name: 'name', label: 'Service name', type: 'bilingual', required: true },
    { name: 'description', label: 'Short description', type: 'bilingualTextarea', hint: 'One or two plain sentences that tell the patient what to expect.' },
    { name: 'icon', label: 'Icon', type: 'icon', default: 'hearing' },
    { name: 'forChildren', label: 'This service is for children', type: 'switch', description: 'Turn on for services such as child hearing checks.' },
    { name: 'isActive', label: 'Show this service in the app', type: 'switch', default: true, description: 'Turn off to hide it without deleting it.' },
  ],
  itemTitle: (s) => s.name?.en ?? '',
  itemSubtitle: (s) => s.description?.en ?? '',
  itemIcon: (s) => s.icon,
  itemBadges: (s) => (
    <>
      {s.forChildren && <Pill tone="info" icon="child_care">Children</Pill>}
      {s.isActive === false && <Pill tone="warning">Hidden</Pill>}
    </>
  ),
};

const topics: CrudConfig<Topic> = {
  endpoint: '/admin/topics',
  queryKey: 'topics',
  title: 'Article topics',
  subtitle: 'Topics group the health articles in the app (for example “Hearing health” or “Children”).',
  itemName: 'topic',
  addLabel: 'Add topic',
  emptyTitle: 'No topics yet',
  emptyText: 'You need at least one topic before you can add an article.',
  emptyIcon: 'sell',
  fields: [
    { name: 'name', label: 'Topic name', type: 'bilingual', required: true },
    { name: 'icon', label: 'Icon', type: 'icon', default: 'menu_book' },
    { name: 'sortOrder', label: 'Order in the list', type: 'number', hint: 'Smaller numbers are shown first.' },
  ],
  itemTitle: (t) => t.name?.en ?? '',
  itemSubtitle: (t) => (t.articleCount !== undefined ? `${t.articleCount} article${t.articleCount === 1 ? '' : 's'}` : ''),
  itemIcon: (t) => t.icon,
  sortBy: (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  newDefaults: (items) => ({ sortOrder: items.reduce((m, i) => Math.max(m, i.sortOrder ?? 0), 0) + 1 }),
};

export const RegionsPage = () => <CrudPage config={regions} />;
export const ServicesPage = () => <CrudPage config={services} />;
export const TopicsPage = () => <CrudPage config={topics} />;
