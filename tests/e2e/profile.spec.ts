import path from 'node:path';
import { expect, test } from '@playwright/test';
import { createProject, signUpAndConfirm, uniqueUser } from './helpers';

test('profile editing with avatar upload, public artist page and privacy', async ({ page, browser }) => {
  const me = await signUpAndConfirm(page, uniqueUser('artist'));
  await page.goto('/profile');
  await page.locator('#avatar-input').setInputFiles(path.join(import.meta.dirname, 'fixtures', 'cover.png'));
  await expect(page.getByText('Profile picture updated')).toBeVisible({ timeout: 20_000 });

  await page.getByLabel('Display name').fill('Luna Kovač');
  await page.getByLabel('Biography').fill('Synthwave producer and vocalist.');
  await page.getByLabel('Location').fill('Lisbon');
  await page.getByRole('button', { name: 'Producer' }).click();
  await page.getByRole('button', { name: 'Vocalist' }).click();
  await page.getByLabel('Link 1 URL').fill('https://soundcloud.com/luna');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved')).toBeVisible();

  await page.goto(`/artists/${me.username}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Luna Kovač');
  await expect(page.getByText('Producer · Vocalist')).toBeVisible();
  await expect(page.getByText('Lisbon')).toBeVisible();
  await expect(page.getByRole('main').locator('header img').first()).toBeVisible();

  // unsafe link is rejected at the trust boundary
  await page.goto('/profile');
  await page.getByLabel('Link 1 URL').fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.locator('form [role=alert]')).toBeVisible();

  // privacy: another artist can't see a private profile
  await page.getByLabel('Link 1 URL').fill('https://soundcloud.com/luna');
  await page.getByLabel('Public profile').click();
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved')).toBeVisible();
  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await signUpAndConfirm(other, uniqueUser('viewer'));
  const res = await other.goto(`/artists/${me.username}`);
  expect(res?.status()).toBe(404);
  await ctx.close();
});

test('theme switching persists across reloads', async ({ page }) => {
  await signUpAndConfirm(page, uniqueUser('theme'));
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.goto('/settings');
  await page.getByTestId('theme-light').click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.getByRole('button', { name: 'Toggle dark and light theme' }).first().click();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('collaboration: owner invites, viewer is read-only, editor can change the board, private stays private', async ({
  page,
  browser,
}) => {
  const editorCtx = await browser.newContext();
  const viewerCtx = await browser.newContext();
  const strangerCtx = await browser.newContext();
  const [editorPage, viewerPage, strangerPage] = await Promise.all([
    editorCtx.newPage(),
    viewerCtx.newPage(),
    strangerCtx.newPage(),
  ]);
  const [editor, viewer] = await Promise.all([
    signUpAndConfirm(editorPage, uniqueUser('ed')),
    signUpAndConfirm(viewerPage, uniqueUser('vw')),
    signUpAndConfirm(strangerPage, uniqueUser('st')),
  ]);

  await signUpAndConfirm(page, uniqueUser('owner'));
  await createProject(page, 'Team Album', 'Blank');
  const boardUrl = page.url();
  await page.getByRole('link', { name: 'Overview & team' }).click();
  for (const [u, role] of [
    [editor.username, 'EDITOR'],
    [viewer.username, 'VIEWER'],
  ] as const) {
    await page.getByLabel('Username or email to invite').fill(u);
    await page.getByLabel('Role', { exact: true }).selectOption(role);
    await page.getByRole('button', { name: 'Invite' }).click();
    await expect(page.getByText(`Invitation sent to @${u}`)).toBeVisible();
    await expect(page.getByLabel('Username or email to invite')).toHaveValue(''); // form action resets the form
  }
  await expect(page.getByTestId('pending-invites')).toContainText(editor.username);

  // each invitee is notified and must accept before getting access
  await editorPage.goto('/studio');
  await editorPage.getByRole('button', { name: /Notifications, 1 unread/ }).click();
  await expect(editorPage.getByText(/You.re invited to “Team Album”/)).toBeVisible();
  await editorPage.keyboard.press('Escape');
  await editorPage.getByTestId('invitation').getByRole('button', { name: 'Accept' }).click();
  await expect(editorPage).toHaveURL(/\/board$/);
  await viewerPage.goto('/studio');
  await viewerPage.getByTestId('invitation').getByRole('button', { name: 'Accept' }).click();
  await expect(viewerPage).toHaveURL(/\/board$/);

  await editorPage.goto(boardUrl);
  const col = editorPage.locator('[data-testid=board-column][data-column-title="To do"]');
  await col.getByRole('button', { name: 'Add task' }).click();
  await col.getByLabel('New task title').fill('Editor task');
  await col.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(editorPage.locator('[data-task-title="Editor task"]')).toBeVisible();

  // viewer: sees it, but no editing affordances
  await viewerPage.goto(boardUrl);
  // visible only: while React streams a Suspense segment, a hidden copy can sit in the DOM
  await expect(
    viewerPage
      .locator('[data-testid=board-column][data-column-title="To do"] [data-task-title="Editor task"]')
      .filter({ visible: true }),
  ).toHaveCount(1);
  await expect(viewerPage.getByRole('button', { name: 'Add task' })).toHaveCount(0);
  await expect(viewerPage.getByRole('button', { name: /Column actions/ })).toHaveCount(0);

  // stranger: private project is a 404
  const res = await strangerPage.goto(boardUrl);
  expect(res?.status()).toBe(404);

  await Promise.all([editorCtx.close(), viewerCtx.close(), strangerCtx.close()]);
});
