import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const games = JSON.parse(readFileSync(new URL('../src/data/rivalry-games.json', import.meta.url), 'utf8')) as Array<{ wScore: number; lScore: number }>;

const game2026 = games[0];
const score2026 = `${game2026.wScore}-${game2026.lScore}`;

const capturedEvents = (page: any) => page.evaluate(() => JSON.parse(sessionStorage.getItem('analytics-events') ?? '[]'));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    type AnalyticsWindow = Window & { analyticsEvents: unknown[]; gtag: (...args: unknown[]) => void };
    const analyticsWindow = window as unknown as AnalyticsWindow;
    analyticsWindow.analyticsEvents = JSON.parse(sessionStorage.getItem('analytics-events') ?? '[]');
    analyticsWindow.gtag = (...args: unknown[]) => {
      analyticsWindow.analyticsEvents.push(args);
      sessionStorage.setItem('analytics-events', JSON.stringify(analyticsWindow.analyticsEvents));
    };
  });
});

test.describe('Count', () => {
  test('does not render a rotating image section', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.hero')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /another one/i })).toHaveCount(0);
  });

  test('links to the Rivalry Lab collection and features the commemorative tee', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'MERCH' })).toHaveAttribute(
      'href',
      'https://gwpworkshop.com/collections/rivalry-lab'
    );
    await expect(
      page.getByRole('link', { name: /shop last year's tee/i })
    ).toHaveAttribute(
      'href',
      'https://gwpworkshop.com/products/script-in-the-snow-the-2025-rivalry-game-commemorative-tee'
    );
  });

  test('tracks the featured product and its placement', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /shop last year's tee/i }).click();

    await expect.poll(() => capturedEvents(page)).toContainEqual(['event', 'merch_product_opened', {
      product: 'script-in-the-snow',
      placement: 'home_featured',
    }]);
  });

  test('renders the handoff counter and shared navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Days Since Michigan Beat Ohio State/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('HOW MANY DAYS SINCE');
    const nav = page.getByRole('navigation', { name: 'Site' });
    await expect(nav.getByRole('link')).toHaveCount(6);
    await expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    await expect(nav.getByRole('link', { name: 'COUNTDOWN' })).toHaveAttribute('href', '/countdown/');
    await expect(nav.getByRole('link', { name: 'PREVIEW' })).toHaveAttribute('href', '/preview/');
    await expect(page.locator('[data-live-count]')).toHaveAttribute('data-reference-date', '2024-11-30T17:00:00Z');
  });

  test('answers both directions of the question', async ({ page }) => {
    await page.goto('/');

    // Both directions inside the width a search result shows before it cuts the title.
    const title = await page.title();
    expect(title).toBe('Days Since Michigan Beat Ohio State & Ohio State Beat Michigan');
    expect(title.length).toBeLessThanOrEqual(62);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /days since Michigan beat Ohio State\. \d[\d,]* days since Ohio State beat Michigan\./);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Ohio State Beat Michigan/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('AND HOW MANY DAYS SINCE OHIO STATE BEAT MICHIGAN?');
    await expect(page.getByRole('heading', { level: 2, name: /days since ohio state beat michigan/i })).toBeVisible();
    await expect(page.locator('[data-reverse-count]')).toHaveAttribute('data-reference-date', '2026-11-28T17:00:00Z');
    await expect(page.getByText(`Last Ohio State win: November 28, 2026 - ${score2026}, Columbus.`)).toBeVisible();
  });

  test('counts the reverse side from the last Ohio State win', async ({ page }) => {
    // 7:00 AM Eastern on 2026-12-01. Nov 28 2026 → Dec 1 2026 = 3.
    await page.clock.install({ time: new Date('2026-12-01T12:00:00Z') });
    await page.goto('/');

    await expect(page.locator('#reverse_days_count')).toHaveText('3');
    // Nov 30 2024 → Dec 1 2026.
    await expect(page.locator('#days_count')).toHaveText('731');
  });

  test('publishes a two-question FAQ with the live counts', async ({ page }) => {
    await page.goto('/');

    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = schemas.map((text) => JSON.parse(text)).find((schema) => schema['@type'] === 'FAQPage');
    expect(faq).toBeTruthy();
    expect(faq.mainEntity.map((entry: { name: string }) => entry.name)).toEqual([
      'How many days since Michigan beat Ohio State?',
      'How many days since Ohio State beat Michigan?',
    ]);
    const days = (await page.locator('#days_count').textContent())!.trim();
    const reverseDays = (await page.locator('#reverse_days_count').textContent())!.trim();
    expect(faq.mainEntity[0].acceptedAnswer.text).toContain(`${days} days since Michigan last beat Ohio State. Michigan won 13-10 in Columbus on November 30, 2024.`);
    expect(faq.mainEntity[1].acceptedAnswer.text).toContain(`${reverseDays} days since Ohio State last beat Michigan. Ohio State won ${score2026} in Columbus on November 28, 2026.`);
    expect(schemas.map((text) => JSON.parse(text)['@type'])).toEqual(['WebSite', 'WebPage', 'FAQPage']);
  });

  test('counts Eastern calendar days, not elapsed 24-hour periods', async ({ page }) => {
    // 8:00 AM Eastern on 2026-08-16 — before 1:00 PM, where the old
    // elapsed-time math lagged one behind. Nov 30 2024 → Aug 16 2026 = 624.
    await page.clock.install({ time: new Date('2026-08-16T12:00:00Z') });
    await page.goto('/');

    await expect(page.locator('#days_count')).toHaveText('624');
  });

  test('displays a numeric days count and historical totals', async ({ page }) => {
    await page.goto('/');
    const count = page.locator('.counter strong');
    await expect(count).toBeVisible();
    expect(Number((await count.textContent())?.replaceAll(',', ''))).toBeGreaterThanOrEqual(0);
    await expect(page.getByText('ALL-TIME SERIES (M-OSU-T), 1897-2026')).toBeVisible();
    await expect(page.getByText('NEXT GAME: November 27, 2027 (expected) - Ann Arbor.')).toBeVisible();
  });

  test('keeps the Share ribbon aligned to the content and removes image captions', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(page.locator('figcaption')).toHaveCount(0);
    await expect(page.locator('.featured-merch img')).toHaveAttribute('alt', /.+/);
    await expect(page.getByRole('link', { name: 'Great Western Productions' })).toHaveAttribute(
      'href',
      'https://greatwesternproductions.com'
    );

    const content = await page.locator('.site-main').boundingBox();
    const ribbon = await page.locator('#share-clip').boundingBox();
    expect(content).not.toBeNull();
    expect(ribbon).not.toBeNull();
    expect(ribbon!.x + ribbon!.width).toBeCloseTo(content!.x + content!.width - 40, 0);
  });
});

