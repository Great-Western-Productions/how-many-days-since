import { expect, test, type Page } from '@playwright/test';
import { nextRivalryGame } from '../src/lib/next-rivalry-game';

test('counts down to the expected 2027 date and publishes no event for it', async ({ page }) => {
  await page.goto('/countdown/');

  await expect(page).toHaveTitle('Days Until Ohio State vs Michigan 2027: Countdown to The Game');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Live countdown to Ohio State vs Michigan, expected on Saturday, November 27, 2027, at Michigan Stadium in Ann Arbor. Kickoff is noon ET. The Big Ten has not announced the date.'
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://howmanydayssincemichiganhasbeatenohiostate.com/countdown/'
  );
  await expect(page.getByRole('heading', { name: 'THE GAME', exact: true })).toBeVisible();
  await expect(page.locator('[data-countdown-days]')).toBeVisible();
  await expect(page.getByText('NOVEMBER 27, 2027 (EXPECTED) · NOON ET · ANN ARBOR')).toBeVisible();
  await expect(page.getByText('The Big Ten has not announced the date.', { exact: false })).toBeVisible();
  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((text) => JSON.parse(text));
  // No SportsEvent until the date is announced; WebSite belongs on the home page.
  expect(schemas.map((schema) => schema['@type'])).toEqual(['WebPage']);
});

test('links the home next-game line to the countdown and colors Ann Arbor for the host', async ({ page }) => {
  await page.goto('/');

  const nextGame = page.getByRole('link', { name: /next game: november 27, 2027 \(expected\) - ann arbor/i });
  await expect(nextGame).toHaveAttribute('href', '/countdown/');
  await expect(nextGame).toHaveClass(/next-game-link/);
  await expect(nextGame.locator('span')).toHaveClass(/mich/);
});

/**
 * Times are offsets from the kickoff in the live next-game record, so these
 * tests keep describing the states after the record moves to the next season.
 */
const KICKOFF = new Date(nextRivalryGame.start).getTime();
const HOUR = 60 * 60 * 1_000;
const kickoffSet = !/TBA/.test(nextRivalryGame.time);

test.describe('game-day states', () => {
  const visit = async (page: Page, offsetMs: number) => {
    await page.clock.install({ time: new Date(KICKOFF + offsetMs) });
    await page.goto('/countdown/');
  };
  const clock = (page: Page) => page.locator('.countdown-clock');

  test('runs the clock with no game-day line before game day', async ({ page }) => {
    await visit(page, -3 * 24 * HOUR);

    await expect(clock(page)).toBeVisible();
    await expect(page.getByText(/^GAME DAY/)).toBeHidden();
    await expect(page.getByText('IN PROGRESS', { exact: true })).toBeHidden();
  });

  test('keeps the clock under a game-day line on the morning of the game', async ({ page }) => {
    await visit(page, -3 * HOUR + 30_000);

    const line = kickoffSet ? `GAME DAY · KICKOFF AT ${nextRivalryGame.time.toUpperCase()}` : 'GAME DAY';
    await expect(page.getByText(line, { exact: true })).toBeVisible();
    await expect(clock(page)).toBeVisible();
    await expect(page.locator('[data-countdown-hours]')).toHaveText('02');
    await expect(page.locator('[data-countdown-minutes]')).toHaveText('59');
  });

  test('swaps the clock for an in-progress state at kickoff', async ({ page }) => {
    await visit(page, 1.5 * HOUR);

    await expect(page.getByText('IN PROGRESS', { exact: true })).toBeVisible();
    await expect(page.getByText(`at ${nextRivalryGame.venue.name}.`, { exact: false })).toBeVisible();
    await expect(clock(page)).toBeHidden();
    await expect(page.getByRole('link', { name: 'Days since Michigan beat Ohio State →' })).toHaveAttribute('href', '/');
    await expect(page.getByRole('link', { name: 'Days since Ohio State beat Michigan →' })).toHaveAttribute(
      'href',
      '/days-since-ohio-state-beat-michigan/'
    );
  });

  test('calls it final four hours after kickoff', async ({ page }) => {
    await visit(page, 4.5 * HOUR);

    await expect(page.getByText('FINAL', { exact: true })).toBeVisible();
    await expect(page.getByText('IN PROGRESS', { exact: true })).toBeHidden();
    await expect(clock(page)).toBeHidden();
    await expect(page.getByRole('link', { name: 'Days since Michigan beat Ohio State →' })).toBeVisible();
  });

  test('moves from the clock to in progress while the page stays open', async ({ page }) => {
    await visit(page, -10_000);
    await expect(clock(page)).toBeVisible();

    await page.clock.runFor(15_000);

    await expect(page.getByText('IN PROGRESS', { exact: true })).toBeVisible();
    await expect(clock(page)).toBeHidden();
  });

  test('fits a phone in the final state', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await visit(page, 4.5 * HOUR);

    await expect(page.getByText('FINAL', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
