import { describe, it, expect } from 'vitest';
import { applyProgress, applyStatus, clampProgress, statusForProgress } from './progress';
import type { Article } from './types';

const base: Article = {
  id: 'a1',
  url: 'https://example.com/x',
  title: 'x',
  status: 'want',
  progress: 0,
  memo: '',
  tagIds: [],
  addedAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const NOW = '2024-02-02T10:00:00.000Z';

describe('clampProgress', () => {
  it('clamps to 0..100 and rounds', () => {
    expect(clampProgress(-5)).toBe(0);
    expect(clampProgress(150)).toBe(100);
    expect(clampProgress(33.4)).toBe(33);
    expect(clampProgress(33.6)).toBe(34);
    expect(clampProgress(Number.NaN)).toBe(0);
  });
});

describe('statusForProgress', () => {
  it('100 → done', () => {
    expect(statusForProgress('want', 100)).toBe('done');
  });
  it('1-99 → reading', () => {
    expect(statusForProgress('want', 50)).toBe('reading');
  });
  it('0 keeps non-done, resets done to want', () => {
    expect(statusForProgress('reading', 0)).toBe('reading');
    expect(statusForProgress('done', 0)).toBe('want');
  });
});

describe('applyProgress', () => {
  it('no change if same progress', () => {
    const r = applyProgress(base, 0, NOW);
    expect(r.changed).toBe(false);
    expect(r.article).toBe(base);
  });

  it('50% moves to reading and updates lastReadAt', () => {
    const r = applyProgress(base, 50, NOW);
    expect(r.changed).toBe(true);
    expect(r.article.progress).toBe(50);
    expect(r.article.status).toBe('reading');
    expect(r.article.lastReadAt).toBe(NOW);
    expect(r.article.updatedAt).toBe(NOW);
    expect(r.article.finishedAt).toBeUndefined();
  });

  it('100% marks done and sets finishedAt', () => {
    const r = applyProgress(base, 100, NOW);
    expect(r.article.status).toBe('done');
    expect(r.article.progress).toBe(100);
    expect(r.article.finishedAt).toBe(NOW);
  });

  it('rolling back from done clears finishedAt', () => {
    const done = { ...base, status: 'done' as const, progress: 100, finishedAt: '2024-01-02' };
    const r = applyProgress(done, 50, NOW);
    expect(r.article.status).toBe('reading');
    expect(r.article.finishedAt).toBeUndefined();
  });

  it('rolling back to 0 from done moves to want and clears finishedAt', () => {
    const done = { ...base, status: 'done' as const, progress: 100, finishedAt: '2024-01-02' };
    const r = applyProgress(done, 0, NOW);
    expect(r.article.status).toBe('want');
    expect(r.article.finishedAt).toBeUndefined();
  });

  it('clamps out of range values', () => {
    expect(applyProgress(base, 150, NOW).article.progress).toBe(100);
    const neg = applyProgress({ ...base, progress: 10, status: 'reading' }, -3, NOW);
    expect(neg.article.progress).toBe(0);
  });
});

describe('applyStatus', () => {
  it('setting done forces progress 100 and finishedAt', () => {
    const r = applyStatus(base, 'done', NOW);
    expect(r.progress).toBe(100);
    expect(r.finishedAt).toBe(NOW);
  });

  it('setting reading from 0 bumps progress to 5', () => {
    const r = applyStatus(base, 'reading', NOW);
    expect(r.status).toBe('reading');
    expect(r.progress).toBe(5);
  });

  it('setting reading from 100 drops to 95', () => {
    const done = { ...base, status: 'done' as const, progress: 100, finishedAt: '2024-01-02' };
    const r = applyStatus(done, 'reading', NOW);
    expect(r.status).toBe('reading');
    expect(r.progress).toBe(95);
    expect(r.finishedAt).toBeUndefined();
  });

  it('setting want keeps progress (読み直し想定) and clears finishedAt', () => {
    const done = { ...base, status: 'done' as const, progress: 100, finishedAt: '2024-01-02' };
    const r = applyStatus(done, 'want', NOW);
    expect(r.status).toBe('want');
    expect(r.progress).toBe(100);
    expect(r.finishedAt).toBeUndefined();
  });

  it('no-op if status is the same', () => {
    const r = applyStatus(base, 'want', NOW);
    expect(r).toBe(base);
  });
});
