import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TechLogDexie } from '@/features/articles/infrastructure/db';
import { createDexieRepository } from '@/features/articles/infrastructure/dexie-repository';
import { addArticle, updateProgress } from '@/features/articles/application/usecases';
import { createTag } from '@/features/tags/application/usecases';
import type { RepositoryBundle } from '@/shared/repository/types';
import { exportAll, importAll, InvalidImportError, parseImportJson } from './import-export';

let repo: RepositoryBundle;
let db: TechLogDexie;

beforeEach(() => {
  db = new TechLogDexie(`test-io-${Math.random()}`);
  repo = createDexieRepository(db);
});
afterEach(() => db.close());

describe('exportAll', () => {
  it('returns valid bundle', async () => {
    const tag = await createTag(repo, { name: 'TS' });
    const a = await addArticle(repo, {
      url: 'https://example.com/a',
      title: 'A',
      tagIds: [tag.id],
    });
    await updateProgress(repo, { articleId: a.id, progress: 50 });
    const bundle = await exportAll(repo);
    expect(bundle.schemaVersion).toBe(1);
    expect(bundle.articles).toHaveLength(1);
    expect(bundle.tags).toHaveLength(1);
    expect(bundle.readingLogs).toHaveLength(1);
  });
});

describe('parseImportJson', () => {
  it('rejects invalid shape', () => {
    expect(() => parseImportJson({ foo: 'bar' })).toThrow(InvalidImportError);
  });
  it('accepts valid shape', () => {
    const now = new Date().toISOString();
    const bundle = parseImportJson({
      schemaVersion: 1,
      exportedAt: now,
      articles: [],
      tags: [],
      readingLogs: [],
    });
    expect(bundle.schemaVersion).toBe(1);
  });
});

describe('importAll replace mode', () => {
  it('wipes existing data then inserts', async () => {
    const t1 = await createTag(repo, { name: 'OLD' });
    await addArticle(repo, { url: 'https://old.com/x', title: 'Old', tagIds: [t1.id] });

    const now = new Date().toISOString();
    const bundle = parseImportJson({
      schemaVersion: 1,
      exportedAt: now,
      articles: [
        {
          id: 'a1',
          url: 'https://new.com/x',
          title: 'New',
          status: 'reading',
          progress: 30,
          memo: '',
          tagIds: [],
          addedAt: now,
          updatedAt: now,
        },
      ],
      tags: [{ id: 't1', name: 'NEW', color: 'blue', createdAt: now }],
      readingLogs: [],
    });
    const r = await importAll(repo, bundle, 'replace');
    expect(r.articles.added).toBe(1);
    expect((await repo.tags.list()).map((t) => t.name)).toEqual(['NEW']);
    expect((await repo.articles.all()).map((a) => a.url)).toEqual(['https://new.com/x']);
  });
});

describe('importAll merge mode', () => {
  it('adds new, keeps existing, dedupes tags by name, remaps tag ids', async () => {
    const existingTag = await createTag(repo, { name: 'TS' });
    const existingArticle = await addArticle(repo, {
      url: 'https://example.com/a',
      title: 'A',
      tagIds: [existingTag.id],
    });

    const now = new Date().toISOString();
    const incomingTag = { id: 'incoming-tag', name: 'ts', color: 'red' as const, createdAt: now };
    const bundle = parseImportJson({
      schemaVersion: 1,
      exportedAt: now,
      articles: [
        {
          id: 'incoming-article',
          url: 'https://example.com/b',
          title: 'B',
          status: 'want',
          progress: 0,
          memo: '',
          tagIds: ['incoming-tag'],
          addedAt: now,
          updatedAt: now,
        },
      ],
      tags: [incomingTag],
      readingLogs: [],
    });
    const r = await importAll(repo, bundle, 'merge');
    expect(r.tags.updated).toBe(1);
    expect(r.articles.added).toBe(1);
    const all = await repo.articles.all();
    const added = all.find((a) => a.url === 'https://example.com/b');
    expect(added?.tagIds).toEqual([existingTag.id]);
    const stillThere = await repo.articles.getById(existingArticle.id);
    expect(stillThere).toBeDefined();
  });

  it('on duplicate URL, keeps newer by updatedAt', async () => {
    const existing = await addArticle(repo, { url: 'https://example.com/a', title: 'Old' });
    const now = new Date(Date.parse(existing.updatedAt) + 10_000).toISOString();
    const bundle = parseImportJson({
      schemaVersion: 1,
      exportedAt: now,
      articles: [
        {
          id: 'other-id',
          url: existing.url,
          title: 'New',
          status: 'done',
          progress: 100,
          memo: '',
          tagIds: [],
          addedAt: existing.addedAt,
          updatedAt: now,
          finishedAt: now,
        },
      ],
      tags: [],
      readingLogs: [],
    });
    const r = await importAll(repo, bundle, 'merge');
    expect(r.articles.updated).toBe(1);
    const after = await repo.articles.getById(existing.id);
    expect(after?.title).toBe('New');
    expect(after?.progress).toBe(100);
  });

  it('skips when incoming is older', async () => {
    const existing = await addArticle(repo, { url: 'https://example.com/a', title: 'Newer' });
    const olderIso = new Date(Date.parse(existing.updatedAt) - 10_000).toISOString();
    const bundle = parseImportJson({
      schemaVersion: 1,
      exportedAt: olderIso,
      articles: [
        {
          id: 'other-id',
          url: existing.url,
          title: 'Older',
          status: 'want',
          progress: 0,
          memo: '',
          tagIds: [],
          addedAt: olderIso,
          updatedAt: olderIso,
        },
      ],
      tags: [],
      readingLogs: [],
    });
    const r = await importAll(repo, bundle, 'merge');
    expect(r.articles.skipped).toBe(1);
    const after = await repo.articles.getById(existing.id);
    expect(after?.title).toBe('Newer');
  });
});
