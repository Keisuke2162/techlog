'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/shared/lib/cn';
import { buildCalendarGrid, type HeatmapCell, type HeatmapLevel } from '../domain/aggregate';
import type { ReadingLog } from '@/features/articles/domain/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

const LEVEL_CLASS: Record<HeatmapLevel, string> = {
  0: 'bg-heatmap-0',
  1: 'bg-heatmap-1',
  2: 'bg-heatmap-2',
  3: 'bg-heatmap-3',
  4: 'bg-heatmap-4',
};

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

export interface HeatmapProps {
  logs: readonly ReadingLog[];
  weeks?: number;
  onCellClick?: (cell: HeatmapCell) => void;
}

export function Heatmap({ logs, weeks = 53, onCellClick }: HeatmapProps) {
  const grid = React.useMemo(() => buildCalendarGrid(logs, { weeks }), [logs, weeks]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [grid.weeks.length]);

  const monthLabels: Array<{ col: number; label: string } | null> = grid.weeks.map((w, idx) => {
    const d = parseISO(w.weekStart);
    const month = d.getMonth();
    const prev = idx > 0 ? parseISO(grid.weeks[idx - 1]!.weekStart).getMonth() : -1;
    return month !== prev ? { col: idx, label: format(d, 'MMM', { locale: ja }) } : null;
  });

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-2">
        <div ref={scrollRef} className="w-full scrollbar-thin overflow-x-auto pb-2">
          <div className="inline-flex min-w-full flex-col gap-1">
            <div
              className="text-muted-foreground grid gap-1 pl-7 text-[10px]"
              style={{ gridTemplateColumns: `repeat(${grid.weeks.length}, minmax(0, 1fr))` }}
              aria-hidden
            >
              {monthLabels.map((m, i) =>
                m ? (
                  <span key={i} style={{ gridColumnStart: m.col + 1 }}>
                    {m.label}
                  </span>
                ) : null,
              )}
            </div>
            <div className="flex gap-1">
              <div className="text-muted-foreground flex flex-col gap-1 text-[10px]" aria-hidden>
                {WEEKDAY_LABELS.map((label, i) => (
                  <span
                    key={label}
                    className={cn('h-3.5 leading-3.5', i % 2 === 0 ? 'opacity-0' : 'opacity-100')}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div
                role="grid"
                aria-label="読書量ヒートマップ"
                className="grid gap-1"
                style={{
                  gridAutoFlow: 'column',
                  gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
                }}
              >
                {grid.weeks.flatMap((week) =>
                  week.days.map((cell, dayIdx) =>
                    cell ? (
                      <HeatmapDay
                        key={`${week.weekStart}-${dayIdx}`}
                        cell={cell}
                        onClick={onCellClick}
                      />
                    ) : (
                      <div key={`${week.weekStart}-empty-${dayIdx}`} className="h-3.5 w-3.5" />
                    ),
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="text-muted-foreground flex items-center justify-end gap-2 text-xs">
          <span>少</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={cn('h-3 w-3 rounded-sm', LEVEL_CLASS[l as HeatmapLevel])} />
          ))}
          <span>多</span>
        </div>
      </div>
    </TooltipProvider>
  );
}

function HeatmapDay({
  cell,
  onClick,
}: {
  cell: HeatmapCell;
  onClick?: (cell: HeatmapCell) => void;
}) {
  const dateLabel = format(parseISO(cell.date), 'M月d日 (EEE)', { locale: ja });
  const label = cell.isFuture
    ? `${dateLabel}`
    : `${dateLabel}: ${cell.points}pt${cell.logCount ? ` (${cell.logCount}件)` : ''}`;
  const Interactive = onClick ? 'button' : 'div';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Interactive
          type={onClick ? ('button' as const) : undefined}
          onClick={onClick ? () => onClick(cell) : undefined}
          className={cn(
            'h-3.5 w-3.5 rounded-sm transition-opacity',
            LEVEL_CLASS[cell.level],
            cell.isFuture ? 'opacity-30' : '',
            onClick ? 'hover:ring-ring cursor-pointer hover:ring-2' : '',
          )}
          aria-label={label}
          data-date={cell.date}
          data-level={cell.level}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
