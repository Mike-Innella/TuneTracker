import { expect, test } from '@playwright/test';
import { signUpAndConfirm, uniqueUser, wav } from './helpers';

/** Upload → details → release through the wizard; returns the public track URL. */
async function publishViaWizard(
  page: import('@playwright/test').Page,
  opts: { title: string; kind: 'Track' | 'Sample'; rights?: string; download?: boolean; publish?: boolean },
) {
  await page.goto('/studio/upload');
  await page.getByRole('radio', { name: new RegExp(`^${opts.kind}`) }).click();
  await page
    .locator('#track-audio')
    .setInputFiles({ name: 'take.wav', mimeType: 'audio/wav', buffer: wav(20) });
  await expect(page.getByRole('heading', { name: 'Details' })).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('Title', { exact: true }).fill(opts.title);
  await page.getByLabel('Genre').selectOption('Synthwave');
  await page.getByLabel('Tempo (BPM)').fill('104');
  await page.getByLabel('Credit 1 role').fill('Mixing');
  await page.getByLabel('Credit 1 name').fill('Ada Lovelace');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Release' })).toBeVisible();
  if (opts.rights) await page.getByLabel('How others may use it').selectOption({ label: opts.rights });
  if (opts.download) await page.getByRole('switch', { name: 'Allow downloads' }).click();
  if (opts.publish === false) {
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page).toHaveURL(/\/studio$/);
    return null;
  }
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page).toHaveURL(/\/tracks\/[^/]+$/);
  return page.url();
}

test('music core: publish a track, a guest plays it without an account, playback survives navigation', async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const artist = await signUpAndConfirm(page, uniqueUser('band'));
  const url = (await publishViaWizard(page, { title: 'Neon Highway', kind: 'Track' }))!;
  await expect(page.getByRole('heading', { name: 'Neon Highway' })).toBeVisible();
  await expect(page.getByText('Ada Lovelace')).toBeVisible();
  await expect(page.getByText('104 BPM')).toBeVisible();

  // a draft stays private
  await publishViaWizard(page, { title: 'Secret Demo', kind: 'Track', publish: false });
  await expect(page.getByTestId('track-row').filter({ hasText: 'Secret Demo' })).toContainText('Draft');
  const draftHref = await page.getByRole('link', { name: 'Secret Demo', exact: true }).getAttribute('href');

  const guest = await (await browser.newContext()).newPage();
  expect((await guest.goto(draftHref!))?.status()).toBe(404);
  await guest.goto(url);
  await expect(guest.getByRole('link', { name: 'Log in' }).first()).toBeVisible();
  const embed = guest.getByTestId('audio-player');
  await embed.getByRole('button', { name: 'Play Neon Highway' }).click();
  const mini = guest.getByTestId('mini-player');
  await expect(mini.getByRole('button', { name: 'Pause Neon Highway' })).toBeVisible();

  // navigate to the artist page: the same playback continues in the mini player
  await guest.getByRole('link', { name: artist.displayName }).first().click();
  await expect(guest).toHaveURL(new RegExp(`/artists/${artist.username}$`));
  await expect(mini.getByRole('button', { name: 'Pause Neon Highway' })).toBeVisible();
  await expect
    .poll(async () => Number((await mini.getByTestId('mini-time').textContent())?.split(':')[1]), {
      timeout: 15_000,
    })
    .toBeGreaterThanOrEqual(11);
  await expect(guest.getByTestId('track-list')).toContainText('Neon Highway');

  // the listen (≥10 s) was counted once, and the artist can't inflate it
  await page.goto(url);
  await expect(page.getByText(/^Plays/).locator('..')).toContainText('1');
});

test('samples: downloads need usage rights, and the listener gets the file', async ({ page, browser }) => {
  test.setTimeout(120_000);
  await signUpAndConfirm(page, uniqueUser('smp'));
  const url = (await publishViaWizard(page, {
    title: 'Dusty Kick',
    kind: 'Sample',
    rights: 'CC BY 4.0',
    download: true,
  }))!;
  await expect(page.getByText('Any use, including commercial, with attribution.')).toBeVisible();

  const guest = await (await browser.newContext()).newPage();
  await guest.goto(url);
  const download = guest.waitForEvent('download');
  await guest.getByRole('button', { name: 'Download sample' }).click();
  expect((await download).suggestedFilename()).toBe('Dusty_Kick.wav');
});
