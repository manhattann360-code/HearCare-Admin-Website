import { useState } from 'react';
import { api, errorMessage } from '@/api/client';
import type { ImportResult } from '@/api/types';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export function ImportPanel({
  onImported,
  heading = 'Import from a document',
  hint,
}: {
  onImported: (r: ImportResult) => void;
  heading?: string;
  hint?: string;
}) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handle = async (file: File) => {
    if (!/\.(docx|md|markdown|txt|pdf)$/i.test(file.name)) {
      toast.error('We can only read Word (.docx), Markdown (.md), text (.txt) or PDF files.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('That file is too big. Please choose one under 15 MB.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.upload<ImportResult>('/admin/articles/import', file);
      onImported({ title: res.title ?? '', html: res.html ?? '', warnings: res.warnings ?? [] });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/40 bg-primary-soft/40 p-4 sm:p-5">
      <h2 className="mb-1 text-lg">{heading}</h2>
      <p className="mb-3 text-ink-soft">
        {hint ??
          'Upload a Word (.docx), Markdown (.md), text or PDF file and we will fill the article for you; you can still edit it.'}
      </p>
      <FileDropzone
        compact
        accept=".docx,.md,.markdown,.txt,.pdf"
        loading={loading}
        onFile={handle}
        icon="upload_file"
        title="Drag a document here, or click to choose a file"
        description="Word (.docx), Markdown (.md), text (.txt) or PDF — up to 15 MB"
      />
    </Card>
  );
}
