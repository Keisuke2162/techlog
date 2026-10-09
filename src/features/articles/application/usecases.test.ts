import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RepositoryBundle } from '@/shared/repository/types';
import { TechLogDexie } from '../infrastructure/db';
import { createDexieRepository } from '../infrastructure/dexie-repository';
import {
  addArticle,
  deleteArticle,
  DuplicateUrlError,
  markReadToday,
  updateArticle,
  updateProgress,
  updateReadingLogDate,
  deleteReadingLog,
} from './usecases';

let repo: RepositoryBundle;
let db: TechLogDexie;

beforeEach(async () => {
  db = new TechLogDexie(`test-${Math.random()}`);
  repo = createDexieRepository(db);
});

afterEach(async () => {
  db.close();
});

describe('addArticle', () => {
  it('creates an article with normalized URL', async () => {
    const a = await addArticle(repo, {
      url: 'HTTPS://Example.com/Post?utm_source=x',
      title: 'Post',
    });
    expect(a.url).toBe('https://example.com/Post');
    expect(a.status).toBe('want');
    expect(a.progress).toBe(0);
  });

  it('rejects duplicate URL', async () => {
    await addArticle(repo, { url: 'https://example.com/x', title: 'A' });
    await expect(
      addArticle(repo, { url: 'https://example.com/x', title: 'B' }),
    ).rejects.toBeInstanceOf(DuplicateUrlError);
  });

  it('respects initial progress mapping', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/a', title: 'A', progress: 50 });
    expect(a.status).toBe('reading');
    expect(a.progress).toBe(50);
    expect(a.lastReadAt).toBeDefined();
  });

  it('forces done to want when progress is 0', async () => {
    const a = await addArticle(repo, {
      url: 'https://example.com/b',
      title: 'B',
      status: 'done',
      progress: 0,
    });
    expect(a.status).toBe('want');
    expect(a.progress).toBe(0);
  });

  it('marks done at 100', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/c', title: 'C', progress: 100 });
    expect(a.status).toBe('done');
    expect(a.finishedAt).toBeDefined();
  });
});

describe('updateArticle', () => {
  it('updates fields', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/x', title: 'X' });
    const updated = await updateArticle(repo, { id: a.id, title: 'Y', memo: 'hello' });
    expect(updated.title).toBe('Y');
    expect(updated.memo).toBe('hello');
    expect(updated.updatedAt).not.toBe(a.updatedAt);
  });

  it('status change goes through applyStatus', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/x', title: 'X' });
    const r = await updateArticle(repo, { id: a.id, status: 'done' });
    expect(r.status).toBe('done');
    expect(r.progress).toBe(100);
    expect(r.finishedAt).toBeDefined();
  });

  it('rejects URL change that would collide', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/a', title: 'A' });
    await addArticle(repo, { url: 'https://example.com/b', title: 'B' });
    await expect(
      updateArticle(repo, { id: a.id, url: 'https://example.com/b' }),
    ).rejects.toBeInstanceOf(DuplicateUrlError);
  });
});

describe('deleteArticle', () => {
  it('deletes article and its reading logs', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/a', title: 'A' });
    await updateProgress(repo, { articleId: a.id, progress: 50 });
    await deleteArticle(repo, a.id);
    expect(await repo.articles.getById(a.id)).toBeUndefined();
    expect((await repo.readingLogs.listByArticle(a.id)).length).toBe(0);
  });
});

describe('updateProgress', () => {
  it('creates a reading log and updates status', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/a', title: 'A' });
    const r = await updateProgress(repo, { articleId: a.id, progress: 60 });
    expect(r.article.status).toBe('reading');
    expect(r.article.progress).toBe(60);
    expect(r.log?.progressFrom).toBe(0);
    expect(r.log?.progressTo).toBe(60);
  });

  it('no-op when progress is unchanged', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/a', title: 'A' });
    const r = await updateProgress(repo, { articleId: a.id, progress: 0 });
    expect(r.log).toBeNull();
  });

  it('100 marks done with finishedAt and log', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/a', title: 'A' });
    const r = await updateProgress(repo, { articleId: a.id, progress: 100 });
    expect(r.article.status).toBe('done');
    expect(r.article.finishedAt).toBeDefined();
  });
});

describe('markReadToday', () => {
  it('creates a touch log without changing progress', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/a', title: 'A', progress: 30 });
    const r = await markReadToday(repo, { articleId: a.id });
    expect(r.article.progress).toBe(30);
    expect(r.log?.progressFrom).toBe(30);
    expect(r.log?.progressTo).toBe(30);
  });
});

describe('updateReadingLogDate / deleteReadingLog', () => {
  it('updates a log date', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/a', title: 'A' });
    const r = await updateProgress(repo, { articleId: a.id, progress: 50 });
    const log = r.log!;
    const updated = await updateReadingLogDate(repo, log.id, '2024-01-01');
    expect(updated.readOn).toBe('2024-01-01');
  });

  it('deletes a log', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/a', title: 'A' });
    const r = await updateProgress(repo, { articleId: a.id, progress: 50 });
    await deleteReadingLog(repo, r.log!.id);
    const logs = await repo.readingLogs.listByArticle(a.id);
    expect(logs.length).toBe(0);
  });
});
