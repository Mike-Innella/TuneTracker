import { expect, test } from '@playwright/test';
import { createProject, signUpAndConfirm, uniqueUser } from './helpers';

test('mobile: bottom navigation, board column navigation and no horizontal overflow', async ({ page }) => {
  await signUpAndConfirm(page, uniqueUser('mob'));
  const nav = page.getByTestId('mobile-nav');
  await expect(nav).toBeVisible();
  for (const [label, url] of [
    ['Discover', /\/discover$/],
    ['Community', /\/community$/],
    ['Blog', /\/blog$/],
    ['Studio', /\/studio$/],
    ['Home', /\/home$/],
  ] as const) {
    await nav.getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow on ${label}`).toBeLessThanOrEqual(0);
  }

  await createProject(page, 'Phone Session', 'Mixing');
  const colNav = page.getByRole('navigation', { name: 'Columns' });
  await expect(colNav).toBeVisible();
  await colNav.getByRole('link', { name: /Approved/ }).click();
  await expect(page.locator('[data-testid=board-column][data-column-title="Approved"]')).toBeInViewport();

  // touch-friendly accessible move via the task menu
  const col = page.locator('[data-testid=board-column][data-column-title="To mix"]');
  await colNav.getByRole('link', { name: /To mix/ }).click();
  await col.getByRole('button', { name: 'Add task' }).click();
  await col.getByLabel('New task title').fill('Phone task');
  await col.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Move Phone task', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Revisions' }).click();
  await expect(
    page.locator('[data-testid=board-column][data-column-title="Revisions"] [data-task-title="Phone task"]'),
  ).toHaveCount(1);
});
