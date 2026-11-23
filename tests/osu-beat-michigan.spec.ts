import { test, expect } from '@playwright/test';

const PATH = '/days-since-ohio-state-beat-michigan/';

test.describe('Days since Ohio State beat Michigan', () => {
  test('leads with the Ohio State question in the title, heading and description', async ({ page }) => {
    await page.goto(PATH);

    const title = await page.title();
    expect(title).toBe('How Many Days Since Ohio State Beat Michigan?');
    expect(title.length).toBeLessThanOrEqual(62);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('HOW MANY DAYS SINCE OHIO STATE BEAT MICHIGAN?');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /^\d[\d,]* days? since Ohio State beat Michigan\. OSU last won 27-9 in Ann Arbor on November 29, 2025\./
    );
  });

  test('counts Eastern calendar days from the last Ohio State win', async ({ page }) => {
    // 8:00 AM Eastern on 2026-08-16. Nov 29 2025 → Aug 16 2026 = 260.
    await page.clock.install({ time: new Date('2026-08-16T12:00:00Z') });
    await page.goto(PATH);

    await expect(page.locator('[data-osu-count]')).toHaveAttribute('data-reference-date', '2025-11-29T17:00:00Z');
    await expect(page.locator('#osu_days_count')).toHaveText('260');
    await expect(page.getByText('Last Ohio State win: November 29, 2025 - 27-9, Ann Arbor.')).toBeVisible();
  });

  test('answers the OSU phrasing and links back to the Michigan count', async ({ page }) => {
    await page.goto(PATH);

    await expect(page.getByRole('heading', { level: 2, name: 'How many days since OSU beat Michigan?' })).toBeVisible();
    await expect(page.getByRole('link', { name: /days since michigan beat ohio state/i })).toHaveAttribute('href', '/');
    await expect(page.getByRole('link', { name: /next game/i })).toHaveAttribute('href', '/countdown/');
  });

  test('publishes an FAQ whose answers match the live count', async ({ page }) => {
    await page.goto(PATH);

    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = schemas.map((text) => JSON.parse(text));
    expect(parsed.map((schema) => schema['@type'])).toEqual(['WebPage', 'FAQPage']);

    const faq = parsed.find((schema) => schema['@type'] === 'FAQPage');
    expect(faq.mainEntity.map((entry: { name: string }) => entry.name)).toEqual([
      'How many days since Ohio State beat Michigan?',
      'How many days since OSU beat Michigan?',
      'When did Ohio State last beat Michigan?',
    ]);
    const days = (await page.locator('#osu_days_count').textContent())!.trim();
    expect(faq.mainEntity[0].acceptedAnswer.text).toContain(`${days} days since Ohio State last beat Michigan. Ohio State won 27-9 in Ann Arbor on November 29, 2025.`);
    expect(faq.mainEntity[2].acceptedAnswer.text).toContain('November 29, 2025');
  });
});

test('links to the Ohio State count from the home page', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-reverse-count]').getByRole('link', { name: /ohio state count/i })).toHaveAttribute('href', PATH);
});
