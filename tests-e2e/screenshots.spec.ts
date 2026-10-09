import { test } from '@playwright/test';

const widths: Array<{ name: string; width: number; height: number }> = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1280, height: 800 },
];

const routes = [
  { path: '/', label: 'dashboard' },
  { path: '/articles', label: 'articles' },
  { path: '/articles/new', label: 'articles-new' },
  { path: '/tags', label: 'tags' },
  { path: '/settings', label: 'settings' },
];

test.describe('Screenshots', () => {
  for (const w of widths) {
    for (const route of routes) {
      test(`${w.name} - ${route.label}`, async ({ page }) => {
        await page.setViewportSize({ width: w.width, height: w.height });
        await page.goto('/articles');
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              const req = indexedDB.deleteDatabase('techlog-db');
              req.onsuccess = () => resolve();
              req.onerror = () => resolve();
              req.onblocked = () => resolve();
            }),
        );
        await page.reload();
        await page.waitForLoadState('networkidle');
        if (route.path === '/') {
          // Seed some data to make dashboard interesting
          await page.goto('/settings');
          await page.getByRole('button', { name: /デモデータ \(30 件\)/ }).click();
          await page.waitForTimeout(500);
        }
        await page.goto(route.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300);
        await page.screenshot({
          path: `screenshots/${w.name}-${route.label}.png`,
          fullPage: true,
        });
      });
    }
  }
});
