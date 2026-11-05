import { expect, test } from '@playwright/test';
import { createProject, signUpAndConfirm, uniqueUser } from './helpers';

const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 844, height: 390 }, // short landscape phone
];

test('no horizontal overflow and navigation reachable at every directive breakpoint', async ({ page }) => {
  test.setTimeout(180_000);
  await signUpAndConfirm(page, uniqueUser('resp'));
  await createProject(page, 'Responsive Check', 'Release');
  const board = new URL(page.url()).pathname;
  const pages = [
    '/home',
    '/discover',
    '/studio',
    '/studio/upload',
    '/projects',
    board,
    board.replace(/\/board$/, ''),
    '/community',
    '/community/new',
    '/profile',
    '/settings',
  ];
  const failures: string[] = [];

  for (const vp of VIEWPORTS) {
    await page.setViewportSize(vp);
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // the board scrolls horizontally inside its own container by design; the page must not
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) failures.push(`${vp.width}x${vp.height} ${path}: page overflows by ${overflow}px`);
      const nav =
        vp.width >= 1024
          ? page.getByRole('complementary').getByRole('navigation', { name: 'Main' })
          : page.getByTestId('mobile-nav');
      if (!(await nav.isVisible()))
        failures.push(`${vp.width}x${vp.height} ${path}: main navigation not visible`);
    }
  }
  await page.context().clearCookies();
  for (const vp of VIEWPORTS) {
    await page.setViewportSize(vp);
    for (const path of ['/', '/about', '/login', '/signup']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) failures.push(`${vp.width}x${vp.height} ${path}: page overflows by ${overflow}px`);
    }
  }
  expect(failures, failures.join('\n')).toEqual([]);
});
