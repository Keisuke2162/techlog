'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import type { Tag, TagColor } from '@/features/articles/domain/types';
import { cn } from '@/shared/lib/cn';
import { useRepository } from '@/shared/repository/context';
import { createTag } from '@/features/tags/application/usecases';
import { useQueryClient } from '@tanstack/react-query';
import { TQK } from './hooks';
import { TAG_COLOR_CLASS } from './tag-chip';
import { TAG_COLORS } from '@/features/articles/domain/types';

export interface TagInputProps {
  allTags: Tag[];
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function TagInput({
  allTags,
  value,
  onChange,
  label,
  placeholder = 'タグを入力して Enter',
}: TagInputProps) {
  const [input, setInput] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);
  const repo = useRepository();
  const qc = useQueryClient();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedTags = React.useMemo(
    () => value.map((id) => allTags.find((t) => t.id === id)).filter((t): t is Tag => !!t),
    [value, allTags],
  );

  const suggestions = React.useMemo(() => {
    const q = input.trim().toLocaleLowerCase();
    const avail = allTags.filter((t) => !value.includes(t.id));
    if (!q) return avail.slice(0, 8);
    return avail.filter((t) => t.name.toLocaleLowerCase().includes(q)).slice(0, 8);
  }, [input, allTags, value]);

  const exactMatch = allTags.find(
    (t) => t.name.trim().toLocaleLowerCase() === input.trim().toLocaleLowerCase(),
  );

  const addExisting = (tag: Tag) => {
    if (!value.includes(tag.id)) onChange([...value, tag.id]);
    setInput('');
    setOpen(false);
  };

  const createNew = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = exactMatch;
    if (existing) {
      addExisting(existing);
      return;
    }
    const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)] as TagColor;
    try {
      const created = await createTag(repo, { name: trimmed, color });
      await qc.invalidateQueries({ queryKey: TQK.tags() });
      onChange([...value, created.id]);
      setInput('');
      setOpen(false);
    } catch {
      // ignore (duplicate guarded)
    }
  };

  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const chosen = suggestions[cursor];
      if (chosen) {
        addExisting(chosen);
        return;
      }
      await createNew(input);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(suggestions.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {label ? <label className="text-sm font-medium">{label}</label> : null}
      <div
        className={cn(
          'border-input bg-background flex flex-wrap items-center gap-2 rounded-md border p-2',
          'focus-within:ring-ring focus-within:ring-2',
        )}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              TAG_COLOR_CLASS[tag.color],
            )}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag.id))}
              aria-label={`${tag.name} を外す`}
              className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="placeholder:text-muted-foreground min-w-32 flex-1 bg-transparent text-sm outline-none"
          placeholder={placeholder}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
            setCursor(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
        />
      </div>
      {open && (suggestions.length > 0 || (input.trim() && !exactMatch)) ? (
        <ul className="border-border bg-popover rounded-md border p-1 text-sm shadow-md">
          {suggestions.map((tag, idx) => (
            <li key={tag.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addExisting(tag)}
                className={cn(
                  'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left',
                  idx === cursor ? 'bg-accent' : 'hover:bg-accent/50',
                )}
              >
                <span className={cn('inline-flex items-center gap-1')}>
                  <span
                    aria-hidden
                    className={cn('h-2 w-2 rounded-full', TAG_COLOR_CLASS[tag.color])}
                  />
                  {tag.name}
                </span>
              </button>
            </li>
          ))}
          {input.trim() && !exactMatch ? (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => createNew(input)}
                className="hover:bg-accent w-full rounded-sm px-2 py-1.5 text-left"
              >
                「{input.trim()}」を新規作成
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
