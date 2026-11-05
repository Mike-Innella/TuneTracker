/**
 * Adds a demo project with a fully populated board for an existing user (profiles are tied to
 * real Supabase Auth accounts, so the seed never invents users). Idempotent.
 *   SEED_USERNAME=yourname npm run db:seed
 */
import { existsSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type TaskPriority } from '../src/generated/prisma/client';

if (existsSync('../.env')) process.loadEnvFile('../.env');
const username = process.env.SEED_USERNAME?.toLowerCase();
if (!username) throw new Error('Set SEED_USERNAME to the username of an existing account');

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000);

type Seed = {
  title: string;
  priority?: TaskPriority;
  bpm?: number;
  musicalKey?: string;
  due?: number;
  labels?: string[];
  checklist?: [string, boolean][];
  mine?: boolean;
};
const LABELS = { keys: '#22d3ee', vocals: '#a46bff', drums: '#2f7bff', mix: '#f472b6' };
const BOARD: Record<string, Seed[]> = {
  Ideas: [
    { title: 'Chord loop in F#m', bpm: 118, musicalKey: 'F#m', labels: ['keys'] },
    { title: 'Find a vocal chop', priority: 'LOW', labels: ['vocals'] },
  ],
  Drafting: [
    {
      title: 'Bassline with sidechain',
      priority: 'HIGH',
      bpm: 124,
      due: 3,
      mine: true,
      checklist: [
        ['Pick the sub patch', true],
        ['Sidechain to kick', false],
      ],
    },
    { title: 'Drum groove', bpm: 124, labels: ['drums'], due: 5 },
  ],
  Arrangement: [{ title: 'Build the second drop', priority: 'URGENT', due: 1, labels: ['mix'], mine: true }],
  'Sound design': [
    {
      title: 'Pad automation',
      musicalKey: 'F#m',
      checklist: [
        ['Filter sweep', true],
        ['Reverb throw', true],
      ],
    },
  ],
  Done: [{ title: 'Reference track list', priority: 'LOW', checklist: [['Three references', true]] }],
};

async function main() {
  const owner = await db.profile.findUnique({ where: { username } });
  if (!owner) throw new Error(`No profile @${username}. Sign up and open the app once first.`);
  const title = 'Midnight Drive (demo)';
  if (await db.project.findFirst({ where: { ownerId: owner.id, title } })) {
    return console.log('Demo project already exists — nothing to do.');
  }
  const project = await db.project.create({
    data: {
      ownerId: owner.id,
      title,
      description: 'Seeded demo project.',
      template: 'production',
      dueDate: inDays(21),
    },
  });
  const labels = Object.fromEntries(
    await Promise.all(
      Object.entries(LABELS).map(async ([name, color]) => [
        name,
        (await db.label.create({ data: { projectId: project.id, name, color } })).id,
      ]),
    ),
  );
  let position = 0;
  for (const [colTitle, tasks] of Object.entries(BOARD)) {
    const column = await db.boardColumn.create({
      data: { projectId: project.id, title: colTitle, position: position++ },
    });
    for (const [i, t] of tasks.entries()) {
      await db.task.create({
        data: {
          projectId: project.id,
          columnId: column.id,
          title: t.title,
          position: i,
          priority: t.priority ?? 'MEDIUM',
          bpm: t.bpm,
          musicalKey: t.musicalKey,
          dueDate: t.due === undefined ? null : inDays(t.due),
          assigneeId: t.mine ? owner.id : null,
          labels: { connect: (t.labels ?? []).map((l) => ({ id: labels[l]! })) },
          checklist: { create: (t.checklist ?? []).map(([text, done], p) => ({ text, done, position: p })) },
        },
      });
    }
  }
  await db.activity.create({
    data: { projectId: project.id, actorId: owner.id, summary: 'created the project' },
  });
  console.log(`Seeded "${project.title}" for @${username}`);
}

main().finally(() => db.$disconnect());
