import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { createProject, signUpAndConfirm, uniqueUser } from './helpers';

/** WCAG 2.2 A/AA rules; every violation is reported with its page, theme and offending nodes. */
async function audit(page: Page, label: string) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return r.violations.map(
    (v) =>
      `${label}: [${v.impact}] ${v.id} — ${v.help}\n    ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join('\n    ')}`,
  );
}

async function sweep(page: Page, paths: string[]) {
  const failures: string[] = [];
  for (const theme of ['dark', 'light']) {
    await page.evaluate((t) => localStorage.setItem('theme', t), theme);
    for (const path of paths) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      failures.push(...(await audit(page, `${theme} ${path}`)));
    }
  }
  return failures;
}

test('accessibility: public pages pass axe (WCAG 2.2 AA) in both themes', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/');
  const failures = await sweep(page, [
    '/',
    '/about',
    '/login',
    '/signup',
    '/forgot-password',
    '/home',
    '/discover',
    '/blog',
  ]);
  expect(failures, failures.join('\n')).toEqual([]);
});

test('accessibility: signed-in pages pass axe (WCAG 2.2 AA) in both themes', async ({ page }) => {
  test.setTimeout(240_000);
  await signUpAndConfirm(page, uniqueUser('a11y'));
  await createProject(page, 'Accessible Album', 'Release');
  const board = new URL(page.url()).pathname;
  const failures = await sweep(page, [
    '/home',
    '/studio',
    '/studio/upload',
    '/studio/analytics',
    '/studio/articles/new',
    '/projects',
    board,
    board.replace(/\/board$/, ''),
    '/community',
    '/community/new',
    '/profile',
    '/settings',
  ]);
  expect(failures, failures.join('\n')).toEqual([]);
});
