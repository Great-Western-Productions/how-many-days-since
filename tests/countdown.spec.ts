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
