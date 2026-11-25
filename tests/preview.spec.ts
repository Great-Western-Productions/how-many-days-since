import { expect, test } from '@playwright/test';

const BANDS = ['scoring', 'rushing', 'passing', 'third-down', 'red-zone', 'turnovers', 'first-downs'];

test('publishes the game preview with its own title, description and canonical', async ({ page }) => {
  await page.goto('/preview/');

  await expect(page).toHaveTitle(/^Ohio State vs Michigan \d{4} Preview: Tale of the Tape$/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /^(Ohio State|Michigan) \(\d+-\d+\) hosts (Ohio State|Michigan) \(\d+-\d+\) on Saturday, November \d+, \d{4}\. /
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://howmanydayssincemichiganhasbeatenohiostate.com/preview/'
  );
  await expect(page.getByRole('heading', { level: 1, name: 'THE PREVIEW' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'PREVIEW' })).toHaveAttribute('aria-current', 'page');
});

test('shows both records entering the game', async ({ page }) => {
  await page.goto('/preview/');

  for (const team of ['ohio-state', 'michigan']) {
    await expect(page.locator(`.teams [data-team="${team}"] strong`)).toHaveText(/^\d+-\d+(-\d+)?$/);
  }
});

test('lays out the tape: seven bands, both matchups, an edge and its history', async ({ page }) => {
  await page.goto('/preview/');

  await expect(page.getByRole('heading', { name: 'TALE OF THE TAPE' })).toBeVisible();
  for (const band of BANDS) {
    const article = page.locator(`[data-band="${band}"]`);
    await expect(article.locator('.band-row'), band).toHaveCount(2);
    await expect(article.locator('.band-row').first(), band).toContainText('Ohio State offense vs Michigan defense');
    await expect(article.locator('.band-row').last(), band).toContainText('Michigan offense vs Ohio State defense');
    await expect(article.locator('[data-edge]'), band).toHaveText(/^EDGE: (OHIO STATE|MICHIGAN) \+[\d.]+ |^EDGE: EVEN$/);
    await expect(article.locator('[data-history]'), band).toHaveText(/^EDGE HOLDER WON \d+ OF \d+ SINCE 2004/);
  }
  // Scores reach back further than box scores, so scoring carries both counts.
  await expect(page.locator('[data-band="scoring"] [data-history]')).toHaveText(/SINCE 2004 · \d+ OF \d+ SINCE 1970$/);
  await expect(page.locator('[data-band="home-field"] [data-history]')).toHaveText(/^HOME TEAM WON \d+ OF \d+ SINCE 2004 · \d+ OF \d+ SINCE 1970$/);
  await expect(page.getByTestId('tape-summary')).toContainText(/The team holding more edges has won \d+ of \d+ since 2004\./);
});

test('links the closest past meetings to their record pages', async ({ page }) => {
  await page.goto('/preview/');

  await expect(page.getByRole('heading', { level: 2, name: 'CLOSEST MATCHUPS' })).toBeVisible();
  // The section says what it compares before it lists the meetings.
  await expect(page.getByTestId('twins-summary')).toHaveText(
    /^A matchup is how the two teams came in: each team's record, its points scored and allowed per game, and the site\. These are the 3 past meetings nearest this year's on those numbers\. \S/
  );
  const twins = page.locator('.twin');
  await expect(twins).toHaveCount(3);
  const first = twins.first();
  const season = (await first.locator('strong').textContent())!.trim();
  await expect(first).toHaveAttribute('href', `/record/${season}/`);
  await expect(first).toContainText(/OHIO STATE \d+-\d+.* · MICHIGAN \d+-\d+.* · (COLUMBUS|ANN ARBOR)/);

  await first.click();
  await expect(page).toHaveURL(new RegExp(`/record/${season}/$`));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('pairs the results against common opponents', async ({ page }) => {
  await page.goto('/preview/');

  const table = page.locator('table.common');
  await expect(table.locator('thead th')).toHaveText(['OPPONENT', 'OHIO STATE', 'MICHIGAN']);
  const rows = table.locator('tbody tr:not(.average)');
  expect(await rows.count()).toBeGreaterThan(0);
  await expect(rows.first().locator('td').first()).toHaveText(/^[WLT] \d+-\d+ (HOME|AWAY|NEUTRAL)$/);
  await expect(table.locator('tr.average td')).toHaveText([/^[+-]?\d+\.\d$/, /^[+-]?\d+\.\d$/]);
});

test('fits a phone without scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto('/preview/');

  await expect(page.locator('[data-band="scoring"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
