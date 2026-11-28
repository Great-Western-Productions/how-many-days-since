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

test('keeps the banner inside a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
