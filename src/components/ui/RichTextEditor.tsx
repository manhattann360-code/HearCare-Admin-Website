import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { api, errorMessage } from '@/api/client';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useToast } from './Toast';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
}

function ToolButton({
  icon,
  label,
  tip,
  active,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  tip: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={tip}
      aria-label={tip}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'group relative flex min-h-[52px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-40',
        active ? 'bg-primary text-white' : 'text-ink hover:bg-slate-100',
      )}
    >
      <Icon name={icon} className="text-[22px]" />
      <span>{label}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-medium text-white shadow group-hover:block"
      >
        {tip}
      </span>
    </button>
  );
}

const Divider = () => <span className="mx-1 hidden h-8 w-px self-center bg-line sm:block" />;

export function RichTextEditor({ value, onChange, placeholder, error }: Props) {
  const toast = useToast();
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastEmitted = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
      }),
      Link.configure({ openOnClick: false, autolink: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Image.configure({ inline: false }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'article-body',
        'data-placeholder': placeholder ?? '',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? '' : ed.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  // Keep the editor in sync when the value is changed from outside (e.g. file import).
  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const openLink = () => {
    const existing = editor.getAttributes('link').href as string | undefined;
    if (!existing && editor.state.selection.empty) {
      toast.info('First select the words you want to turn into a link, then click "Link".');
      return;
    }
    setLinkUrl(existing ?? 'https://');
    setLinkOpen(true);
  };
  const applyLink = () => {
    const url = linkUrl.trim();
    if (!url || url === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const href = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setLinkOpen(false);
  };
  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkOpen(false);
  };

  const uploadPicture = async (file: File) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      toast.error('Please choose a picture (JPG, PNG, WEBP or GIF).');
      return;
    }
    setUploading(true);
    try {
      const res = await api.upload<{ id: string; url: string }>('/admin/media', file);
      editor.chain().focus().setImage({ src: res.url, alt: '' }).run();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const e: Editor = editor;
  return (
    <div>
      <div className={cn('overflow-hidden rounded-card border bg-white', error ? 'border-danger' : 'border-line')}>
        <div className="flex flex-wrap gap-1 border-b border-line bg-slate-50 p-2" role="toolbar" aria-label="Text formatting">
          <ToolButton icon="title" label="Heading" tip="Big heading" active={e.isActive('heading', { level: 2 })} onClick={() => e.chain().focus().toggleHeading({ level: 2 }).run()} />
          <ToolButton icon="text_fields" label="Subheading" tip="Smaller heading" active={e.isActive('heading', { level: 3 })} onClick={() => e.chain().focus().toggleHeading({ level: 3 }).run()} />
          <Divider />
          <ToolButton icon="format_bold" label="Bold" tip="Bold (make text stronger)" active={e.isActive('bold')} onClick={() => e.chain().focus().toggleBold().run()} />
          <ToolButton icon="format_italic" label="Italic" tip="Italic (slanted text)" active={e.isActive('italic')} onClick={() => e.chain().focus().toggleItalic().run()} />
          <Divider />
          <ToolButton icon="format_list_bulleted" label="Bullets" tip="Bullet list" active={e.isActive('bulletList')} onClick={() => e.chain().focus().toggleBulletList().run()} />
          <ToolButton icon="format_list_numbered" label="Numbers" tip="Numbered list" active={e.isActive('orderedList')} onClick={() => e.chain().focus().toggleOrderedList().run()} />
          <Divider />
          <ToolButton icon="link" label="Link" tip="Turn selected words into a link" active={e.isActive('link')} onClick={openLink} />
          <ToolButton icon="image" label={uploading ? 'Wait…' : 'Picture'} tip="Insert a picture (upload)" disabled={uploading} onClick={() => fileRef.current?.click()} />
          <ToolButton icon="lightbulb" label="Highlight" tip="Highlight box (tip/rule)" active={e.isActive('blockquote')} onClick={() => e.chain().focus().toggleBlockquote().run()} />
          <ToolButton icon="horizontal_rule" label="Divider" tip="Divider line" onClick={() => e.chain().focus().setHorizontalRule().run()} />
          <Divider />
          <ToolButton icon="undo" label="Undo" tip="Undo last change" disabled={!e.can().undo()} onClick={() => e.chain().focus().undo().run()} />
          <ToolButton icon="redo" label="Redo" tip="Redo" disabled={!e.can().redo()} onClick={() => e.chain().focus().redo().run()} />
        </div>
        <EditorContent editor={editor} />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(ev) => {
          const f = ev.target.files?.[0];
          ev.target.value = '';
          if (f) uploadPicture(f);
        }}
      />
      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1 text-sm font-medium text-danger">
          <Icon name="error" className="text-[18px]" />
          {error}
        </p>
      )}
      <p className="mt-2 text-sm text-ink-soft">
        Tip: a <strong>Highlight box</strong> is shown in blue in the app. Make its first line bold to give it a title.
      </p>

      <Modal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Add a link"
        size="sm"
        footer={
          <>
            {e.isActive('link') && (
              <Button variant="danger" onClick={removeLink}>
                Remove link
              </Button>
            )}
            <Button variant="secondary" onClick={() => setLinkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyLink}>Save link</Button>
          </>
        }
      >
        <Input
          label="Web address"
          hint="Paste the full address, for example https://www.who.int"
          value={linkUrl}
          onChange={(ev) => setLinkUrl(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') {
              ev.preventDefault();
              applyLink();
            }
          }}
          autoFocus
        />
      </Modal>
    </div>
  );
}
