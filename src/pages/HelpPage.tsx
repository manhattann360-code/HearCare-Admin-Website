import { Link } from 'react-router-dom';
import { PageHeader, Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Pill';

const topics: { icon: string; title: string; steps: string[]; link?: { to: string; label: string } }[] = [
  {
    icon: 'post_add',
    title: 'How to add an article',
    steps: [
      'Click “Health articles” on the left, then click “Add article”.',
      'Choose a topic and a category tag. Add a cover picture if you have one.',
      'Type the title, a short summary (up to 160 letters) and the article text. You can also click “Import from a document” to fill it from a Word file.',
      'Click “Preview” to see how it will look on a phone.',
      'Click “Save as draft” to keep it private, or “Publish” to show it in the app.',
    ],
    link: { to: '/articles/new', label: 'Add an article' },
  },
  {
    icon: 'translate',
    title: 'How to add a Kiswahili version',
    steps: [
      'Open the article and click the “Kiswahili” tab above the title.',
      'Type the Kiswahili title, summary and text (or import a document).',
      'Save. If the Kiswahili tab is empty, people will see the English version instead.',
    ],
  },
  {
    icon: 'person_add',
    title: 'How to add an audiologist',
    steps: [
      'Click “Audiologists”, then “Add audiologist”.',
      'Fill in their name, photo and registration number. Choose the clinic and the services they offer.',
      'Set the days and hours they see patients under “Weekly availability”. Use “Copy Monday to weekdays” to save time.',
      'Add any days off (holidays, leave) under “Days off”.',
      'Switch on “Verified” only after you have checked their registration. Only verified audiologists appear in the app.',
    ],
    link: { to: '/audiologists/new', label: 'Add an audiologist' },
  },
  {
    icon: 'local_hospital',
    title: 'How to add a clinic',
    steps: [
      'Click “Clinics”, then “Add clinic”.',
      'Type the name, region and address. Add opening hours and the insurance they accept (for example NHIF).',
      'Optional: add the map position. On Google Maps, right-click the clinic, then click the numbers at the top of the menu to copy them.',
      'You can also add a new clinic while adding an audiologist.',
    ],
    link: { to: '/clinics/new', label: 'Add a clinic' },
  },
  {
    icon: 'event',
    title: 'How to manage appointments',
    steps: [
      'Click “Appointments”. Use the filters to pick a date, a status or an audiologist.',
      'Tap the patient’s phone number to call them.',
      '“Cancel” asks for a reason. “Mark completed” and “Mark no-show” are for after the visit time.',
    ],
    link: { to: '/appointments', label: 'Open appointments' },
  },
  {
    icon: 'admin_panel_settings',
    title: 'How to add a team member or change your password',
    steps: [
      'Click “Team (admins)” and then “Add team member” to let a colleague sign in.',
      'To change your own password, click “My account”.',
      'Always click “Sign out” when you finish on a shared computer.',
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Help" subtitle="Simple step-by-step guides. Nothing here can break anything, so feel free to explore." />
      <Notice tone="info" className="mb-6">
        Before anything is deleted, we always ask you to confirm. Drafts are never shown in the app, so it is safe to practise.
      </Notice>
      <div className="space-y-5">
        {topics.map((t) => (
          <Card key={t.title} className="p-5 sm:p-6">
            <h2 className="mb-3 flex items-center gap-2 text-xl">
              <Icon name={t.icon} className="text-primary" />
              {t.title}
            </h2>
            <ol className="list-decimal space-y-2 pl-6">
              {t.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            {t.link && (
              <Link to={t.link.to} className="mt-4 inline-block">
                <Button variant="secondary" size="sm" icon="arrow_forward">
                  {t.link.label}
                </Button>
              </Link>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
