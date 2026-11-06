import { expect, test, type Page } from '@playwright/test';
import { signUpAndConfirm, uniqueUser, wav } from './helpers';

async function publish(page: Page, title: string) {
  await page.goto('/studio/upload');
  await page
    .locator('#track-audio')
    .setInputFiles({ name: 'take.wav', mimeType: 'audio/wav', buffer: wav(3) });
  await expect(page.getByRole('heading', { name: 'Details' })).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page).toHaveURL(/\/tracks\//);
  return page.url();
}

test('playlists: build from track pages, reorder, share publicly, then make private', async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000);
  await signUpAndConfirm(page, uniqueUser('pls'));
  const first = await publish(page, 'Opening Song');
  const second = await publish(page, 'Closing Song');

  // start a playlist from the first track, add the second from its own page
  await page.goto(first);
  await page.getByRole('button', { name: 'Add to playlist' }).click();
  await page.getByRole('menuitem', { name: 'New playlist with this track' }).click();
  await expect(page.getByText('New playlist created')).toBeVisible();
  await page.goto('/studio');
  const list = page.getByTestId('my-playlists');
  await expect(list).toContainText('Opening Song — playlist');
  await page.goto(second);
  await page.getByRole('button', { name: 'Add to playlist' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Opening Song — playlist' }).click();
  await expect(page.getByText('Added to “Opening Song — playlist”')).toBeVisible();

  await page.goto('/studio');
  await list.getByRole('link', { name: 'Opening Song — playlist' }).click();
  await expect(page).toHaveURL(/\/playlists\//);
  const url = page.url();
  const rows = page.getByTestId('track-row');
  await expect(rows).toHaveText([/Opening Song/, /Closing Song/]);
  await page.getByRole('button', { name: 'Move Closing Song up', exact: true }).click();
  await expect(rows).toHaveText([/Closing Song/, /Opening Song/]);

  // a guest sees the same order and can play it all
  const guest = await (await browser.newContext()).newPage();
  await guest.goto(url);
  await expect(guest.getByTestId('track-row')).toHaveText([/Closing Song/, /Opening Song/]);
  await expect(guest.getByRole('button', { name: /Move .* up/ })).toHaveCount(0);
  await guest.getByRole('button', { name: 'Play all' }).click();
  await expect(
    guest.getByTestId('mini-player').getByRole('button', { name: 'Pause Closing Song' }),
  ).toBeVisible();

  // private: gone for everyone else
  await page.getByRole('button', { name: 'Edit details' }).click();
  await page.getByLabel(/Public — anyone with the link/).uncheck();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Private playlist')).toBeVisible();
  expect((await guest.goto(url))?.status()).toBe(404);
});
