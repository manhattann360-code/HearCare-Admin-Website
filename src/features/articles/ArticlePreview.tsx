import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  html: string;
  cover: string | null;
  topic?: string;
  readMinutes: number;
  reviewedBy?: { name: string; credential: string } | null;
  language: 'English' | 'Kiswahili';
}

/** Phone-width preview that mimics the mobile app's article screen. */
export function ArticlePreview({ open, onClose, title, summary, html, cover, topic, readMinutes, reviewedBy, language }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Preview (${language})`}
      size="md"
      footer={<Button onClick={onClose}>Close preview</Button>}
    >
      <p className="mb-4 text-center text-sm text-ink-soft">This is how the article will look on a phone.</p>
      <div className="mx-auto w-[360px] max-w-full overflow-hidden rounded-[32px] border-[8px] border-slate-800 bg-bg shadow-xl">
        <div className="max-h-[560px] overflow-y-auto">
          {cover && <img src={cover} alt="" className="aspect-[16/9] w-full object-cover" />}
          <div className="p-4">
            {topic && <div className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">{topic}</div>}
            <h1 className="mb-1 text-[26px] leading-tight">{title || 'Your title will appear here'}</h1>
            <div className="mb-3 text-sm text-ink-soft">{readMinutes > 0 ? `${readMinutes} min read` : ''}</div>
            {summary && <p className="mb-4 text-base text-ink-soft">{summary}</p>}
            {reviewedBy?.name && (
              <div className="mb-4 rounded-card border border-success/30 bg-success-soft p-3 text-sm">
                <span className="font-semibold">Medically reviewed by</span> {reviewedBy.name}
                {reviewedBy.credential ? `, ${reviewedBy.credential}` : ''}
              </div>
            )}
            <div className="article-body" dangerouslySetInnerHTML={{ __html: html || '<p><em>The article text will appear here.</em></p>' }} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
