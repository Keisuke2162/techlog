import type { ReadingLog } from '@/features/articles/domain/types';
import { addDays, parseLocalDate, toLocalDateString } from '@/shared/lib/date';

export const TOUCH_POINTS = 10;

export interface DailyPoint {
  readOn: string;
  points: number;
  logCount: number;
  articleIds: string[];
}

export function pointsFromLog(log: ReadingLog): number {
  const delta = log.progressTo - log.progressFrom;
  if (delta === 0) return TOUCH_POINTS;
  return delta > 0 ? delta : 0;
}

export function aggregateDailyPoints(logs: readonly ReadingLog[]): Map<string, DailyPoint> {
  const byDate = new Map<string, DailyPoint>();
  for (const log of logs) {
    const existing = byDate.get(log.readOn);
    const pts = pointsFromLog(log);
    if (existing) {
      existing.points += pts;
      existing.logCount += 1;
      if (!existing.articleIds.includes(log.articleId)) existing.articleIds.push(log.articleId);
    } else {
      byDate.set(log.readOn, {
        readOn: log.readOn,
        points: pts,
        logCount: 1,
        articleIds: [log.articleId],
      });
    }
  }
  return byDate;
}

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export function toLevel(points: number): HeatmapLevel {
  if (points <= 0) return 0;
  if (points < 50) return 1;
  if (points < 100) return 2;
  if (points < 200) return 3;
  return 4;
}

export interface HeatmapCell {
  date: string;
  points: number;
  level: HeatmapLevel;
  logCount: number;
  articleIds: string[];
  isFuture: boolean;
}

export interface HeatmapWeek {
  weekStart: string;
  days: Array<HeatmapCell | null>;
}

export interface HeatmapGrid {
  weeks: HeatmapWeek[];
  weekStartsOn: 0 | 1;
  totalPoints: number;
  totalLogs: number;
  activeDays: number;
}

export interface BuildCalendarGridOptions {
  weeks?: number;
  weekStartsOn?: 0 | 1;
  today?: Date;
}

export function buildCalendarGrid(
  logs: readonly ReadingLog[],
  { weeks = 53, weekStartsOn = 0, today = new Date() }: BuildCalendarGridOptions = {},
): HeatmapGrid {
  const byDate = aggregateDailyPoints(logs);
  const todayLocal = toLocalDateString(today);

  const dow = parseLocalDate(todayLocal).getDay();
  // Index within the week: 0 = weekStartsOn day
  const indexInWeek = (dow - weekStartsOn + 7) % 7;
  const currentWeekStart = addDays(parseLocalDate(todayLocal), -indexInWeek);
  const firstWeekStart = addDays(currentWeekStart, -(weeks - 1) * 7);

  const resultWeeks: HeatmapWeek[] = [];
  let totalPoints = 0;
  let totalLogs = 0;
  let activeDays = 0;

  for (let w = 0; w < weeks; w += 1) {
    const weekStartDate = addDays(firstWeekStart, w * 7);
    const days: Array<HeatmapCell | null> = [];
    for (let d = 0; d < 7; d += 1) {
      const date = addDays(weekStartDate, d);
      const key = toLocalDateString(date);
      const isFuture = key > todayLocal;
      const point = byDate.get(key);
      if (point) {
        totalPoints += point.points;
        totalLogs += point.logCount;
        activeDays += 1;
      }
      const cell: HeatmapCell = {
        date: key,
        points: point?.points ?? 0,
        level: toLevel(point?.points ?? 0),
        logCount: point?.logCount ?? 0,
        articleIds: point?.articleIds ?? [],
        isFuture,
      };
      days.push(cell);
    }
    resultWeeks.push({ weekStart: toLocalDateString(weekStartDate), days });
  }

  return { weeks: resultWeeks, weekStartsOn, totalPoints, totalLogs, activeDays };
}

export interface Streak {
  current: number;
  longest: number;
}

export function calcStreak(logs: readonly ReadingLog[], today: Date = new Date()): Streak {
  const byDate = aggregateDailyPoints(logs);
  const activeDates = new Set<string>();
  byDate.forEach((v, k) => {
    if (v.points > 0) activeDates.add(k);
  });

  const todayStr = toLocalDateString(today);
  let current = 0;
  let cursor = parseLocalDate(todayStr);
  const todayActive = activeDates.has(todayStr);
  if (!todayActive) {
    cursor = addDays(cursor, -1);
  }
  while (activeDates.has(toLocalDateString(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  const sorted = Array.from(activeDates).sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const dateStr of sorted) {
    const d = parseLocalDate(dateStr);
    if (prev && toLocalDateString(addDays(prev, 1)) === dateStr) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }

  return { current, longest: Math.max(longest, current) };
}
