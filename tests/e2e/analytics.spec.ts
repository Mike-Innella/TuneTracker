import { expect, test } from '@playwright/test';
import { signUpAndConfirm, uniqueUser, wav } from './helpers';

test('studio: activation checklist and analytics from a real listen', async ({ page, browser }) => {
  test.setTimeout(150_000);
  await signUpAndConfirm(page, uniqueUser('ana'));
  await page.goto('/studio');
  const setup = page.getByTestId('activation');
  await expect(setup).toContainText('0/6');

  await page.goto('/studio/upload');
  await page
    .locator('#track-audio')
    .setInputFiles({ name: 'take.wav', mimeType: 'audio/wav', buffer: wav(20) });
  await expect(page.getByRole('heading', { name: 'Details' })).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('Title', { exact: true }).fill('Counted Song');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page).toHaveURL(/\/tracks\//);
  const url = page.url();

  await page.goto('/studio');
  await expect(setup).toContainText('2/6');
  await expect(setup.getByRole('listitem').filter({ hasText: 'Publish it' })).toContainText('(done)');

  // a guest listens past the 10-second mark: one counted play
  const guest = await (await browser.newContext()).newPage();
  await guest.goto(url);
  await guest.getByTestId('audio-player').getByRole('button', { name: 'Play Counted Song' }).click();
  await expect
    .poll(async () => Number((await guest.getByTestId('mini-time').textContent())?.split(':')[1]), {
      timeout: 20_000,
    })
    .toBeGreaterThanOrEqual(11);

  await page.goto('/studio/analytics?days=7');
  await expect(page.getByTestId('analytics-figures').getByText('Plays').locator('..')).toContainText('1');
  await expect(page.getByTestId('top-tracks')).toContainText('Counted Song');
  const chart = page.getByRole('img', { name: /Plays per day over 7 days: 1 in total/ });
  await chart.focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('status').filter({ hasText: '1 play' })).toBeVisible();
  await page.getByText('Show as table').click();
  await expect(page.getByRole('cell', { name: '1', exact: true })).toBeVisible();
});
