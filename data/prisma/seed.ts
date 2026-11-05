/**
 * Adds a demo project with a populated board for an existing user (profiles are tied to real
 * Supabase Auth accounts, so the seed never invents users).
 *   SEED_USERNAME=yourname npm run db:seed
 */
import { existsSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

if (existsSync('../.env')) process.loadEnvFile('../.env');
const username = process.env.SEED_USERNAME?.toLowerCase();
if (!username) throw new Error('Set SEED_USERNAME to the username of an existing account');

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const board: Record<string, [string, Record<string, unknown>?][]> = {
  Ideas: [
    ['Chord loop in F#m', { bpm: 118, musicalKey: 'F#m' }],
    ['Find a vocal chop', { priority: 'LOW' }],
  ],
  Drafting: [
    ['Bassline with sidechain', { priority: 'HIGH' }],
    ['Drum groove', { bpm: 124 }],
  ],
  Arrangement: [['Build the second drop']],
  'Sound design': [['Pad automation']],
  Done: [['Reference track list']],
};

async function main() {
  const owner = await db.profile.findUnique({ where: { username } });
  if (!owner) throw new Error(`No profile @${username}. Sign up and open the app once first.`);
  const existing = await db.project.findFirst({
    where: { ownerId: owner.id, title: 'Midnight Drive (demo)' },
  });
  if (existing) return console.log('Demo project already exists — nothing to do.');
  const project = await db.project.create({
    data: {
      ownerId: owner.id,
      title: 'Midnight Drive (demo)',
      description: 'Seeded demo project.',
      template: 'production',
    },
  });
  let position = 0;
  for (const [title, tasks] of Object.entries(board)) {
    const column = await db.boardColumn.create({
      data: { projectId: project.id, title, position: position++ },
    });
    await db.task.createMany({
      data: tasks.map(([t, extra], i) => ({
        projectId: project.id,
        columnId: column.id,
        title: t,
        position: i,
        ...extra,
      })),
    });
  }
  console.log(`Seeded "${project.title}" for @${username}`);
}

main().finally(() => db.$disconnect());
