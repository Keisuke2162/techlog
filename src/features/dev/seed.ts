import type { RepositoryBundle } from '@/shared/repository/types';
import { newId } from '@/shared/lib/id';
import {
  nowIso,
  todayDateString,
  parseLocalDate,
  addDays,
  toLocalDateString,
} from '@/shared/lib/date';
import type { Article, ReadingLog, Tag, TagColor } from '@/features/articles/domain/types';

const TAG_SEED: Array<{ name: string; color: TagColor }> = [
  { name: 'TypeScript', color: 'blue' },
  { name: 'Rust', color: 'orange' },
  { name: 'React', color: 'cyan' },
  { name: 'Database', color: 'emerald' },
  { name: 'DevOps', color: 'violet' },
  { name: 'Security', color: 'red' },
  { name: 'Architecture', color: 'amber' },
  { name: 'Testing', color: 'pink' },
];

const SITES = [
  { host: 'engineering.linecorp.com', name: 'LINE Engineering' },
  { host: 'developers.freee.co.jp', name: 'freee Developers Hub' },
  { host: 'tech.mercari.com', name: 'Mercari Engineering' },
  { host: 'rust-lang.org', name: 'The Rust Blog' },
  { host: 'blog.cloudflare.com', name: 'Cloudflare Blog' },
  { host: 'web.dev', name: 'web.dev' },
  { host: 'www.notion.so', name: 'Notion' },
  { host: 'martinfowler.com', name: 'martinfowler.com' },
];

const TITLES = [
  'TypeScript の型レベルプログラミング入門',
  'Rust の所有権と借用を図解する',
  'React 19 の新機能まとめ',
  'IndexedDB の実践的な使い方',
  'OWASP Top 10 2024 を読み解く',
  '優れた API 設計の 10 の原則',
  '継続的デリバリーをシンプルに保つ',
  'テストピラミッドではなくテストハニカム',
  'なぜ強い静的型付けを選ぶのか',
  'クリーンアーキテクチャ再考',
];

export interface SeedOptions {
  articles?: number;
  weeks?: number;
  now?: Date;
}

function pick<T>(arr: readonly T[], seed: number): T {
  const item = arr[Math.abs(seed) % arr.length];
  if (item === undefined) throw new Error('empty array');
  return item;
}

export async function seedDemoData(
  repo: RepositoryBundle,
  { articles: articleCount = 30, weeks = 20, now = new Date() }: SeedOptions = {},
): Promise<{ articles: number; tags: number; logs: number }> {
  const existingArticles = await repo.articles.count();
  if (existingArticles > 0) {
    throw new Error('Articles already exist; refusing to seed');
  }

  const nowIsoString = nowIso(now);
  const tags: Tag[] = TAG_SEED.map((t) => ({
    id: newId(),
    name: t.name,
    color: t.color,
    createdAt: nowIsoString,
  }));
  await repo.tags.bulkPut(tags);

  const articles: Article[] = [];
  const logs: ReadingLog[] = [];
  const today = parseLocalDate(todayDateString(now));

  for (let i = 0; i < articleCount; i += 1) {
    const site = pick(SITES, i);
    const title = `${pick(TITLES, i)} (${i + 1})`;
    const tagCount = 1 + (i % 3);
    const chosenTags = tags
      .slice()
      .sort((a, b) => (a.name + i).localeCompare(b.name + i))
      .slice(0, tagCount);
    const progress = (i * 17) % 101;
    const status = progress === 0 ? 'want' : progress >= 100 ? 'done' : 'reading';
    const addedAt = toLocalDateString(addDays(today, -((i * 3) % (weeks * 7))));
    const article: Article = {
      id: newId(),
      url: `https://${site.host}/${slugify(title)}-${i}`,
      title,
      siteName: site.name,
      status,
      progress: status === 'done' ? 100 : progress,
      memo: `## 要約\nこれは ${title} のメモです。\n\n- ポイント A\n- ポイント B\n`,
      tagIds: chosenTags.map((t) => t.id),
      addedAt: `${addedAt}T09:00:00.000Z`,
      finishedAt: status === 'done' ? nowIsoString : undefined,
      lastReadAt: status === 'want' ? undefined : nowIsoString,
      updatedAt: nowIsoString,
    };
    articles.push(article);
  }
  await repo.articles.bulkPut(articles);

  // Logs across the past N weeks
  const totalDays = weeks * 7;
  for (let d = 0; d < totalDays; d += 1) {
    const date = toLocalDateString(addDays(today, -d));
    // ~70% chance of activity
    if ((d * 7919) % 10 >= 7) continue;
    const n = 1 + (d % 3);
    for (let k = 0; k < n; k += 1) {
      const article = pick(articles, d * 13 + k);
      const from = (d * 11 + k * 17) % 90;
      const delta = 5 + ((d + k) % 50);
      const to = Math.min(100, from + delta);
      logs.push({
        id: newId(),
        articleId: article.id,
        readOn: date,
        progressFrom: from,
        progressTo: to,
        createdAt: `${date}T20:00:00.000Z`,
      });
    }
  }
  await repo.readingLogs.bulkPut(logs);

  return { articles: articles.length, tags: tags.length, logs: logs.length };
}

function slugify(s: string): string {
  return s
    .toLocaleLowerCase()
    .replace(/[^\w぀-ヿ一-鿿]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 40);
}
