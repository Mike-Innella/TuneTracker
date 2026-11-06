import { execFileSync } from 'node:child_process';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { confirmLinkFor, createProject, signUpAndConfirm, uniqueUser, type TestUser } from './helpers';

async function newUser(browser: Browser, prefix: string): Promise<{ page: Page; user: TestUser }> {
  const page = await (await browser.newContext()).newPage();
  const user = await signUpAndConfirm(page, uniqueUser(prefix));
  return { page, user };
}

test('follow: an artist gains a follower, gets notified, and appears in the Following feed', async ({
  browser,
}) => {
  const artist = await newUser(browser, 'star');
  const fan = await newUser(browser, 'fan');

  await artist.page.goto('/community/new');
  await artist.page.getByLabel('Title', { exact: true }).fill('Fresh demo');
  await artist.page.getByLabel('Notes', { exact: true }).fill('First pass at the chorus');
  await artist.page.getByRole('button', { name: 'Publish post' }).click();
  await expect(artist.page.getByRole('heading', { name: 'Fresh demo' })).toBeVisible();

  await fan.page.goto(`/artists/${artist.user.username}`);
  await expect(fan.page.getByTestId('follow-stats')).toContainText('0');
  await fan.page.getByTestId('follow-button').click();
  await expect(fan.page.getByTestId('follow-button')).toHaveText('Following');
  await expect(fan.page.getByTestId('follow-stats')).toContainText('1');
  await fan.page.reload();
  await expect(fan.page.getByTestId('follow-button')).toHaveAttribute('aria-pressed', 'true');

  await fan.page.goto('/community?following=1');
  // visible only: the feed streams, and React keeps a hidden copy while it swaps the segment in
  const cards = fan.page.getByTestId('post-card').filter({ visible: true });
  await expect(cards).toHaveCount(1);
  await expect(cards).toContainText('Fresh demo');

  await artist.page.goto('/studio');
  await artist.page.getByRole('button', { name: /Notifications, 1 unread/ }).click();
  await expect(artist.page.getByText('followed you')).toBeVisible();
});

test('collaboration request: invitee must accept; declined invites grant nothing', async ({ browser }) => {
  const owner = await newUser(browser, 'own');
  const yes = await newUser(browser, 'yes');
  const no = await newUser(browser, 'no');
  await createProject(owner.page, 'Request Album', 'Blank');
  const boardUrl = owner.page.url();
  await owner.page.getByRole('link', { name: 'Overview & team' }).click();
  for (const u of [yes.user, no.user]) {
    await owner.page.getByLabel('Username or email to invite').fill(`@${u.username}`);
    await owner.page.getByRole('button', { name: 'Invite' }).click();
    await expect(owner.page.getByText(`Invitation sent to @${u.username}`)).toBeVisible();
    await expect(owner.page.getByLabel('Username or email to invite')).toHaveValue('');
  }
  await expect(owner.page.getByTestId('pending-invites')).toContainText(yes.user.username);

  // pending is not membership
  expect((await yes.page.goto(boardUrl))?.status()).toBe(404);

  await yes.page.goto('/studio');
  await yes.page.getByTestId('invitation').getByRole('button', { name: 'Accept' }).click();
  await expect(yes.page).toHaveURL(/\/board$/);
  await expect(yes.page.getByTestId('project-title')).toHaveText('Request Album');

  await no.page.goto('/studio');
  await no.page.getByTestId('invitation').getByRole('button', { name: 'Decline' }).click();
  await expect(no.page.getByTestId('invitation')).toHaveCount(0);
  expect((await no.page.goto(boardUrl))?.status()).toBe(404);

  await owner.page.reload();
  await expect(owner.page.getByTestId('members')).toContainText(yes.user.displayName);
  await expect(owner.page.getByTestId('pending-invites')).toHaveCount(0);
});

