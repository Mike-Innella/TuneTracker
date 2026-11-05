import { expect, type Page } from '@playwright/test';

const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';

export function uniqueUser(prefix = 'e2e') {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    email: `${prefix}_${id}@example.test`,
    username: `${prefix}_${id}`.slice(0, 30),
    displayName: `Test ${prefix} ${id.slice(-4)}`,
    password: 'correct-horse-battery',
  };
}
export type TestUser = ReturnType<typeof uniqueUser>;

/** Polls Mailpit (Supabase local SMTP) for the newest link to /auth/confirm sent to `email`. */
export async function confirmLinkFor(email: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const { messages = [] } = (await res.json()) as { messages?: { ID: string }[] };
    if (messages[0]) {
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as {
        HTML: string;
      };
      const href = msg.HTML.match(/href="([^"]*\/auth\/confirm[^"]*)"/)?.[1];
      if (href) return href.replace(/&amp;/g, '&');
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No confirmation email for ${email}`);
}

export async function signUp(page: Page, user: TestUser) {
  await page.goto('/signup');
  await page.getByLabel('Artist name').fill(user.displayName);
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();
}

/** Registers, follows the real verification email, and lands on Home. */
export async function signUpAndConfirm(page: Page, user = uniqueUser()) {
  await signUp(page, user);
  await page.goto(await confirmLinkFor(user.email));
  await expect(page).toHaveURL(/\/home$/);
  return user;
}

export async function logIn(page: Page, user: TestUser) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/home$/);
}

export async function createProject(page: Page, title: string, template = 'Production') {
  await page.goto('/projects?new=1');
  await page.getByLabel('Title').fill(title);
  await page.getByRole('radio', { name: new RegExp(template) }).click();
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+\/board/);
  await expect(page.getByTestId('project-title')).toHaveText(title);
}

/** A valid PCM WAV of `seconds` silence-ish tone, built in memory (no big fixture in git). */
export function wav(seconds: number, rate = 44100) {
  const samples = seconds * rate;
  const buf = Buffer.alloc(44 + samples * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    buf.writeInt16LE(Math.round(Math.sin((i / rate) * 2 * Math.PI * 220) * 3000), 44 + i * 2);
  return buf;
}
