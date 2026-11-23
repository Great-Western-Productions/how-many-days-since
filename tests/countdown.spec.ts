import { expect, test } from '@playwright/test';

test('publishes the next game countdown with canonical event metadata', async ({ page }) => {
  await page.goto('/countdown/');

  await expect(page).toHaveTitle('Days Until Ohio State vs Michigan 2026: Countdown to The Game');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Live countdown to Ohio State vs Michigan on Saturday, November 28, 2026. Kickoff is noon ET at Ohio Stadium in Columbus.'
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://howmanydayssincemichiganhasbeatenohiostate.com/countdown/'
  );
  await expect(page.getByRole('heading', { name: 'THE GAME', exact: true })).toBeVisible();
  await expect(page.locator('[data-countdown-days]')).toBeVisible();
  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((text) => JSON.parse(text));
  // WebSite describes the site and belongs on the page that is the site.
  expect(schemas.map((schema) => schema['@type'])).toEqual(['WebPage', 'SportsEvent']);
  expect(JSON.stringify(schemas)).toContain('2026-11-28T12:00:00-05:00');
  // The fields Search Console listed as missing from the event, less a ticket offer.
  const event = schemas[1];
  for (const field of ['image', 'endDate', 'description', 'eventStatus', 'organizer', 'performer']) {
    expect(event[field], field).toBeTruthy();
  }
  expect(event.image).toEqual(['https://howmanydayssincemichiganhasbeatenohiostate.com/og/countdown.png']);
  expect(event.location.name).toBe('Ohio Stadium');
});

test('links the home next-game line to the countdown and colors Columbus on hover', async ({ page }) => {
  await page.goto('/');

  const nextGame = page.getByRole('link', { name: /next game: november 28, 2026 - columbus/i });
  await expect(nextGame).toHaveAttribute('href', '/countdown/');
  await expect(nextGame).toHaveClass(/next-game-link/);
});

test.describe('game-day states', () => {
  const visit = async (page: import('@playwright/test').Page, iso: string) => {
    await page.clock.install({ time: new Date(iso) });
    await page.goto('/countdown/');
  };
  const clock = (page: import('@playwright/test').Page) => page.locator('.countdown-clock');

  test('runs the clock with no game-day line before game day', async ({ page }) => {
    await visit(page, '2026-11-25T12:00:00-05:00');

    await expect(clock(page)).toBeVisible();
    await expect(page.getByText(/^GAME DAY ·/)).toBeHidden();
    await expect(page.getByText('IN PROGRESS', { exact: true })).toBeHidden();
  });

  test('keeps the clock under a game-day line on the morning of the game', async ({ page }) => {
    await visit(page, '2026-11-28T09:00:30-05:00');

    await expect(page.getByText('GAME DAY · KICKOFF AT NOON ET')).toBeVisible();
    await expect(clock(page)).toBeVisible();
    await expect(page.locator('[data-countdown-hours]')).toHaveText('02');
    await expect(page.locator('[data-countdown-minutes]')).toHaveText('59');
  });

  test('swaps the clock for an in-progress state at kickoff', async ({ page }) => {
    await visit(page, '2026-11-28T13:30:00-05:00');

    await expect(page.getByText('IN PROGRESS', { exact: true })).toBeVisible();
    await expect(page.getByText('Kickoff was noon ET at Ohio Stadium.', { exact: false })).toBeVisible();
    await expect(clock(page)).toBeHidden();
    await expect(page.getByRole('link', { name: 'Days since Michigan beat Ohio State →' })).toHaveAttribute('href', '/');
    await expect(page.getByRole('link', { name: 'Days since Ohio State beat Michigan →' })).toHaveAttribute(
      'href',
      '/days-since-ohio-state-beat-michigan/'
    );
  });

  test('calls it final four hours after kickoff', async ({ page }) => {
    await visit(page, '2026-11-28T16:30:00-05:00');

    await expect(page.getByText('FINAL', { exact: true })).toBeVisible();
    await expect(page.getByText('IN PROGRESS', { exact: true })).toBeHidden();
    await expect(clock(page)).toBeHidden();
    await expect(page.getByRole('link', { name: 'Days since Michigan beat Ohio State →' })).toBeVisible();
  });

  test('moves from the clock to in progress while the page stays open', async ({ page }) => {
    await visit(page, '2026-11-28T11:59:50-05:00');
    await expect(clock(page)).toBeVisible();

    await page.clock.runFor(15_000);

    await expect(page.getByText('IN PROGRESS', { exact: true })).toBeVisible();
    await expect(clock(page)).toBeHidden();
  });

  test('fits a phone in the final state', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await visit(page, '2026-11-28T16:30:00-05:00');

    await expect(page.getByText('FINAL', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
