import { execSync } from 'node:child_process';
import { test } from '@playwright/test';
import { createProject, signUpAndConfirm, uniqueUser } from './helpers';

// Visual review capture, only runs when CAPTURE_DIR is set.
test.skip(!process.env.CAPTURE_DIR, 'capture only');
const dir = process.env.CAPTURE_DIR!;

test('capture', async ({ page }) => {
  test.setTimeout(180_000);
  const user = await signUpAndConfirm(page, uniqueUser('vis'));
  execSync('npm run db:seed', { env: { ...process.env, SEED_USERNAME: user.username }, stdio: 'ignore' });
  await createProject(page, 'Midnight Drive', 'Production');
  const add = async (col: string, t: string) => {
    const c = page.locator(`[data-testid=board-column][data-column-title="${col}"]`);
    const input = c.getByLabel('New task title');
    if (!(await input.isVisible())) await c.getByRole('button', { name: 'Add task' }).click();
    await input.fill(t);
    await c.getByRole('button', { name: 'Add', exact: true }).click();
    await page.locator(`[data-task-title="${t}"]`).waitFor();
  };
  for (const t of ['Chord progression in F#m', 'Find a vocal sample']) await add('Ideas', t);
  for (const t of ['Bassline with sidechain', 'Drum groove — 124 BPM']) await add('Drafting', t);
  await add('Arrangement', 'Build the second drop');
  await add('Done', 'Reference track list');
  await page.goto('/projects');
  await page.getByRole('link', { name: /Midnight Drive \(demo\)/ }).click();
  await page.waitForURL(/\/board$/);
  const boardUrl = new URL(page.url()).pathname;
  for (const [w, h, name] of [
    [1440, 900, 'desktop'],
    [390, 844, 'mobile'],
  ] as const) {
    await page.setViewportSize({ width: w, height: h });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((t) => localStorage.setItem('theme', t), theme);
      for (const [path, slug] of [
        [boardUrl, 'board'],
        ['/dashboard', 'dashboard'],
        ['/projects', 'projects'],
      ]) {
        await page.goto(path);
        await page.waitForTimeout(700);
        await page.screenshot({
          path: `${dir}/${slug}-${name}-${theme}.png`,
          fullPage: name === 'desktop' ? false : true,
        });
      }
    }
  }
  await page.context().clearCookies();
  // settle scroll-triggered reveals before full-page captures
  const settle = async () => {
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 500) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(60);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
  };
  for (const [w, h, name] of [
    [1440, 900, 'desktop'],
    [390, 844, 'mobile'],
  ] as const) {
    await page.setViewportSize({ width: w, height: h });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((t) => localStorage.setItem('theme', t), theme);
      await page.goto('/');
      await settle();
      await page.screenshot({ path: `${dir}/home-${name}-${theme}.png`, fullPage: true });
    }
  }
  for (const theme of ['dark', 'light']) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate((t) => localStorage.setItem('theme', t), theme);
    await page.goto('/login');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${dir}/login-desktop-${theme}.png` });
  }
});