test.describe('GWA house ad', () => {
  test('shows the GWA Day card under the counter without loading YouTube', async ({ page }) => {
    const youtube: string[] = [];
    page.on('request', (request) => { if (/youtube|ytimg|googlevideo/.test(request.url())) youtube.push(request.url()); });
    await page.goto('/');

    const ad = page.locator('[data-gwa-ad]');
    await expect(ad.getByRole('heading', { name: /rivalries don't stop in late november/i })).toBeVisible();
    await expect(ad.locator('img')).toHaveAttribute('src', '/images/gwa/gwa-day-2026.jpg');
    await expect(ad.locator('iframe')).toHaveCount(0);
    const order = await page.evaluate(() => [...document.querySelectorAll('main > section')].map((section) => section.className.split(' ')[0]));
    expect(order.indexOf('gwa-ad')).toBe(order.indexOf('stat-box') + 1);
    expect(youtube).toEqual([]);
  });

  test('tags the gwawrestling.com link and tracks it', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('[data-gwa-ad]').getByRole('link', { name: /visit gwawrestling\.com/i });
    const href = new URL((await link.getAttribute('href'))!);
    expect(href.origin).toBe('https://www.gwawrestling.com');
    expect(href.searchParams.get('utm_source')).toBe('howmanydayssince');
    expect(href.searchParams.get('utm_campaign')).toBe('gwa_day_2026');

    await page.route('https://www.gwawrestling.com/**', (route) => route.fulfill({ body: 'ok' }));
    await link.click();
    await expect.poll(() => capturedEvents(page)).toContainEqual(['event', 'gwa_site_opened', { placement: 'home_house_ad' }]);
  });

  for (const [trigger, control] of [['poster', 'Play the GWA Day 2026 film'], ['button', 'Watch the film']] as const) {
    test(`loads the film player from the ${trigger} and tracks the play`, async ({ page }) => {
      await page.route(/youtube-nocookie\.com/, (route) => route.fulfill({ contentType: 'text/html', body: '<html></html>' }));
      await page.goto('/');
      const ad = page.locator('[data-gwa-ad]');
      await ad.getByRole('button', { name: control, exact: true }).click();

      await expect(ad.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/LKhoHMmcpkc\?autoplay=1/);
      await expect(ad.locator('img')).toHaveCount(0);
      await expect.poll(() => capturedEvents(page)).toContainEqual(['event', 'gwa_film_played', { placement: 'home_house_ad', trigger }]);
    });
  }
});
