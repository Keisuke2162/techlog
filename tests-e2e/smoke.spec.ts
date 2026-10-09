import { test, expect } from '@playwright/test';

test.describe('TechLog smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/articles');
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const databases = indexedDB.databases ? indexedDB.databases() : Promise.resolve([]);
          Promise.resolve(databases).then((dbs) => {
            if (!Array.isArray(dbs)) {
              const req = indexedDB.deleteDatabase('techlog-db');
              req.onsuccess = () => resolve();
              req.onerror = () => resolve();
              req.onblocked = () => resolve();
              return;
            }
            let remaining = dbs.length;
            if (remaining === 0) {
              resolve();
              return;
            }
            for (const d of dbs) {
              if (!d.name) {
                remaining -= 1;
                if (remaining === 0) resolve();
                continue;
              }
              const req = indexedDB.deleteDatabase(d.name);
              const done = () => {
                remaining -= 1;
                if (remaining === 0) resolve();
              };
              req.onsuccess = done;
              req.onerror = done;
              req.onblocked = done;
            }
          });
        }),
    );
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('add article → appears in list', async ({ page }) => {
    await page.goto('/articles/new');
    await page.getByLabel('URL').fill('https://example.com/post-1');
    await page.getByLabel('タイトル').fill('最初の技術ブログ');
    await page.getByRole('button', { name: '追加', exact: true }).click();
    await expect(page.getByRole('heading', { name: '最初の技術ブログ' })).toBeVisible({
      timeout: 10_000,
    });
    await page.goto('/articles');
    await expect(page.getByText('最初の技術ブログ')).toBeVisible();
  });

  test('markReadToday → log recorded', async ({ page }) => {
    await page.goto('/articles/new');
    await page.getByLabel('URL').fill('https://example.com/post-2');
    await page.getByLabel('タイトル').fill('ログテスト');
    await page.getByRole('button', { name: '追加', exact: true }).click();

    await page.getByRole('heading', { name: 'ログテスト' }).waitFor();
    await page.getByRole('button', { name: '今日読んだ' }).click();
    await expect(page.getByText(/継続/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('duplicate URL rejected on submit', async ({ page }) => {
    await page.goto('/articles/new');
    await page.getByLabel('URL').fill('https://example.com/dup');
    await page.getByLabel('タイトル').fill('最初');
    await page.getByRole('button', { name: '追加', exact: true }).click();
    await page.waitForURL(/\/articles\/[0-9a-f]{8}-/, { timeout: 10_000 });

    await page.goto('/articles/new');
    await page.getByLabel('URL').fill('https://example.com/dup');
    await page.getByLabel('タイトル').fill('二度目');
    await page.getByRole('button', { name: '追加', exact: true }).click();
    await expect(page.getByText(/既に同じ URL の記事が登録されています/)).toBeVisible({
      timeout: 10_000,
    });
    expect(page.url()).toContain('/articles/new');
  });

  test('URL input auto-fills title via /api/fetch-title', async ({ page }) => {
    await page.route('**/api/fetch-title**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'モックされたタイトル', siteName: 'Mock Site' }),
      });
    });
    await page.goto('/articles/new');
    await page.getByLabel('URL').fill('https://example.com/mock');
    await expect(page.getByLabel('タイトル')).toHaveValue('モックされたタイトル', {
      timeout: 10_000,
    });
    await expect(page.getByLabel('サイト名 (任意)')).toHaveValue('Mock Site');
  });

  test('user-typed title is not overwritten by auto-fetch', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/fetch-title**', async (route) => {
      callCount += 1;
      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ title: '上書きしてはいけない', siteName: '' }),
      });
    });
    await page.goto('/articles/new');
    await page.getByLabel('タイトル').fill('手入力タイトル');
    await page.getByLabel('URL').fill('https://example.com/no-override');
    await page.waitForTimeout(1500);
    await expect(page.getByLabel('タイトル')).toHaveValue('手入力タイトル');
    expect(callCount).toBeGreaterThan(0);
  });

  test('dashboard renders and nav works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /今日もひとつ/ })).toBeVisible();
    await page.getByRole('link', { name: /^タグ/ }).first().click();
    await expect(page.getByRole('heading', { name: 'タグ管理' })).toBeVisible();
  });
});
