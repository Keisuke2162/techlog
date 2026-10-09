import type { RepositoryBundle } from '@/shared/repository/types';
import { TagSchema, type Tag, type TagColor } from '@/features/articles/domain/types';
import { newId } from '@/shared/lib/id';
import { nowIso } from '@/shared/lib/date';

export class DuplicateTagNameError extends Error {
  constructor(public existing: Tag) {
    super('A tag with this name already exists');
    this.name = 'DuplicateTagNameError';
  }
}

export async function createTag(
  repo: RepositoryBundle,
  input: { name: string; color?: TagColor },
  now: Date = new Date(),
): Promise<Tag> {
  const name = input.name.trim();
  if (!name) throw new Error('Tag name is required');
  const existing = await repo.tags.findByName(name);
  if (existing) throw new DuplicateTagNameError(existing);
  const tag = TagSchema.parse({
    id: newId(),
    name,
    color: input.color ?? 'slate',
    createdAt: nowIso(now),
  });
  return repo.tags.create(tag);
}

export async function updateTag(
  repo: RepositoryBundle,
  input: { id: string; name?: string; color?: TagColor },
): Promise<Tag> {
  const current = await repo.tags.getById(input.id);
  if (!current) throw new Error(`Tag ${input.id} not found`);
  let name = current.name;
  if (input.name !== undefined) {
    name = input.name.trim();
    if (!name) throw new Error('Tag name is required');
    if (name.toLocaleLowerCase() !== current.name.toLocaleLowerCase()) {
      const existing = await repo.tags.findByName(name);
      if (existing && existing.id !== current.id) throw new DuplicateTagNameError(existing);
    }
  }
  const patch: Partial<Tag> = { name };
  if (input.color) patch.color = input.color;
  return repo.tags.update(input.id, patch);
}

export async function deleteTag(repo: RepositoryBundle, id: string): Promise<void> {
  const articles = await repo.articles.all();
  const affected = articles.filter((a) => a.tagIds.includes(id));
  for (const article of affected) {
    await repo.articles.update(article.id, {
      tagIds: article.tagIds.filter((t) => t !== id),
      updatedAt: nowIso(),
    });
  }
  await repo.tags.delete(id);
}

export async function mergeTag(
  repo: RepositoryBundle,
  input: { fromId: string; intoId: string },
): Promise<void> {
  if (input.fromId === input.intoId) return;
  const target = await repo.tags.getById(input.intoId);
  if (!target) throw new Error(`Target tag ${input.intoId} not found`);
  const articles = await repo.articles.all();
  for (const article of articles) {
    if (!article.tagIds.includes(input.fromId)) continue;
    const next = Array.from(
      new Set(article.tagIds.map((t) => (t === input.fromId ? input.intoId : t))),
    );
    await repo.articles.update(article.id, { tagIds: next, updatedAt: nowIso() });
  }
  await repo.tags.delete(input.fromId);
}
