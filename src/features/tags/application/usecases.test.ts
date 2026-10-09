import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TechLogDexie } from '@/features/articles/infrastructure/db';
import { createDexieRepository } from '@/features/articles/infrastructure/dexie-repository';
import { addArticle, updateArticle } from '@/features/articles/application/usecases';
import type { RepositoryBundle } from '@/shared/repository/types';
import { createTag, deleteTag, DuplicateTagNameError, mergeTag, updateTag } from './usecases';

let repo: RepositoryBundle;
let db: TechLogDexie;

beforeEach(() => {
  db = new TechLogDexie(`test-tags-${Math.random()}`);
  repo = createDexieRepository(db);
});

afterEach(() => {
  db.close();
});

describe('createTag', () => {
  it('creates a tag', async () => {
    const tag = await createTag(repo, { name: 'TypeScript', color: 'blue' });
    expect(tag.name).toBe('TypeScript');
    expect(tag.color).toBe('blue');
  });

  it('rejects duplicate (case-insensitive)', async () => {
    await createTag(repo, { name: 'TypeScript' });
    await expect(createTag(repo, { name: 'typescript' })).rejects.toBeInstanceOf(
      DuplicateTagNameError,
    );
  });

  it('requires a non-empty name', async () => {
    await expect(createTag(repo, { name: '  ' })).rejects.toThrow();
  });
});

describe('updateTag', () => {
  it('updates name and color', async () => {
    const t = await createTag(repo, { name: 'Rust' });
    const u = await updateTag(repo, { id: t.id, name: 'Rust lang', color: 'red' });
    expect(u.name).toBe('Rust lang');
    expect(u.color).toBe('red');
  });

  it('rejects name collision with another tag', async () => {
    const a = await createTag(repo, { name: 'A' });
    await createTag(repo, { name: 'B' });
    await expect(updateTag(repo, { id: a.id, name: 'B' })).rejects.toBeInstanceOf(
      DuplicateTagNameError,
    );
  });
});

describe('deleteTag', () => {
  it('removes tag id from articles', async () => {
    const t = await createTag(repo, { name: 'X' });
    const a = await addArticle(repo, { url: 'https://example.com/x', title: 'X', tagIds: [t.id] });
    await deleteTag(repo, t.id);
    const after = await repo.articles.getById(a.id);
    expect(after?.tagIds).toEqual([]);
  });
});

describe('mergeTag', () => {
  it('moves articles from fromTag to intoTag and removes fromTag', async () => {
    const from = await createTag(repo, { name: 'Old' });
    const into = await createTag(repo, { name: 'New' });
    const article = await addArticle(repo, {
      url: 'https://example.com/x',
      title: 'X',
      tagIds: [from.id],
    });
    await mergeTag(repo, { fromId: from.id, intoId: into.id });
    const updated = await repo.articles.getById(article.id);
    expect(updated?.tagIds).toContain(into.id);
    expect(updated?.tagIds).not.toContain(from.id);
    expect(await repo.tags.getById(from.id)).toBeUndefined();
  });

  it('no-op when merging into same tag', async () => {
    const t = await createTag(repo, { name: 'X' });
    await mergeTag(repo, { fromId: t.id, intoId: t.id });
    expect(await repo.tags.getById(t.id)).toBeDefined();
  });

  it('deduplicates when target already has the tag', async () => {
    const from = await createTag(repo, { name: 'Old' });
    const into = await createTag(repo, { name: 'New' });
    const a = await addArticle(repo, {
      url: 'https://example.com/x',
      title: 'X',
      tagIds: [from.id, into.id],
    });
    await mergeTag(repo, { fromId: from.id, intoId: into.id });
    const u = await repo.articles.getById(a.id);
    expect(u?.tagIds).toEqual([into.id]);
  });

  it('uses updateArticle for change tracking', async () => {
    const a = await addArticle(repo, { url: 'https://example.com/a', title: 'A' });
    const b = await updateArticle(repo, { id: a.id, title: 'A2' });
    expect(b.title).toBe('A2');
  });
});
