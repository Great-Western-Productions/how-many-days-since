import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Game = { year: number; date: string; winner: string; wScore: number; lScore: number };
const games = JSON.parse(readFileSync(new URL('../src/data/rivalry-games.json', import.meta.url), 'utf8')) as Game[];
const latest = games[0];

// The server decides on its own clock whether the result is still fresh, so
// the expectation is worked out on the same clock: noon Eastern on game day,
// then seven Eastern calendar days.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const [month, day] = latest.date.split(' ');
const gameDay = Date.UTC(latest.year, MONTHS.indexOf(month), Number(day));
const easternDay = (date: Date) => {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(date).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const daysSince = (easternDay(new Date()) - gameDay) / 86_400_000;
const fresh = Date.now() >= gameDay + 17 * 3_600_000 && daysSince <= 7;
const headline = `${latest.winner.toUpperCase()} WINS THE GAME, ${latest.wScore}-${latest.lScore}`;

for (const path of ['/', '/countdown/', '/days-since-ohio-state-beat-michigan/', '/record/']) {
  test(`announces the latest result on ${path} while it is fresh`, async ({ page }) => {
    await page.goto(path);
    const banner = page.locator('[data-result-banner]');
    if (!fresh) {
      await expect(banner).toHaveCount(0);
      return;
    }
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(headline);
    await expect(banner).toContainText('FINAL');
    await expect(banner).toHaveAttribute('href', `/record/${latest.year}/`);
  });
}

// The archive pages are prerendered, so a banner built during the window is
// still in their HTML afterwards and the page takes it down on load.
for (const path of [`/record/${latest.year}/`, '/']) {
  test(`takes the banner down in the browser on ${path} once the window has passed`, async ({ page }) => {
    test.skip(!fresh, 'the server no longer renders the banner');
    await page.clock.install({ time: new Date(gameDay + 9 * 86_400_000) });
    await page.goto(path);
    await expect(page.locator('[data-result-banner]')).toBeHidden();
    await expect(page.locator('[data-result-banner]')).toHaveCount(1);
  });
}

test('keeps the banner on a prerendered archive page while the result is fresh', async ({ page }) => {
  test.skip(!fresh, 'the server no longer renders the banner');
  await page.goto(`/record/${latest.year}/`);
  await expect(page.locator('[data-result-banner]')).toBeVisible();
});

test('keeps the banner inside a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
