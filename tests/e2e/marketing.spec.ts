import { expect, test } from '@playwright/test';

test('homepage: hero, CTAs, demo board drag, sections and SEO metadata', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('TuneTracker');
  await expect(page).toHaveTitle(/TuneTracker 2\.0/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /TuneTracker/);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);

  for (const id of ['board', 'collaborate', 'community']) await expect(page.locator(`#${id}`)).toBeAttached();
  await expect(page.getByRole('heading', { name: 'From first idea to release.' })).toBeVisible();

  // demo board is interactive
  const card = page.getByRole('button', { name: 'Drag Find a vocal chop' });
  const target = page.getByRole('region', { name: 'Mastered column' });
  const cb = (await card.boundingBox())!;
  const tb = (await target.boundingBox())!;
  await page.mouse.move(cb.x + 20, cb.y + 10);
  await page.mouse.down();
  await page.mouse.move(cb.x + 40, cb.y + 30, { steps: 4 });
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height - 20, { steps: 15 });
  await page.mouse.up();
  await expect(target.getByText('Find a vocal chop')).toBeVisible();

  await page.getByRole('link', { name: 'Learn More' }).click();
  await expect(page).toHaveURL(/#board$/);
  await page.getByRole('link', { name: 'Get Started' }).first().click();
  await expect(page).toHaveURL(/\/signup$/);

  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'About TuneTracker' })).toBeVisible();
  expect(errors, errors.join('\n')).toEqual([]);
});

test('public pages render without hydration or console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  for (const path of ['/', '/about', '/login', '/signup', '/forgot-password']) {
    await page.goto(path, { waitUntil: 'networkidle' });
  }
  expect(errors, errors.join('\n')).toEqual([]);
});
