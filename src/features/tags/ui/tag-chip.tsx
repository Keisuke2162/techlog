'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/cn';
import type { Tag, TagColor } from '@/features/articles/domain/types';
import { X } from 'lucide-react';

export const TAG_COLOR_CLASS: Record<TagColor, string> = {
  slate: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  red: 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200',
  orange: 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  amber: 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  yellow: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  lime: 'bg-lime-200 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  green: 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200',
  emerald: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  teal: 'bg-teal-200 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  cyan: 'bg-cyan-200 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  sky: 'bg-sky-200 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  blue: 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  indigo: 'bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  violet: 'bg-violet-200 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  purple: 'bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  fuchsia: 'bg-fuchsia-200 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
  pink: 'bg-pink-200 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  rose: 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
};

export function TagChip({
  tag,
  onRemove,
  className,
  size = 'sm',
}: {
  tag: Tag;
  onRemove?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        TAG_COLOR_CLASS[tag.color],
        className,
      )}
    >
      <span>{tag.name}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${tag.name} を外す`}
          className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}
