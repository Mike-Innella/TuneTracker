import path from 'node:path';
import { expect, test } from '@playwright/test';
import { createProject, signUpAndConfirm, uniqueUser } from './helpers';

const fixture = (f: string) => path.join(import.meta.dirname, 'fixtures', f);

test('community: post with audio upload + playback, image, comment, reaction, edit and delete', async ({
  page,
  browser,
}) => {
  await signUpAndConfirm(page, uniqueUser('poster'));
  await createProject(page, 'Velvet Hours', 'Songwriting');

  // project-to-community publishing starts from the project
  await page.getByRole('link', { name: 'Overview & team' }).click();
  await page.getByRole('link', { name: 'Share progress' }).click();
  await expect(page).toHaveURL(/\/community\/new\?projectId=/);
  await expect(page.getByLabel('Related project')).toHaveValue(/.+/);
  await expect(page.getByText('are never published')).toBeVisible();

  await page.getByLabel('Title', { exact: true }).fill('First demo of Velvet Hours');
  await page.getByLabel('What are you sharing?').selectOption('FEEDBACK');
  await page.getByLabel('Genre').fill('Synthwave');
  await page.locator('#post-audio').setInputFiles(fixture('tone.wav'));
  await expect(page.getByText('Audio uploaded')).toBeVisible({ timeout: 20_000 });
  await page.locator('#post-image').setInputFiles(fixture('cover.png'));
  await expect(page.getByText('Image uploaded')).toBeVisible({ timeout: 20_000 });
  await page.getByLabel('Notes', { exact: true }).fill('Rough mix — is the kick too loud?');
  await page.getByLabel('Tags').fill('wip, 124bpm');
  await page.getByLabel('Links').fill('https://soundcloud.com/example');
  await page.getByRole('switch').click();
  await page.getByRole('button', { name: 'Publish post' }).click();

  await expect(page.getByRole('heading', { name: 'First demo of Velvet Hours' })).toBeVisible();
  await expect(page).toHaveURL(/\/community\/(?!new)[^/?]+$/);
  const postUrl = page.url();
  // private project is not revealed
  await expect(page.getByText('from Velvet Hours')).toHaveCount(0);

  // playback: the signed URL plays and time advances
  const player = page.getByTestId('audio-player');
  await player.getByRole('button', { name: /^Play/ }).click();
  await expect(player.getByRole('button', { name: /^Pause/ })).toBeVisible();
  await expect
    .poll(async () => player.getByTestId('audio-time').textContent(), { timeout: 10_000 })
    .not.toBe('0:00');
  await expect(player.getByText('0:02')).toBeVisible();

  // a second artist reacts and comments
  const ctx = await browser.newContext();
  const fan = await ctx.newPage();
  await signUpAndConfirm(fan, uniqueUser('fan'));
  await fan.goto(postUrl);
  await fan.getByRole('button', { name: /^Fire/ }).click();
  await expect(fan.getByRole('button', { name: 'Fire, 1' })).toHaveAttribute('aria-pressed', 'true');
  await fan.getByLabel('Your comment').fill('Kick is fine, the hats are a bit harsh.');
  await fan.getByRole('button', { name: 'Post comment' }).click();
  await expect(fan.getByTestId('comment')).toContainText('hats are a bit harsh');
  // others cannot edit
  await expect(fan.getByRole('link', { name: 'Edit' })).toHaveCount(0);
  await expect(fan.getByRole('button', { name: 'Report' })).toBeVisible();
  await ctx.close();

  // feed + pagination surface
  await page.goto('/community?type=FEEDBACK');
  await expect(page.getByTestId('post-card').first()).toBeVisible();

  // author sees feedback, edits, deletes
  await page.goto(postUrl);
  await expect(page.getByTestId('comment')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Fire, 1' })).toBeVisible();
  await page.getByRole('link', { name: 'Edit' }).click();
  await page.getByLabel('Title', { exact: true }).fill('First demo of Velvet Hours (v2)');
  await page.getByRole('button', { name: 'Save post' }).click();
  await expect(page.getByRole('heading', { name: 'First demo of Velvet Hours (v2)' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('button', { name: 'Delete post' }).click();
  await expect(page).toHaveURL(/\/community$/);
});

test('task attachments: upload audio to a task and play it', async ({ page }) => {
  await signUpAndConfirm(page, uniqueUser('attach'));
  await createProject(page, 'Stems', 'Blank');
  const col = page.locator('[data-testid=board-column][data-column-title="To do"]');
  await col.getByRole('button', { name: 'Add task' }).click();
  await col.getByLabel('New task title').fill('Review stems');
  await col.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Review stems', exact: true }).click();
  await page.locator('#t-file-input').setInputFiles(fixture('tone.wav'));
  await expect(page.getByText('tone.wav attached')).toBeVisible({ timeout: 20_000 });
  const player = page.getByRole('dialog').getByTestId('audio-player');
  await player.getByRole('button', { name: /^Play/ }).click();
  await expect(player.getByRole('button', { name: /^Pause/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-task-title="Review stems"]')).toContainText('1');
});
