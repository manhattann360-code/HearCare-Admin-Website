import { useState } from 'react';
import { Button } from './Button';
import { Field, controlClass } from './Input';
import { Icon } from './Icon';

interface Props {
  label: string;
  hint?: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

/** Type a name and press "Add" (or Enter) to make a tag. */
export function TagInput({ label, hint, value, onChange, placeholder, suggestions = [] }: Props) {
  const [text, setText] = useState('');
  const add = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (!value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setText('');
  };
  const remaining = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <Field label={label} hint={hint}>
      {value.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 pl-4 pr-2 font-semibold text-primary-pressed">
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(value.filter((x) => x !== v))}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/70"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={`${controlClass()} h-12`}
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(text);
            }
          }}
        />
        <Button variant="secondary" onClick={() => add(text)} icon="add">
          Add
        </Button>
      </div>
      {remaining.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-soft">Quick add:</span>
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-line bg-white px-3 py-1 font-medium hover:bg-slate-50"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}
