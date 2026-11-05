import { expect, test } from '@playwright/test';
import { signUpAndConfirm, uniqueUser, wav } from './helpers';

test('resumable upload: a large track survives a dropped chunk and plays', async ({ page }) => {
  test.setTimeout(120_000);
  await signUpAndConfirm(page, uniqueUser('tus'));

  // drop the first chunk PATCH mid-upload; TUS must retry and resume from the server offset
  let dropped = 0;
  let patches = 0;
  await page.route('**/storage/v1/upload/resumable/sign/**', async (route) => {
    if (route.request().method() === 'PATCH') {
      patches++;
      if (dropped === 0) {
        dropped++;
        return route.abort('connectionreset');
      }
    }
    return route.continue();
  });

  await page.goto('/community/new');
  await page.getByLabel('Title', { exact: true }).fill('Long take');
  await page
    .locator('#post-audio')
    .setInputFiles({ name: 'long-take.wav', mimeType: 'audio/wav', buffer: wav(105) });
  await expect(page.getByText('Audio uploaded')).toBeVisible({ timeout: 90_000 });
  expect(dropped).toBe(1);
  expect(patches).toBeGreaterThan(1);

  await page.getByLabel('Notes', { exact: true }).fill('9 MB WAV uploaded with TUS');
  await page.getByRole('button', { name: 'Publish post' }).click();
  await expect(page.getByRole('heading', { name: 'Long take' })).toBeVisible();
  const player = page.getByTestId('audio-player');
  await player.getByRole('button', { name: /^Play/ }).click();
  await expect(player.getByRole('button', { name: /^Pause/ })).toBeVisible();
  await expect(player.getByText('1:45')).toBeVisible();
});
