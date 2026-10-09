import { describe, it, expect } from 'vitest';
import { addDays, diffDays, parseLocalDate, startOfDay, toLocalDateString } from './date';

describe('date helpers', () => {
  it('toLocalDateString formats zero padded', () => {
    const d = new Date(2024, 0, 2, 13, 45);
    expect(toLocalDateString(d)).toBe('2024-01-02');
  });

  it('parseLocalDate parses YYYY-MM-DD as local', () => {
    const d = parseLocalDate('2024-01-02');
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(2);
  });

  it('parseLocalDate returns Invalid Date for bad input', () => {
    expect(Number.isNaN(parseLocalDate('abc').getTime())).toBe(true);
  });

  it('addDays and diffDays round trip', () => {
    const base = new Date(2024, 1, 29); // leap year
    const plus5 = addDays(base, 5);
    expect(diffDays(plus5, base)).toBe(5);
    expect(toLocalDateString(plus5)).toBe('2024-03-05');
  });

  it('startOfDay strips time', () => {
    const d = new Date(2024, 5, 10, 23, 59, 59);
    expect(startOfDay(d).getHours()).toBe(0);
  });

  it('handles year boundary', () => {
    const d = new Date(2024, 11, 31);
    expect(toLocalDateString(addDays(d, 1))).toBe('2025-01-01');
  });
});