test('collaboration request by email: a new person signs up from the invite and joins', async ({
  browser,
}) => {
  const owner = await newUser(browser, 'mail');
  await createProject(owner.page, 'Email Album', 'Blank');
  await owner.page.getByRole('link', { name: 'Overview & team' }).click();
  const invitee = uniqueUser('guest');
  await owner.page.getByLabel('Username or email to invite').fill(invitee.email);
  await owner.page.getByRole('button', { name: 'Invite' }).click();
  await expect(owner.page.getByText(`Invitation emailed to ${invitee.email}`)).toBeVisible();

  const guest = await (await browser.newContext()).newPage();
  await guest.goto(await confirmLinkFor(invitee.email));
  await expect(guest).toHaveURL(/\/reset-password/);
  await guest.getByLabel('New password').fill(invitee.password);
  await guest.getByRole('button', { name: 'Save password' }).click();
  await expect(guest).toHaveURL(/\/studio$/);
  await guest.getByTestId('invitation').getByRole('button', { name: 'Accept' }).click();
  await expect(guest.getByTestId('project-title')).toHaveText('Email Album');
});

test('account deletion: typed confirmation removes the account and its login', async ({ page }) => {
  const user = await signUpAndConfirm(page, uniqueUser('bye'));
  await createProject(page, 'Doomed', 'Blank');
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Delete account' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByRole('button', { name: 'Delete forever' })).toBeDisabled();
  await dialog.getByLabel(/Type .* to confirm/).fill(user.username);
  await dialog.getByRole('button', { name: 'Delete forever' }).click();
  await expect(page).toHaveURL(/\/\?account=deleted/);

  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.locator('form [role=alert]')).toContainText('Email or password is incorrect');
});

test('moderation: reports reach moderators only; removing content and suspending work', async ({
  browser,
}) => {
  const author = await newUser(browser, 'spam');
  const reporter = await newUser(browser, 'rep');
  const mod = await newUser(browser, 'mod');
  execFileSync('npm', ['run', 'set-role', '-w', '@tunetracker/data', '--', mod.user.username, 'MODERATOR'], {
    stdio: 'ignore',
  });

  await author.page.goto('/community/new');
  await author.page.getByLabel('Title', { exact: true }).fill('Buy followers now');
  await author.page.getByLabel('Notes', { exact: true }).fill('cheap cheap cheap');
  await author.page.getByRole('button', { name: 'Publish post' }).click();
  await expect(author.page.getByRole('heading', { name: 'Buy followers now' })).toBeVisible();
  const postUrl = author.page.url();

  await reporter.page.goto(postUrl);
  await reporter.page.getByRole('button', { name: 'Report' }).click();
  await reporter.page.getByLabel('Reason').fill('Spam selling followers');
  await reporter.page.getByRole('button', { name: 'Send report' }).click();
  await expect(reporter.page.getByText('we’ll review this report')).toBeVisible();

  // invisible to non-moderators
  expect((await reporter.page.goto('/moderation'))?.status()).toBe(404);

  await mod.page.goto('/moderation');
  // the queue holds every open report: scope to this run's author
  const report = mod.page
    .getByTestId('report')
    .filter({ hasText: 'Spam selling followers' })
    .filter({ hasText: `@${author.user.username}` });
  await expect(report).toContainText(`@${author.user.username}`);
  await report.getByRole('button', { name: 'Remove post' }).click();
  await expect(mod.page.getByText('Content removed')).toBeVisible();
  expect((await reporter.page.goto(postUrl))?.status()).toBe(404);

  // report the profile, suspend, and the author is signed out with an explanation
  await reporter.page.goto(`/artists/${author.user.username}`);
  await reporter.page.getByRole('button', { name: 'Report' }).click();
  await reporter.page.getByLabel('Reason').fill('Repeat spammer');
  await reporter.page.getByRole('button', { name: 'Send report' }).click();
  await expect(reporter.page.getByText('we’ll review this report')).toBeVisible();
  await mod.page.goto('/moderation');
  await mod.page
    .getByTestId('report')
    .filter({ hasText: 'Repeat spammer' })
    .filter({ hasText: `@${author.user.username}` })
    .getByRole('button', { name: 'Suspend author' })
    .click();
  await expect(mod.page.getByText('Account suspended')).toBeVisible();
  // the Auth ban ends the session at once; signing in again explains why
  await author.page.goto('/studio');
  await expect(author.page).toHaveURL(/\/login/);
  await author.page.getByLabel('Email').fill(author.user.email);
  await author.page.getByLabel('Password').fill(author.user.password);
  await author.page.getByRole('button', { name: 'Log in' }).click();
  await expect(author.page.locator('form [role=alert]')).toContainText('suspended');
});
