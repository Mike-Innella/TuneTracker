import { expect, test } from '@playwright/test';
import { signUpAndConfirm, uniqueUser, wav } from './helpers';

async function publish(
  page: import('@playwright/test').Page,
  title: string,
  kind: 'Track' | 'Sample',
  genre: string,
) {
  await page.goto('/studio/upload');
  await page.getByRole('radio', { name: new RegExp(`^${kind}`) }).click();
  await page
    .locator('#track-audio')
    .setInputFiles({ name: 'take.wav', mimeType: 'audio/wav', buffer: wav(3) });
  await expect(page.getByRole('heading', { name: 'Details' })).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('Genre').selectOption(genre);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page).toHaveURL(/\/tracks\//);
}

test('home and discover: guests browse, filter, search artists and play from the grid', async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const artist = await signUpAndConfirm(page, uniqueUser('disc'));
  const tag = artist.username.slice(-6);
  await publish(page, `Glass Tide ${tag}`, 'Track', 'Ambient');
  await publish(page, `Snare Box ${tag}`, 'Sample', 'Hip-Hop');

  // following: a fan sees the artist's tracks on Home
  await page.goto('/home');
  await expect(page.getByRole('heading', { name: 'New releases' })).toBeVisible();

  const guest = await (await browser.newContext()).newPage();
  expect((await guest.goto('/'))?.status()).toBe(200); // landing page for guests
  await guest.goto('/home');
  await expect(guest.getByRole('link', { name: 'Create a free account' })).toBeVisible();
  await expect(guest.getByTestId('track-card').filter({ hasText: `Glass Tide ${tag}` })).toBeVisible();

  // header search → Discover with artist results
  await guest.getByRole('searchbox', { name: 'Search tracks, samples and artists' }).fill(tag);
  await guest.keyboard.press('Enter');
  await expect(guest).toHaveURL(new RegExp(`/discover\\?q=${tag}`));
  await expect(guest.getByTestId('artist-results')).toContainText(artist.displayName);
  await expect(guest.getByTestId('track-card')).toHaveCount(2);

  // type tabs and genre filter keep the query
  await guest.getByRole('navigation', { name: 'Type' }).getByRole('link', { name: 'Samples' }).click();
  await expect(guest).toHaveURL(/type=samples/);
  await expect(guest.getByTestId('track-card')).toHaveCount(1);
  await expect(guest.getByTestId('track-card')).toContainText(`Snare Box ${tag}`);
  await guest.goto(`/discover?q=${tag}&genre=Ambient`);
  await expect(guest.getByTestId('track-card')).toHaveCount(1);
  await expect(guest.getByTestId('track-card')).toContainText(`Glass Tide ${tag}`);

  // play straight from the grid, without an account
  await guest
    .getByTestId('track-card')
    .getByRole('button', { name: `Play Glass Tide ${tag}` })
    .click();
  await expect(
    guest.getByTestId('mini-player').getByRole('button', { name: `Pause Glass Tide ${tag}` }),
  ).toBeVisible();

  // signed-in visitors skip the landing page
  await page.goto('/');
  await expect(page).toHaveURL(/\/home$/);
});
