import { describe, it, expect } from 'vitest';
import {
  aggregateDailyPoints,
  buildCalendarGrid,
  calcStreak,
  pointsFromLog,
  toLevel,
} from './aggregate';
import type { ReadingLog } from '@/features/articles/domain/types';

function log(partial: Partial<ReadingLog>): ReadingLog {
  return {
    id: partial.id ?? 'l',
    articleId: partial.articleId ?? 'a1',
    readOn: partial.readOn ?? '2024-05-01',
    progressFrom: partial.progressFrom ?? 0,
    progressTo: partial.progressTo ?? 0,
    createdAt: partial.createdAt ?? '2024-05-01T00:00:00.000Z',
  };
}

describe('pointsFromLog', () => {
  it('positive delta = delta', () => {
    expect(pointsFromLog(log({ progressFrom: 10, progressTo: 50 }))).toBe(40);
  });
  it('zero delta = 10 (touch)', () => {
    expect(pointsFromLog(log({ progressFrom: 50, progressTo: 50 }))).toBe(10);
  });
  it('negative delta = 0', () => {
    expect(pointsFromLog(log({ progressFrom: 50, progressTo: 20 }))).toBe(0);
  });
});

describe('aggregateDailyPoints', () => {
  it('sums points per day and tracks article ids', () => {
    const logs = [
      log({ id: '1', articleId: 'a', readOn: '2024-05-01', progressFrom: 0, progressTo: 50 }),
      log({ id: '2', articleId: 'b', readOn: '2024-05-01', progressFrom: 20, progressTo: 100 }),
      log({ id: '3', articleId: 'a', readOn: '2024-05-02', progressFrom: 50, progressTo: 50 }),
    ];
    const map = aggregateDailyPoints(logs);
    const d1 = map.get('2024-05-01');
    expect(d1?.points).toBe(50 + 80);
    expect(d1?.logCount).toBe(2);
    expect(d1?.articleIds.sort()).toEqual(['a', 'b']);
    const d2 = map.get('2024-05-02');
    expect(d2?.points).toBe(10);
  });

  it('empty logs → empty map', () => {
    expect(aggregateDailyPoints([]).size).toBe(0);
  });
});

describe('toLevel', () => {
  it.each([
    [0, 0],
    [1, 1],
    [49, 1],
    [50, 2],
    [99, 2],
    [100, 3],
    [199, 3],
    [200, 4],
    [1000, 4],
  ])('%d → %d', (points, level) => {
    expect(toLevel(points)).toBe(level);
  });

  it('negative treated as 0', () => {
    expect(toLevel(-5)).toBe(0);
  });
});

describe('buildCalendarGrid', () => {
  it('returns exactly N weeks of 7 days ending with today in last week', () => {
    const today = new Date(2024, 4, 15); // 2024-05-15 (Wed)
    const grid = buildCalendarGrid([], { weeks: 10, today });
    expect(grid.weeks).toHaveLength(10);
    expect(grid.weeks[0]?.days).toHaveLength(7);
    const lastWeek = grid.weeks[grid.weeks.length - 1];
    const dates = lastWeek?.days.map((d) => d?.date);
    expect(dates).toContain('2024-05-15');
  });

  it('handles leap year boundary (2024-02-29 included)', () => {
    const today = new Date(2024, 2, 2);
    const grid = buildCalendarGrid([], { weeks: 2, today });
    const allDates = grid.weeks.flatMap((w) => w.days.map((d) => d?.date));
    expect(allDates).toContain('2024-02-29');
  });

  it('counts points totals correctly', () => {
    const today = new Date(2024, 4, 15);
    const logs = [
      log({ id: '1', readOn: '2024-05-15', progressFrom: 0, progressTo: 50 }),
      log({ id: '2', readOn: '2024-05-14', progressFrom: 0, progressTo: 80 }),
    ];
    const grid = buildCalendarGrid(logs, { weeks: 2, today });
    expect(grid.totalPoints).toBe(130);
    expect(grid.totalLogs).toBe(2);
    expect(grid.activeDays).toBe(2);
  });

  it('marks future days with isFuture flag', () => {
    const today = new Date(2024, 4, 15);
    const grid = buildCalendarGrid([], { weeks: 2, today });
    const lastWeek = grid.weeks[grid.weeks.length - 1];
    const future = lastWeek?.days.find((d) => d && d.date > '2024-05-15');
    expect(future?.isFuture).toBe(true);
  });

  it('crosses year boundary', () => {
    const today = new Date(2025, 0, 5);
    const grid = buildCalendarGrid([], { weeks: 4, today });
    const allDates = grid.weeks.flatMap((w) => w.days.map((d) => d?.date));
    expect(allDates).toContain('2024-12-15');
    expect(allDates).toContain('2025-01-01');
  });
});

describe('calcStreak', () => {
  it('empty → 0', () => {
    const r = calcStreak([], new Date(2024, 4, 15));
    expect(r).toEqual({ current: 0, longest: 0 });
  });

  it('current streak counts today and backwards', () => {
    const today = new Date(2024, 4, 15);
    const logs = [
      log({ id: '1', readOn: '2024-05-15', progressFrom: 0, progressTo: 50 }),
      log({ id: '2', readOn: '2024-05-14', progressFrom: 0, progressTo: 10 }),
      log({ id: '3', readOn: '2024-05-13', progressFrom: 0, progressTo: 10 }),
      log({ id: '4', readOn: '2024-05-10', progressFrom: 0, progressTo: 10 }),
    ];
    const r = calcStreak(logs, today);
    expect(r.current).toBe(3);
    expect(r.longest).toBe(3);
  });

  it('today without points still counts yesterday as current', () => {
    const today = new Date(2024, 4, 15);
    const logs = [
      log({ id: '1', readOn: '2024-05-14', progressFrom: 0, progressTo: 50 }),
      log({ id: '2', readOn: '2024-05-13', progressFrom: 0, progressTo: 50 }),
    ];
    const r = calcStreak(logs, today);
    expect(r.current).toBe(2);
  });

  it('longest streak uses full history', () => {
    const today = new Date(2024, 4, 15);
    const logs = [
      log({ id: '1', readOn: '2024-04-01', progressFrom: 0, progressTo: 50 }),
      log({ id: '2', readOn: '2024-04-02', progressFrom: 0, progressTo: 50 }),
      log({ id: '3', readOn: '2024-04-03', progressFrom: 0, progressTo: 50 }),
      log({ id: '4', readOn: '2024-04-04', progressFrom: 0, progressTo: 50 }),
      log({ id: '5', readOn: '2024-05-15', progressFrom: 0, progressTo: 50 }),
    ];
    const r = calcStreak(logs, today);
    expect(r.current).toBe(1);
    expect(r.longest).toBe(4);
  });

  it('touch-only days (10pt) count as active', () => {
    const today = new Date(2024, 4, 15);
    const logs = [
      log({ id: '1', readOn: '2024-05-15', progressFrom: 50, progressTo: 50 }),
      log({ id: '2', readOn: '2024-05-14', progressFrom: 20, progressTo: 20 }),
    ];
    const r = calcStreak(logs, today);
    expect(r.current).toBe(2);
  });
});
