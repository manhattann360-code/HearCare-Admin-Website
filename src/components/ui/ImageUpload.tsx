import { useState } from 'react';
import { api, errorMessage } from '@/api/client';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { FileDropzone } from './FileDropzone';
import { useToast } from './Toast';

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  shape?: 'wide' | 'round';
  title?: string;
  description?: string;
  fallbackText?: string;
}

const MAX = 8 * 1024 * 1024;

/** Upload a picture with drag-and-drop or click. Shows a preview with a "Remove" button. */
export function ImageUpload({ value, onChange, shape = 'wide', title, description, fallbackText }: Props) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const upload = async (file: File) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      toast.error('Please choose a picture (JPG, PNG, WEBP or GIF).');
      return;
    }
    if (file.size > MAX) {
      toast.error('That picture is too big. Please choose one under 8 MB.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.upload<{ id: string; url: string }>('/admin/media', file);
      onChange(res.url);
      toast.success('Picture uploaded.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const round = shape === 'round';

  if (value) {
    return (
      <div className={cn('flex gap-4', round ? 'items-center' : 'flex-col')}>
        <img
          src={value}
          alt="Preview"
          className={cn(
            'border border-line bg-slate-100 object-cover',
            round ? 'h-28 w-28 rounded-full' : 'aspect-video w-full max-w-lg rounded-card',
          )}
        />
        <div className="flex flex-wrap gap-3">
          <label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) upload(f);
              }}
            />
            <span className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-card border border-primary px-4 font-semibold text-primary hover:bg-primary-soft">
              {loading ? 'Uploading…' : 'Change picture'}
            </span>
          </label>
          <Button variant="danger" size="sm" icon="delete" onClick={() => onChange(null)}>
            Remove picture
          </Button>
        </div>
      </div>
    );
  }

  if (round) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-line bg-slate-100 text-2xl font-bold text-ink-soft">
          {fallbackText || '?'}
        </div>
        <FileDropzone
          compact
          accept="image/jpeg,image/png,image/webp,image/gif"
          loading={loading}
          onFile={upload}
          icon="add_a_photo"
          title={title ?? 'Add a photo'}
          description={description ?? 'Drag a picture here or click to choose'}
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <FileDropzone
      accept="image/jpeg,image/png,image/webp,image/gif"
      loading={loading}
      onFile={upload}
      icon="add_photo_alternate"
      title={title ?? 'Add a picture'}
      description={description ?? 'Drag a picture here, or click to choose one (JPG, PNG, WEBP; up to 8 MB)'}
    />
  );
}
