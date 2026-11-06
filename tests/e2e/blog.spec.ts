import { expect, test } from '@playwright/test';
import { signUpAndConfirm, uniqueUser } from './helpers';

test('blog: write with the editor, save a draft, publish, and guests read and find it', async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const author = await signUpAndConfirm(page, uniqueUser('blog'));
  const tag = author.username.slice(-6);

  await page.goto('/blog');
  await page.getByRole('link', { name: 'Write' }).click();
  await expect(page).toHaveURL(/\/studio\/articles\/new$/);
  await page.getByLabel('Title', { exact: true }).fill(`Parallel compression ${tag}`);
  await page.getByLabel('Category').selectOption('Mixing & mastering');
  await page.getByLabel('Tags').fill(`#Drums, ${tag}`);

  const body = page.getByRole('textbox', { name: 'Article body' });
  await body.click();
  await page.getByRole('button', { name: 'Heading', exact: true }).click();
  await page.keyboard.type('Why it works');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Blend a crushed copy under the dry drums. ');
  await page.getByRole('button', { name: 'Bold' }).click();
  await expect(page.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.type('Keep it subtle.');
  await page.getByRole('button', { name: 'Bold' }).click();
  await page.keyboard.press('Enter');
  await page.keyboard.type('Read more');
  await page.keyboard.press('Shift+Home');
  await page.getByRole('button', { name: 'Link' }).click();
  await page.getByLabel('Link address').fill('https://example.com/compression');
  await page.getByRole('button', { name: 'Apply' }).click();

  // draft first: saved, private, listed in Studio
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByText('Draft saved')).toBeVisible();
  await expect(page).toHaveURL(/\/studio\/articles\/[^/]+$/);
  await page.goto('/studio');
  await expect(page.getByTestId('my-articles')).toContainText(`Parallel compression ${tag}`);
  await expect(page.getByTestId('my-articles')).toContainText('Draft');
  await page
    .getByTestId('my-articles')
    .getByRole('link', { name: `Parallel compression ${tag}` })
    .click();

  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page).toHaveURL(/\/blog\/parallel-compression-/);
  const articleUrl = page.url();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Parallel compression ${tag}`);

  const guest = await (await browser.newContext()).newPage();
  await guest.goto(articleUrl);
  await expect(guest.getByRole('heading', { level: 2, name: 'Why it works' })).toBeVisible();
  await expect(guest.locator('.prose-article strong')).toHaveText('Keep it subtle.');
  const link = guest.locator('.prose-article a');
  await expect(link).toHaveAttribute('href', 'https://example.com/compression');
  await expect(link).toHaveAttribute('rel', 'nofollow noopener noreferrer');
  await expect(guest.getByRole('link', { name: '#drums' })).toBeVisible();

  // listed under its category and found by search on the body text
  await guest.goto('/blog');
  await guest
    .getByRole('navigation', { name: 'Category' })
    .getByRole('link', { name: 'Mixing & mastering' })
    .click();
  await expect(
    guest.getByTestId('article-card').filter({ hasText: `Parallel compression ${tag}` }),
  ).toBeVisible();
  await guest.getByLabel('Search articles').fill(`crushed copy`);
  await guest.getByRole('button', { name: 'Search' }).click();
  await expect(
    guest.getByTestId('article-card').filter({ hasText: `Parallel compression ${tag}` }),
  ).toBeVisible();

  // signed-in readers can report; the author sees Edit instead
  await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Report' })).toHaveCount(0);
});
