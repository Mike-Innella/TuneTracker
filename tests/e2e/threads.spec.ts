import { expect, test } from '@playwright/test';
import { signUpAndConfirm, uniqueUser, wav } from './helpers';

test('community: a post embeds a track and @mentions an artist, who is notified and replies in a thread', async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const author = await signUpAndConfirm(page, uniqueUser('thr'));
  const friendPage = await (await browser.newContext()).newPage();
  const friend = await signUpAndConfirm(friendPage, uniqueUser('pal'));

  // publish a track to embed
  await page.goto('/studio/upload');
  await page
    .locator('#track-audio')
    .setInputFiles({ name: 'take.wav', mimeType: 'audio/wav', buffer: wav(3) });
  await expect(page.getByRole('heading', { name: 'Details' })).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('Title', { exact: true }).fill('Late Bloom');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page).toHaveURL(/\/tracks\//);

  await page.goto('/community/new');
  await page.getByLabel('Title', { exact: true }).fill('Late Bloom is out');
  await page.getByLabel('Notes', { exact: true }).fill(`Mixed with @${friend.username} — thank you!`);
  await page.getByLabel('Embed one of your tracks').selectOption({ label: 'Late Bloom' });
  await page.getByRole('button', { name: 'Publish post' }).click();
  await expect(page.getByRole('heading', { name: 'Late Bloom is out' })).toBeVisible();
  await expect(
    page.getByTestId('track-embed').getByRole('button', { name: 'Play Late Bloom' }),
  ).toBeVisible();
  const mention = page.getByRole('link', { name: `@${friend.username}` });
  await expect(mention).toHaveAttribute('href', `/artists/${friend.username}`);
  await page.getByLabel('Your comment').fill('Stems are in the project folder');
  await page.getByRole('button', { name: 'Post comment' }).click();
  await expect(page.getByTestId('comment')).toHaveCount(1);
  const postUrl = page.url();

  // the friend is notified of the mention and replies to the comment
  await friendPage.goto('/home');
  await friendPage.getByRole('button', { name: /Notifications, 1 unread/ }).click();
  await friendPage.getByText(`@${author.username} mentioned you in “Late Bloom is out”`).click();
  await expect(friendPage).toHaveURL(postUrl);
  await friendPage.getByTestId('comment').getByRole('button', { name: 'Reply' }).click();
  await friendPage.getByLabel('Your reply').fill('Got them, thanks');
  await friendPage.getByRole('button', { name: 'Reply', exact: true }).last().click();
  const thread = friendPage.getByRole('list', { name: `Replies to ${author.displayName}` });
  await expect(thread.getByTestId('comment')).toContainText('Got them, thanks');

  // the author hears about the reply
  await page.goto('/home');
  await page.getByRole('button', { name: /Notifications, \d+ unread/ }).click();
  await expect(page.getByText(`@${friend.username} replied to you on “Late Bloom is out”`)).toBeVisible();
});
