import { expect, test, type Page } from '@playwright/test';
import { createProject, signUpAndConfirm, uniqueUser } from './helpers';

const column = (page: Page, title: string) =>
  page.locator(`[data-testid=board-column][data-column-title="${title}"]`);
const cardTitles = (page: Page, col: string) =>
  column(page, col)
    .getByTestId('task-card')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-task-title')));

async function addTask(page: Page, col: string, title: string) {
  const c = column(page, col);
  const input = c.getByLabel('New task title');
  if (!(await input.isVisible())) await c.getByRole('button', { name: 'Add task' }).click();
  await input.fill(title);
  await c.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(c.locator(`[data-task-title="${title}"]`)).toBeVisible();
}

/** Real pointer drag: press, move in steps past the activation distance, release. */
async function drag(page: Page, from: string, toSelector: string) {
  const src = page.locator(`[data-task-title="${from}"]`);
  const sb = (await src.boundingBox())!;
  const tb = (await page.locator(toSelector).boundingBox())!;
  await page.mouse.move(sb.x + sb.width / 2, sb.y + 10);
  await page.mouse.down();
  await page.mouse.move(sb.x + sb.width / 2 + 10, sb.y + 20, { steps: 5 });
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2, { steps: 20 });
  await page.waitForTimeout(150);
  await page.mouse.up();
}

test('project creation, board customization, tasks, drag-and-drop and persistent ordering', async ({
  page,
}) => {
  await signUpAndConfirm(page, uniqueUser('board'));
  await createProject(page, 'Midnight Drive', 'Blank');

  await expect(page.getByTestId('board-column')).toHaveCount(3);

  // customize: add, rename, reorder, delete
  await page.getByLabel('Add column').fill('Mastering');
  await page.getByRole('button', { name: 'Add column' }).click();
  await expect(column(page, 'Mastering')).toBeVisible();

  await column(page, 'In progress')
    .getByRole('button', { name: /Column actions/ })
    .click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  await column(page, 'In progress').getByLabel('Column name').fill('Mixing');
  await page.keyboard.press('Enter');
  await expect(column(page, 'Mixing')).toBeVisible();

  await column(page, 'Mastering')
    .getByRole('button', { name: /Column actions/ })
    .click();
  await page.getByRole('menuitem', { name: 'Move left' }).click();
  await expect(page.getByTestId('board-column').nth(2)).toHaveAttribute('data-column-title', 'Mastering');

  // tasks
  await addTask(page, 'To do', 'Write hook');
  await addTask(page, 'To do', 'Record vocals');
  await addTask(page, 'To do', 'Bounce stems');

  // drag across columns
  await drag(
    page,
    'Record vocals',
    '[data-testid=board-column][data-column-title="Mixing"] >> text=Drop a task here',
  );
  await expect.poll(() => cardTitles(page, 'Mixing')).toEqual(['Record vocals']);
  // drag within a column (Bounce stems above Write hook)
  await drag(page, 'Bounce stems', '[data-task-title="Write hook"]');
  await expect.poll(() => cardTitles(page, 'To do')).toEqual(['Bounce stems', 'Write hook']);

  // accessible alternative: Move menu
  await page.getByRole('button', { name: 'Move Write hook', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Done' }).click();
  await expect.poll(() => cardTitles(page, 'Done')).toEqual(['Write hook']);

  // delete a column: tasks survive in the neighbour
  await column(page, 'Done')
    .getByRole('button', { name: /Column actions/ })
    .click();
  await page.getByRole('menuitem', { name: 'Delete column' }).click();
  await expect(column(page, 'Done')).toHaveCount(0);
  await expect.poll(() => cardTitles(page, 'Mastering')).toEqual(['Write hook']);

  // everything persisted
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByTestId('board-column')).toHaveCount(3);
  expect(
    await page
      .getByTestId('board-column')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-column-title'))),
  ).toEqual(['To do', 'Mixing', 'Mastering']);
  expect(await cardTitles(page, 'To do')).toEqual(['Bounce stems']);
  expect(await cardTitles(page, 'Mixing')).toEqual(['Record vocals']);
  expect(await cardTitles(page, 'Mastering')).toEqual(['Write hook']);
});

test('task details: edit fields, checklist and comments persist', async ({ page }) => {
  await signUpAndConfirm(page, uniqueUser('task'));
  await createProject(page, 'Echoes', 'Mixing');
  await addTask(page, 'To mix', 'Lead vocal chain');
  await page.getByRole('button', { name: 'Lead vocal chain', exact: true }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByLabel('Title')).toHaveValue('Lead vocal chain');
  await sheet.getByLabel('Priority').selectOption('HIGH');
  await sheet.getByLabel('BPM').fill('124');
  await sheet.getByLabel('Key').fill('F#m');
  await sheet.getByLabel('Due date').fill('2030-01-15');
  await sheet.getByRole('button', { name: 'Save details' }).click();
  await expect(page.getByText('Task saved')).toBeVisible();

  await sheet.getByLabel('New checklist item').fill('De-ess');
  await sheet.getByRole('button', { name: 'Add checklist item' }).click();
  await expect(sheet.getByText('De-ess')).toBeVisible();
  await sheet.getByRole('checkbox').first().click();

  await sheet.getByLabel('New label name').fill('vocals');
  await sheet.getByRole('button', { name: 'Create label' }).click();
  await expect(sheet.getByRole('button', { name: 'vocals', pressed: true })).toBeVisible();

  await sheet.getByLabel('Comment').fill('Try the 1176 before the LA-2A');
  await sheet.getByRole('button', { name: 'Comment', exact: true }).click();
  await expect(sheet.getByText('Try the 1176 before the LA-2A')).toBeVisible();

  await page.keyboard.press('Escape');
  const card = page.locator('[data-task-title="Lead vocal chain"]').filter({ visible: true });
  await expect(card).toContainText('High');
  await expect(card).toContainText('124 BPM · F#m');
  await expect(card).toContainText('1/1');
  await page.reload();
  await expect(page.locator('[data-task-title="Lead vocal chain"]').filter({ visible: true })).toContainText(
    'vocals',
  );
});
