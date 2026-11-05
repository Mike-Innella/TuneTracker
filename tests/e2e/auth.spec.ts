import { expect, test } from '@playwright/test';
import { confirmLinkFor, logIn, signUp, signUpAndConfirm, uniqueUser } from './helpers';

test('registration requires email verification, then login, dashboard and logout work', async ({ page }) => {
  const user = uniqueUser('auth');
  await signUp(page, user);

  // unverified accounts cannot sign in
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.locator('form [role=alert]')).toContainText('Confirm your email');

  await page.goto(await confirmLinkFor(user.email));
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(user.displayName.split(' ')[0]!);
  await expect(page.getByTestId('dashboard-stats')).toContainText('Active projects');

  await page.getByTestId('account-menu').first().click();
  await page.getByTestId('logout').click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);

  await logIn(page, user);
});

test('wrong password shows a clear error', async ({ page }) => {
  const user = await signUpAndConfirm(page, uniqueUser('pw'));
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill('not-the-password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.locator('form [role=alert]')).toContainText('Email or password is incorrect');
});

test('unauthenticated visitors are kept out of app routes', async ({ page }) => {
  for (const path of ['/dashboard', '/projects', '/community/new', '/profile', '/settings']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  }
});

test('password reset sends a recovery link that lets the user set a new password', async ({ page }) => {
  const user = await signUpAndConfirm(page, uniqueUser('reset'));
  await page.context().clearCookies();
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(user.email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('status')).toContainText('reset link is on its way');
  // newest message for this address is the recovery email
  let link = '';
  for (let i = 0; i < 20 && !link.includes('type=recovery'); i++) {
    link = await confirmLinkFor(user.email);
    if (!link.includes('type=recovery')) await page.waitForTimeout(500);
  }
  expect(link).toContain('type=recovery');
  await page.goto(link);
  await expect(page).toHaveURL(/\/reset-password/);
  await page.getByLabel('New password').fill('a-brand-new-password');
  await page.getByRole('button', { name: 'Save password' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().clearCookies();
  await logIn(page, { ...user, password: 'a-brand-new-password' });
});
